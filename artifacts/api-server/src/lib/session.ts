import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { authSessionsTable, db, notificationDeviceTokensTable, usersTable, type User } from "@workspace/db";

const MIN_IDLE_SECONDS = 5 * 60;
const MAX_IDLE_SECONDS = 30 * 24 * 60 * 60;
const MIN_ABSOLUTE_SECONDS = 60 * 60;
const MAX_ABSOLUTE_SECONDS = 365 * 24 * 60 * 60;

function boundedSeconds(name: string, fallback: number, min: number, max: number) {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${name} must be an integer between ${min} and ${max} seconds`);
  }
  return value;
}

export const SESSION_IDLE_SECONDS = boundedSeconds(
  "AUTH_SESSION_IDLE_SECONDS", 7 * 24 * 60 * 60, MIN_IDLE_SECONDS, MAX_IDLE_SECONDS,
);
export const SESSION_ABSOLUTE_SECONDS = boundedSeconds(
  "AUTH_SESSION_ABSOLUTE_SECONDS", 30 * 24 * 60 * 60, MIN_ABSOLUTE_SECONDS, MAX_ABSOLUTE_SECONDS,
);

function digestToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function newToken() {
  return randomBytes(32).toString("base64url");
}

export function bearerToken(authorization: string | undefined): string | null {
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
}

export type SessionLookup = {
  session: typeof authSessionsTable.$inferSelect;
  user: User;
};

export async function issueSession(user: User, replacementOfSessionId?: number) {
  if (user.isDevelopmentFixture) {
    throw new Error("Authentication failed");
  }
  const token = newToken();
  const now = new Date();
  const absoluteExpiresAt = new Date(now.getTime() + SESSION_ABSOLUTE_SECONDS * 1000);
  const idleExpiresAt = new Date(Math.min(
    absoluteExpiresAt.getTime(),
    now.getTime() + SESSION_IDLE_SECONDS * 1000,
  ));
  const [session] = await db.insert(authSessionsTable).values({
    userId: user.id,
    tokenHash: digestToken(token),
    absoluteExpiresAt,
    idleExpiresAt,
    lastUsedAt: now,
    replacementOfSessionId,
  }).returning();
  return { token, session };
}

export async function lookupSession(token: string): Promise<SessionLookup | null> {
  if (!token || token.length > 512) return null;
  const digest = digestToken(token);
  const now = new Date();
  const [record] = await db.select({ session: authSessionsTable, user: usersTable })
    .from(authSessionsTable)
    .innerJoin(usersTable, eq(usersTable.id, authSessionsTable.userId))
    .where(and(
      eq(authSessionsTable.tokenHash, digest),
      isNull(authSessionsTable.revokedAt),
      gt(authSessionsTable.absoluteExpiresAt, now),
      gt(authSessionsTable.idleExpiresAt, now),
    )).limit(1);
  if (!record) return null;
  if (record.user.isDevelopmentFixture) {
    return null;
  }
  const expected = Buffer.from(record.session.tokenHash, "hex");
  const supplied = Buffer.from(digest, "hex");
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;
  const idleExpiresAt = new Date(Math.min(
    record.session.absoluteExpiresAt.getTime(),
    now.getTime() + SESSION_IDLE_SECONDS * 1000,
  ));
  const [touched] = await db.update(authSessionsTable).set({ lastUsedAt: now, idleExpiresAt })
    .where(and(
      eq(authSessionsTable.id, record.session.id),
      isNull(authSessionsTable.revokedAt),
      gt(authSessionsTable.absoluteExpiresAt, now),
      gt(authSessionsTable.idleExpiresAt, now),
    )).returning();
  return touched ? { session: touched, user: record.user } : null;
}

export async function lookupAuthorization(authorization: string | undefined) {
  const token = bearerToken(authorization);
  return token ? lookupSession(token) : null;
}

export async function revokeSession(token: string, reason = "logout") {
  const found = await lookupSession(token);
  if (!found) return false;
  return db.transaction(async (tx) => {
    const now = new Date();
    const rows = await tx.update(authSessionsTable).set({
      revokedAt: now,
      revocationReason: reason,
    }).where(and(eq(authSessionsTable.id, found.session.id), isNull(authSessionsTable.revokedAt)))
      .returning({ id: authSessionsTable.id });
    if (rows.length) await tx.update(notificationDeviceTokensTable).set({
      revokedAt: now, updatedAt: now,
    }).where(and(eq(notificationDeviceTokensTable.sessionId, found.session.id),
      isNull(notificationDeviceTokensTable.revokedAt)));
    return rows.length === 1;
  });
}

export async function revokeAllUserSessions(
  userId: number,
  reason: string,
  executor: Pick<typeof db, "update"> = db,
) {
  const now = new Date();
  const revokedSessions = await executor.update(authSessionsTable).set({
    revokedAt: now,
    revocationReason: reason,
  }).where(and(eq(authSessionsTable.userId, userId), isNull(authSessionsTable.revokedAt)));
  await executor.update(notificationDeviceTokensTable).set({
    revokedAt: now, updatedAt: now,
  }).where(and(eq(notificationDeviceTokensTable.userId, userId),
    isNull(notificationDeviceTokensTable.revokedAt)));
  return revokedSessions;
}

export async function rotateSession(token: string) {
  const digest = digestToken(token);
  return db.transaction(async (tx) => {
    const now = new Date();
    const [old] = await tx.select().from(authSessionsTable)
      .where(and(
        eq(authSessionsTable.tokenHash, digest),
        isNull(authSessionsTable.revokedAt),
        gt(authSessionsTable.absoluteExpiresAt, now),
        gt(authSessionsTable.idleExpiresAt, now),
      )).limit(1).for("update");
    if (!old || !timingSafeEqual(Buffer.from(old.tokenHash, "hex"), Buffer.from(digest, "hex"))) return null;
    const [user] = await tx.select().from(usersTable).where(eq(usersTable.id, old.userId)).limit(1);
    if (!user) return null;
    if (user.isDevelopmentFixture) return null;
    const rawToken = newToken();
    // Rotation is part of the same session chain and must never reset its
    // absolute lifetime.
    const absoluteExpiresAt = old.absoluteExpiresAt;
    const idleExpiresAt = new Date(Math.min(absoluteExpiresAt.getTime(), now.getTime() + SESSION_IDLE_SECONDS * 1000));
    const [replacement] = await tx.insert(authSessionsTable).values({
      userId: user.id, tokenHash: digestToken(rawToken), absoluteExpiresAt, idleExpiresAt,
      lastUsedAt: now, replacementOfSessionId: old.id,
    }).returning();
    await tx.update(authSessionsTable).set({
      revokedAt: now, revocationReason: "rotation", replacedBySessionId: replacement.id,
    }).where(and(eq(authSessionsTable.id, old.id), isNull(authSessionsTable.revokedAt)));
    await tx.update(notificationDeviceTokensTable).set({
      revokedAt: now, updatedAt: now,
    }).where(and(eq(notificationDeviceTokensTable.sessionId, old.id),
      isNull(notificationDeviceTokensTable.revokedAt)));
    return { token: rawToken, session: replacement, user };
  });
}