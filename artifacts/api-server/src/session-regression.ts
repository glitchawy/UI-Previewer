import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { and, eq, gt, isNull, sql } from "drizzle-orm";
import { authSessionsTable, db, notificationDeviceTokensTable, pool, usersTable } from "@workspace/db";
import { runMigrations } from "@workspace/db/migrate";
import {
  issueSession,
  lookupSession,
  revokeAllUserSessions,
  revokeSession,
  rotateSession,
} from "./lib/session";

await runMigrations();
const phone = `019${String(Date.now()).slice(-8)}`;
const [user] = await db.insert(usersTable).values({ phone, role: "customer" }).returning();
const [otherUser] = await db.insert(usersTable).values({
  phone: `018${String(Date.now()).slice(-8)}`, role: "customer",
}).returning();

const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");
const addDevice = async (userId: number, sessionId: number, token: string) => {
  const [device] = await db.insert(notificationDeviceTokensTable).values({
    userId, sessionId, token, tokenHash: tokenHash(token), platform: "android",
  }).returning();
  return device;
};
const activeDeviceCount = async (userId: number) => (await db.select({ id: notificationDeviceTokensTable.id })
  .from(notificationDeviceTokensTable)
  .innerJoin(authSessionsTable, eq(authSessionsTable.id, notificationDeviceTokensTable.sessionId))
  .where(and(eq(notificationDeviceTokensTable.userId, userId),
    isNull(notificationDeviceTokensTable.revokedAt),
    isNull(authSessionsTable.revokedAt),
    gt(authSessionsTable.absoluteExpiresAt, new Date()),
    gt(authSessionsTable.idleExpiresAt, new Date())))).length;

