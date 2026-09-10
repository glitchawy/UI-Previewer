import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import { eq, inArray, like, sql } from "drizzle-orm";
import {
  db,
  businessAuditLogsTable,
  cashOrderReconciliationsTable,
  driverCommissionRulesTable,
  driverEarningsTable,
  driverProfilesTable,
  notificationOutboxTable,
  notificationDeliveryAttemptsTable,
  notificationsTable,
  paymobWebhookInboxTable,
  platformRevenueAllocationsTable,
  restaurantSettlementsTable,
  restaurantsTable,
  ordersTable,
  walletTransactionsTable,
  pool,
  usersTable,
} from "@workspace/db";
import { runMigrations } from "@workspace/db/migrate";
import app from "./app";
import {
  enqueueCashOrderReconciliations,
  processNotification,
  skipIneligibleCashOrderReconciliations,
} from "./lib/operations-worker";
import { processNotificationDelivery } from "./lib/notification-delivery";
import { settleDeliveredCashOrder } from "./lib/cash-order-accounting";

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
let privacyNotificationId: number | undefined;
let refundedFixture: { orderId: number; restaurantId: number; userIds: number[] } | undefined;
const fanoutPrefix = `fanout-${Date.now()}-${process.pid}`;

await runMigrations();
{
  const fixture = `refunded-cash-${Date.now()}-${process.pid}`;
  const [owner, customer] = await db.insert(usersTable).values([
    { phone: `${fixture}-owner`, role: "partner" as const },
    { phone: `${fixture}-customer`, role: "customer" as const },
  ]).returning();
  const [restaurant] = await db.insert(restaurantsTable).values({
    ownerUserId: owner.id, name: fixture, address: fixture, status: "ACTIVE",
  }).returning();
  const [order] = await db.insert(ordersTable).values({
    customerId: customer.id, restaurantId: restaurant.id, restaurantName: fixture,
    status: "delivered", paymentMethod: "cash", paymentStatus: "refunded",
    deliveryAddressText: fixture, deliveryLat: 30, deliveryLng: 31,
    subtotal: "100.00", deliveryFee: "25.00", total: "125.00",
    walletAmountUsed: "0.00", externalAmountDue: "125.00", deliveredAt: new Date(),
  }).returning();
  refundedFixture = { orderId: order.id, restaurantId: restaurant.id, userIds: [owner.id, customer.id] };
  await db.insert(cashOrderReconciliationsTable).values({
    orderId: order.id, status: "dead_letter", attemptCount: 8,
    deadLetteredAt: new Date(), lastError: "DELIVERED_ORDER_DRIVER_REQUIRED",
  });
  assert.ok(await skipIneligibleCashOrderReconciliations() >= 1);
  assert.equal(await skipIneligibleCashOrderReconciliations(), 0, "skipped recovery must not replay");
  const [work] = await db.select().from(cashOrderReconciliationsTable)
    .where(eq(cashOrderReconciliationsTable.orderId, order.id));
  assert.equal(work.status, "skipped");
  assert.equal(work.safeReason, "REFUNDED_ORDER_NOT_SETTLEMENT_ELIGIBLE");
  assert.equal(work.deadLetteredAt, null);
  const [unchanged] = await db.select().from(ordersTable).where(eq(ordersTable.id, order.id));
  assert.equal(unchanged.paymentStatus, "refunded");
  assert.equal((await db.select().from(restaurantSettlementsTable)
    .where(eq(restaurantSettlementsTable.orderId, order.id))).length, 0);
  assert.equal((await db.select().from(driverEarningsTable)
    .where(eq(driverEarningsTable.orderId, order.id))).length, 0);
  assert.equal((await db.select().from(platformRevenueAllocationsTable)
    .where(eq(platformRevenueAllocationsTable.orderId, order.id))).length, 0);
  assert.equal((await db.select().from(walletTransactionsTable)
    .where(eq(walletTransactionsTable.referenceId, order.id))).length, 0);
  assert.equal((await db.select().from(businessAuditLogsTable).where(eq(
    businessAuditLogsTable.requestId, `cash-order-reconciliation-skipped:${order.id}`,
  ))).length, 1);
}
const rollbackMarker = new Error("ROLLBACK_CASH_ACCOUNTING_REGRESSION");
await assert.rejects(db.transaction(async (tx) => {
  const fixture = `cash-accounting-${Date.now()}-${process.pid}`;
  const [owner, driverUser, customer] = await tx.insert(usersTable).values([
    { phone: `${fixture}-owner`, role: "partner" as const },
    { phone: `${fixture}-driver`, role: "driver" as const },
    { phone: `${fixture}-customer`, role: "customer" as const },
  ]).returning();
  const [restaurant] = await tx.insert(restaurantsTable).values({
    ownerUserId: owner.id, name: fixture, address: fixture, status: "ACTIVE",
  }).returning();
  const [driver] = await tx.insert(driverProfilesTable).values({
    userId: driverUser.id, fullName: fixture, area: fixture, vehicleType: "bike",
    status: "APPROVED", isOnline: true, currentLat: 30, currentLng: 31,
    locationUpdatedAt: new Date(), dispatchLat: 30.01, dispatchLng: 31.01,
    dispatchLocationUpdatedAt: new Date(), dispatchLocationSource: "foreground_idle",
  }).returning();
  await tx.insert(driverCommissionRulesTable).values({
    name: fixture, scope: "all", driverShareRate: "65.00", bonusPerOrder: "0.00",
    isActive: true, createdByAdminId: owner.id, updatedByAdminId: owner.id,
    updatedAt: new Date("2099-01-01T00:00:00Z"),
  });
  const [delivered] = await tx.insert(ordersTable).values({
    customerId: customer.id, restaurantId: restaurant.id, restaurantName: fixture,
    driverProfileId: driver.id, status: "delivered", paymentMethod: "cash",
    paymentStatus: "pending", deliveryAddressText: fixture, deliveryLat: 30, deliveryLng: 31,
    subtotal: "100.00", deliveryFee: "25.00", total: "125.00",
    walletAmountUsed: "0.00", externalAmountDue: "125.00", deliveredAt: new Date(),
  }).returning();
  const [otherActive] = await tx.insert(ordersTable).values({
    customerId: customer.id, restaurantId: restaurant.id, restaurantName: fixture,
    driverProfileId: driver.id, status: "ready", paymentMethod: "cash",
    deliveryAddressText: fixture, deliveryLat: 30, deliveryLng: 31,
    subtotal: "10.00", deliveryFee: "5.00", total: "15.00",
    walletAmountUsed: "0.00", externalAmountDue: "15.00",
  }).returning();
  await tx.insert(cashOrderReconciliationsTable).values({
    orderId: delivered.id, status: "processed", processedAt: new Date(),
  });
  await enqueueCashOrderReconciliations(tx, delivered.id);
  const [requeued] = await tx.select().from(cashOrderReconciliationsTable)
    .where(eq(cashOrderReconciliationsTable.orderId, delivered.id));
  assert.equal(requeued.status, "pending", "processed legacy work must requeue for new invariants");
  assert.equal(requeued.attemptCount, 0);
  await settleDeliveredCashOrder(tx, delivered.id);
  await settleDeliveredCashOrder(tx, delivered.id);
  const [earning] = await tx.select().from(driverEarningsTable)
    .where(eq(driverEarningsTable.orderId, delivered.id));
  const [settlement] = await tx.select().from(restaurantSettlementsTable)
    .where(eq(restaurantSettlementsTable.orderId, delivered.id));
  const allocations = await tx.select().from(platformRevenueAllocationsTable)
    .where(eq(platformRevenueAllocationsTable.orderId, delivered.id));
  assert.equal(Number(earning.netAmount), 16.25, "non-default driver share must be exact");
  assert.equal(Number(settlement.netAmount), 100);
  assert.equal(Number(settlement.commissionAmount), 0);
  assert.equal(settlement.status, "pending", "delivery must not approve or pay restaurant payout");
  assert.equal(allocations.length, 1, "platform delivery share must be exactly-once");
  assert.equal(Number(allocations[0]!.amount), 8.75);
  assert.equal(Number(settlement.netAmount) + Number(settlement.commissionAmount), 100);
  assert.equal(Number(earning.netAmount) + Number(allocations[0]!.amount), 25);
  let [location] = await tx.select().from(driverProfilesTable)
    .where(eq(driverProfilesTable.id, driver.id));
  assert.equal(location.currentLat, 30, "another active order must retain precise location");
  await tx.delete(ordersTable).where(eq(ordersTable.id, otherActive.id));
  await settleDeliveredCashOrder(tx, delivered.id);
  [location] = await tx.select().from(driverProfilesTable)
    .where(eq(driverProfilesTable.id, driver.id));
  assert.equal(location.currentLat, null);
  assert.equal(location.locationUpdatedAt, null);
  assert.equal(location.dispatchLat, 30.01, "foreground dispatch location must be preserved");
  assert.equal(location.dispatchLocationSource, "foreground_idle");
  throw rollbackMarker;
}), error => error === rollbackMarker);
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

  const [privacyUser] = fanoutUsers;
  const [privacyNotification] = await db.insert(notificationsTable).values({
    userId: privacyUser.id,
    eventType: "PRIVACY_REGRESSION",
    title: "privacy",
    body: "privacy",
    deduplicationKey: `${fanoutPrefix}:privacy`,
  }).returning();
  privacyNotificationId = privacyNotification.id;
  const [privacyAttempt] = await db.insert(notificationDeliveryAttemptsTable).values({
    notificationId: privacyNotification.id,
    channel: "webhook",
    status: "processing",
    payload: { title: "privacy", body: "privacy" },
    deduplicationKey: `${fanoutPrefix}:privacy:webhook`,
  }).returning();
  process.env.NOTIFICATION_WEBHOOK_URL = "https://notifications.invalid/delivery";
  let outboundCalls = 0;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    outboundCalls += 1;
    return new Response(null, { status: 204 });
  };
  try {
    await processNotificationDelivery(privacyAttempt.id);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.NOTIFICATION_WEBHOOK_URL;
  }
  const [privacyResult] = await db.select().from(notificationDeliveryAttemptsTable)
    .where(eq(notificationDeliveryAttemptsTable.id, privacyAttempt.id));
  assert.equal(privacyResult.status, "skipped", "recipient without an active session must terminate as skipped");
  assert.equal(privacyResult.lastError, "NO_ACTIVE_SESSION");
  assert.equal(outboundCalls, 0, "inactive-session webhook delivery must not make outbound HTTP");
  console.log("operations worker regression passed");
} finally {
  if (refundedFixture) {
    await db.delete(cashOrderReconciliationsTable)
      .where(eq(cashOrderReconciliationsTable.orderId, refundedFixture.orderId));
    await db.execute(sql`ALTER TABLE business_audit_logs DISABLE TRIGGER USER`);
    try {
      await db.delete(businessAuditLogsTable).where(eq(
        businessAuditLogsTable.requestId,
        `cash-order-reconciliation-skipped:${refundedFixture.orderId}`,
      ));
    } finally {
      await db.execute(sql`ALTER TABLE business_audit_logs ENABLE TRIGGER USER`);
    }
    await db.delete(ordersTable).where(eq(ordersTable.id, refundedFixture.orderId));
    await db.delete(restaurantsTable).where(eq(restaurantsTable.id, refundedFixture.restaurantId));
    await db.delete(usersTable).where(inArray(usersTable.id, refundedFixture.userIds));
  }
  if (privacyNotificationId) {
    await db.delete(notificationDeliveryAttemptsTable)
      .where(eq(notificationDeliveryAttemptsTable.notificationId, privacyNotificationId));
  }
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