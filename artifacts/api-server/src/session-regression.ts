import assert from "node:assert/strict";
import { eq, sql } from "drizzle-orm";
import { authSessionsTable, db, pool, usersTable } from "@workspace/db";
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

try {
  const first = await issueSession(user);
  assert.equal(Buffer.from(first.token, "base64url").length, 32, "token must contain 256 random bits");
  assert.notEqual(first.session.tokenHash, first.token, "only the token digest may be persisted");
  assert.equal((await lookupSession(first.token))?.user.id, user.id, "issued session must resolve");

  const second = await issueSession(user);
  assert.equal((await lookupSession(first.token))?.user.id, user.id, "issuing on another device must not revoke the first");
  assert.equal((await lookupSession(second.token))?.user.id, user.id, "second device session must resolve");

  assert.equal(await revokeSession(first.token), true, "logout must revoke the presented session");
  assert.equal(await lookupSession(first.token), null, "logged-out session must stop resolving");
  assert.equal((await lookupSession(second.token))?.user.id, user.id, "logout must not revoke other devices");

  const rotated = await rotateSession(second.token);
  assert.ok(rotated, "valid session must rotate");
  assert.equal(await lookupSession(second.token), null, "rotation must revoke the old token");
  assert.equal((await lookupSession(rotated.token))?.user.id, user.id, "rotation replacement must resolve");
  const [old] = await db.select().from(authSessionsTable).where(eq(authSessionsTable.id, second.session.id));
  assert.equal(old.replacedBySessionId, rotated.session.id, "rotation metadata must link both sessions");
  assert.equal(rotated.session.absoluteExpiresAt.getTime(), second.session.absoluteExpiresAt.getTime(),
    "rotation must preserve the original chain absolute expiry");

  const legacyColumn = await db.execute<{ column_name: string }>(sql`
    SELECT column_name FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = 'users' AND column_name = 'session_token'
  `);
  assert.equal(legacyColumn.rows.length, 0, "legacy users.session_token column must be removed");

  await db.update(authSessionsTable).set({ idleExpiresAt: new Date(Date.now() - 1_000) })
    .where(eq(authSessionsTable.id, rotated.session.id));
  assert.equal(await lookupSession(rotated.token), null, "idle-expired session must not resolve");

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
  await revokeAllUserSessions(user.id, "regression_test");
  assert.equal(await lookupSession(allA.token), null, "revoke-all must revoke first device");
  assert.equal(await lookupSession(allB.token), null, "revoke-all must revoke every device");
  console.log("session regression passed");
} finally {
  await db.delete(usersTable).where(eq(usersTable.id, user.id));
  await pool.end();
}