try {
  const first = await issueSession(user);
  const firstDevice = await addDevice(user.id, first.session.id, "ExpoPushToken[session-regression-logout]");
  assert.equal(Buffer.from(first.token, "base64url").length, 32, "token must contain 256 random bits");
  assert.notEqual(first.session.tokenHash, first.token, "only the token digest may be persisted");
  assert.equal((await lookupSession(first.token))?.user.id, user.id, "issued session must resolve");

  const second = await issueSession(user);
  assert.equal((await lookupSession(first.token))?.user.id, user.id, "issuing on another device must not revoke the first");
  assert.equal((await lookupSession(second.token))?.user.id, user.id, "second device session must resolve");

  assert.equal(await revokeSession(first.token), true, "logout must revoke the presented session");
  assert.equal(await lookupSession(first.token), null, "logged-out session must stop resolving");
  assert.ok((await db.select().from(notificationDeviceTokensTable)
    .where(eq(notificationDeviceTokensTable.id, firstDevice.id)))[0].revokedAt,
  "logout must revoke the session device");
  assert.equal((await lookupSession(second.token))?.user.id, user.id, "logout must not revoke other devices");

  const rotated = await rotateSession(second.token);
  assert.ok(rotated, "valid session must rotate");
  assert.equal(await lookupSession(second.token), null, "rotation must revoke the old token");
  assert.equal((await lookupSession(rotated.token))?.user.id, user.id, "rotation replacement must resolve");
  const [old] = await db.select().from(authSessionsTable).where(eq(authSessionsTable.id, second.session.id));
  assert.equal(old.replacedBySessionId, rotated.session.id, "rotation metadata must link both sessions");
  assert.equal(rotated.session.absoluteExpiresAt.getTime(), second.session.absoluteExpiresAt.getTime(),
    "rotation must preserve the original chain absolute expiry");
  const rotationDevice = await addDevice(user.id, rotated.session.id, "ExpoPushToken[session-regression-rotation]");
  const rotatedAgain = await rotateSession(rotated.token);
  assert.ok(rotatedAgain, "replacement session must rotate");
  assert.ok((await db.select().from(notificationDeviceTokensTable)
    .where(eq(notificationDeviceTokensTable.id, rotationDevice.id)))[0].revokedAt,
  "rotation must revoke devices linked to the replaced session");

  const legacyColumn = await db.execute<{ column_name: string }>(sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'session_token'
  `);
  assert.equal(legacyColumn.rows.length, 0, "legacy users.session_token column must be removed");

  await db.update(authSessionsTable).set({ idleExpiresAt: new Date(Date.now() - 1_000) })
    .where(eq(authSessionsTable.id, rotatedAgain.session.id));
  await addDevice(user.id, rotatedAgain.session.id, "ExpoPushToken[session-regression-expiry]");
  assert.equal(await lookupSession(rotatedAgain.token), null, "idle-expired session must not resolve");
  assert.equal(await activeDeviceCount(user.id), 0, "expired session devices must not be delivery targets");

  const absolute = await issueSession(user);
  await db.update(authSessionsTable).set({
    createdAt: new Date(Date.now() - 10_000),
    idleExpiresAt: new Date(Date.now() - 2_000),
    absoluteExpiresAt: new Date(Date.now() - 1_000),
  })
    .where(eq(authSessionsTable.id, absolute.session.id));
  assert.equal(await lookupSession(absolute.token), null, "absolute-expired session must not resolve");

  const allA = await issueSession(user);
  const allB = await issueSession(user);
  await addDevice(user.id, allA.session.id, "ExpoPushToken[session-regression-all-a]");
  await addDevice(user.id, allB.session.id, "ExpoPushToken[session-regression-all-b]");
  await revokeAllUserSessions(user.id, "regression_test");
  assert.equal(await lookupSession(allA.token), null, "revoke-all must revoke first device");
  assert.equal(await lookupSession(allB.token), null, "revoke-all must revoke every device");
  assert.equal(await activeDeviceCount(user.id), 0, "revoke-all must deactivate every linked device");

  const dedupeSession = await issueSession(user);
  const dedupeToken = "ExpoPushToken[session-regression-dedupe]";
  await addDevice(user.id, dedupeSession.session.id, dedupeToken);
  await db.insert(notificationDeviceTokensTable).values({
    userId: user.id, sessionId: dedupeSession.session.id, token: dedupeToken,
    tokenHash: tokenHash(dedupeToken), platform: "android",
  }).onConflictDoUpdate({
    target: notificationDeviceTokensTable.tokenHash,
    set: { sessionId: dedupeSession.session.id, activeAt: new Date(), revokedAt: null },
  });
  assert.equal((await db.select().from(notificationDeviceTokensTable)
    .where(eq(notificationDeviceTokensTable.tokenHash, tokenHash(dedupeToken)))).length, 1,
  "registering a token twice must deduplicate it");
  await assert.rejects(addDevice(otherUser.id, (await issueSession(otherUser)).session.id, dedupeToken),
    "a token owned by one account must not be insertable for another account");

  const raceSessionA = await issueSession(user);
  const raceSessionB = await issueSession(otherUser);
  const raceToken = `ExpoPushToken[session-race-${Date.now()}]`;
  const raceHash = tokenHash(raceToken);
  const atomicRegister = async (userId: number, sessionId: number) =>
    db.insert(notificationDeviceTokensTable).values({
      userId, sessionId, token: raceToken, tokenHash: raceHash, platform: "android",
    }).onConflictDoUpdate({
      target: notificationDeviceTokensTable.tokenHash,
      set: { userId, sessionId, activeAt: new Date(), revokedAt: null, updatedAt: new Date() },
      setWhere: eq(notificationDeviceTokensTable.userId, userId),
    }).returning({ userId: notificationDeviceTokensTable.userId });
  const raced = await Promise.all([
    atomicRegister(user.id, raceSessionA.session.id),
    atomicRegister(otherUser.id, raceSessionB.session.id),
  ]);
  assert.equal(raced.filter((result) => result.length === 1).length, 1,
    "exactly one account must win concurrent registration of the same token");
  const [raceOwner] = await db.select({ userId: notificationDeviceTokensTable.userId })
    .from(notificationDeviceTokensTable).where(eq(notificationDeviceTokensTable.tokenHash, raceHash));
  const loser = raceOwner.userId === user.id
    ? { userId: otherUser.id, sessionId: raceSessionB.session.id }
    : { userId: user.id, sessionId: raceSessionA.session.id };
  assert.equal((await atomicRegister(loser.userId, loser.sessionId)).length, 0,
    "the losing account must not steal the token on retry");
  assert.equal((await db.select({ userId: notificationDeviceTokensTable.userId })
    .from(notificationDeviceTokensTable)
    .where(eq(notificationDeviceTokensTable.tokenHash, raceHash)))[0].userId, raceOwner.userId,
  "token ownership must remain with the race winner");
  console.log("session regression passed");
} finally {
  await db.delete(notificationDeviceTokensTable).where(eq(notificationDeviceTokensTable.userId, user.id));
  await db.delete(notificationDeviceTokensTable).where(eq(notificationDeviceTokensTable.userId, otherUser.id));
  await db.delete(usersTable).where(eq(usersTable.id, user.id));
  await db.delete(usersTable).where(eq(usersTable.id, otherUser.id));
  await pool.end();
}