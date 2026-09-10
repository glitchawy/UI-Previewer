import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { eq, inArray, like, sql } from "drizzle-orm";
import {
  db,
  notificationOutboxTable,
  notificationsTable,
  paymobWebhookInboxTable,
  pool,
  usersTable,
} from "@workspace/db";
import { runMigrations } from "@workspace/db/migrate";
import app from "./app";
import { processNotification } from "./lib/operations-worker";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
process.env.PAYMOB_HMAC_SECRET = "operations-worker-regression-secret";

const transaction = {
  amount_cents: 1000,
  created_at: "2026-01-01T00:00:00Z",
  currency: "EGP",
  error_occured: false,
  has_parent_transaction: false,
  id: `regression-${Date.now()}`,
  integration_id: 123,
  is_3d_secure: false,
  is_auth: false,
  is_capture: true,
  is_refunded: false,
  is_standalone_payment: true,
  is_voided: false,
  order: { id: `order-${Date.now()}`, merchant_order_id: `TB-REG-${Date.now()}` },
  owner: 1,
  pending: false,
  source_data: { pan: "2346", sub_type: "MasterCard", type: "card" },
  success: true,
};

function signedPayload(value: typeof transaction) {
  const canonical = [
    value.amount_cents, value.created_at, value.currency, value.error_occured,
    value.has_parent_transaction, value.id, value.integration_id, value.is_3d_secure,
    value.is_auth, value.is_capture, value.is_refunded, value.is_standalone_payment,
    value.is_voided, value.order.id, value.owner, value.pending,
    value.source_data.pan, value.source_data.sub_type, value.source_data.type, value.success,
  ].map(String).join("");
  return {
    hmac: createHmac("sha512", process.env.PAYMOB_HMAC_SECRET!).update(canonical).digest("hex"),
    payload: JSON.stringify({ obj: value }),
  };
}
const terminal = signedPayload(transaction);
let fanoutUserIds: number[] = [];
let fanoutOutboxId: number | undefined;
const fanoutPrefix = `fanout-${Date.now()}-${process.pid}`;

await runMigrations();
const server = app.listen(0);
try {
  const address = server.address();
  assert(address && typeof address === "object");
  const endpoint = `http://127.0.0.1:${address.port}/api/webhooks/paymob`;
  const before = await db.select({ value: sql<number>`count(*)` }).from(paymobWebhookInboxTable);
  const bad = await fetch(endpoint, {
    method: "POST", headers: { "content-type": "application/json", "x-paymob-hmac": "00" }, body: terminal.payload,
  });
  assert.equal(bad.status, 401);
  const afterBad = await db.select({ value: sql<number>`count(*)` }).from(paymobWebhookInboxTable);
  assert.equal(Number(afterBad[0]?.value), Number(before[0]?.value), "bad HMAC must not be persisted");

  const pending = signedPayload({ ...transaction, pending: true, success: false });
  const pendingResponse = await fetch(`${endpoint}?hmac=${pending.hmac}`, {
    method: "POST", headers: { "content-type": "application/json" }, body: pending.payload,
  });
  assert.equal(pendingResponse.status, 202);
  for (let index = 0; index < 2; index += 1) {
    const response = await fetch(`${endpoint}?hmac=${terminal.hmac}`, {
      method: "POST", headers: { "content-type": "application/json" }, body: terminal.payload,
    });
    assert.equal(response.status, 202);
  }
  const rows = await db.select().from(paymobWebhookInboxTable)
    .where(like(paymobWebhookInboxTable.providerEventKey, `transaction:${transaction.id}:%`));
  assert.equal(rows.length, 2,
    "pending and terminal states must both persist while an identical terminal retry dedupes");
  const terminalHash = createHash("sha256").update(terminal.payload).digest("hex");
  const terminalRow = rows.find((row) => row.payloadHash === terminalHash);
  assert.ok(terminalRow, "terminal callback must have its own durable receipt");

  await db.update(paymobWebhookInboxTable).set({
    status: "processing", leaseOwner: "crashed", leaseExpiresAt: new Date(Date.now() - 1000),
  }).where(eq(paymobWebhookInboxTable.id, terminalRow.id));
  const claims = await Promise.all(["worker-a", "worker-b"].map(async (owner) => {
    const result = await db.execute(sql`
      UPDATE paymob_webhook_inbox AS work
      SET status = 'processing', lease_owner = ${owner}, lease_expires_at = now() + interval '1 minute'
      WHERE work.id IN (
        SELECT id FROM paymob_webhook_inbox
        WHERE id = ${terminalRow.id} AND status = 'processing' AND lease_expires_at <= now()
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id
    `);
    return result.rows.length;
  }));
  assert.equal(claims.reduce((sum, value) => sum + value, 0), 1, "expired lease must be recovered once");

  const fanoutUsers = await db.insert(usersTable).values(Array.from({ length: 501 }, (_, index) => ({
    phone: `${fanoutPrefix}-${index}`,
    role: "customer" as const,
  }))).returning({ id: usersTable.id });
  fanoutUserIds = fanoutUsers.map((user) => user.id);
  const [fanout] = await db.insert(notificationOutboxTable).values({
    eventType: "REGRESSION_FANOUT",
    audience: { role: "customer" },
    title: "fanout regression",
    body: "fanout regression",
    deduplicationKey: fanoutPrefix,
    createdByAdminId: 1,
    status: "processing",
  }).returning();
  fanoutOutboxId = fanout.id;
  await processNotification(fanout.id);
  const [partial] = await db.select().from(notificationOutboxTable)
    .where(eq(notificationOutboxTable.id, fanout.id));
  assert.equal(partial.status, "pending", "fanout must persist progress after a bounded batch");
  assert.ok(partial.recipientCursor > 0, "fanout must advance its durable recipient cursor");
  let complete = partial;
  for (let batch = 0; complete.status !== "sent" && batch < 100; batch += 1) {
    await db.update(notificationOutboxTable).set({ status: "processing" })
      .where(eq(notificationOutboxTable.id, fanout.id));
    await processNotification(fanout.id);
    [complete] = await db.select().from(notificationOutboxTable)
      .where(eq(notificationOutboxTable.id, fanout.id));
  }
  assert.equal(complete.status, "sent", "fanout must be sent only after no recipients remain");
  const delivered = await db.select({ value: sql<number>`count(*)` }).from(notificationsTable)
    .where(inArray(notificationsTable.userId, fanoutUserIds));
  assert.equal(Number(delivered[0]?.value), 501, "fanout must not truncate recipients at a fixed cap");
  console.log("operations worker regression passed");
} finally {
  await db.delete(notificationsTable)
    .where(like(notificationsTable.deduplicationKey, `${fanoutPrefix}:%`));
  if (fanoutOutboxId) {
    await db.delete(notificationOutboxTable).where(eq(notificationOutboxTable.id, fanoutOutboxId));
  }
  if (fanoutUserIds.length) await db.delete(usersTable).where(inArray(usersTable.id, fanoutUserIds));
  await db.delete(paymobWebhookInboxTable)
    .where(like(paymobWebhookInboxTable.providerEventKey, `transaction:${transaction.id}:%`));
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await pool.end();
}