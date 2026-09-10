import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import {
  adminAccountsTable,
  adminPermissionGroupsTable,
  authSessionsTable,
  businessAuditLogsTable,
  db,
  ordersTable,
  paymentRefundClaimsTable,
  paymentSessionsTable,
  paymobWebhookInboxTable,
  pool,
  refundRequestsTable,
  restaurantSettlementsTable,
  usersTable,
  walletTransactionsTable,
} from "@workspace/db";
import { runMigrations } from "@workspace/db/migrate";
import app from "./app";
import { issueSession } from "./lib/session";
import { processPaymobInboxEvent } from "./lib/operations-worker";
import { finalizeProviderRefundClaim } from "./lib/provider-refunds";
import { creditWallet, debitWallet, toCents } from "./lib/wallet-ledger";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");

const prefix = `tb-reg-${Date.now()}-${randomUUID().slice(0, 8)}`;
const future = new Date(Date.now() + 60 * 60_000);
const userIds: number[] = [];
const orderIds: number[] = [];
const sessionIds: number[] = [];
const refundIds: number[] = [];
const claimIds: number[] = [];
const inboxIds: number[] = [];
let server: ReturnType<typeof app.listen> | undefined;

async function rejectsDb(operation: PromiseLike<unknown>, message: string) {
  let rejected = false;
  try {
    await operation;
  } catch {
    rejected = true;
  }
  assert.equal(rejected, true, message);
}

async function addInbox(
  session: typeof paymentSessionsTable.$inferSelect,
  suffix: string,
  overrides: Record<string, unknown> = {},
) {
  const transaction = {
    id: `${prefix}-txn-${suffix}`,
    success: true,
    pending: false,
    amount_cents: toCents(session.amount),
    currency: session.currency,
    integration_id: session.paymobIntegrationId,
    order: {
      id: session.paymobOrderId,
      merchant_order_id: session.reference,
    },
    ...overrides,
  };
  const [row] = await db.insert(paymobWebhookInboxTable).values({
    providerEventKey: `${prefix}:event:${suffix}`,
    payloadHash: `${prefix}:hash:${suffix}`,
    payload: { obj: transaction },
    status: "processing",
    leaseOwner: prefix,
    leaseExpiresAt: future,
  }).returning();
  inboxIds.push(row.id);
  await processPaymobInboxEvent(row.id);
  return (await db.select().from(paymobWebhookInboxTable)
    .where(eq(paymobWebhookInboxTable.id, row.id)).limit(1))[0]!;
}

async function createSession(
  customerId: number,
  suffix: string,
  amount = "10.00",
) {
  const [row] = await db.insert(paymentSessionsTable).values({
    customerId,
    reference: `${prefix}-reference-${suffix}`,
    amount,
    currency: "EGP",
    expiresAt: future,
    paymobIntegrationId: "123",
    paymobIntegrationIds: ["123", "456"],
    paymobOrderId: `${prefix}-provider-order-${suffix}`,
  }).returning();
  sessionIds.push(row.id);
  return row;
}

async function createOrder(
  customerId: number,
  paymentSessionId: number | null,
  suffix: string,
  walletAmountUsed: string,
  externalAmountDue: string,
) {
  const total = (
    Number(walletAmountUsed) + Number(externalAmountDue)
  ).toFixed(2);
  const [row] = await db.insert(ordersTable).values({
    customerId,
    restaurantId: 1,
    restaurantName: `${prefix}-restaurant`,
    paymentSessionId,
    paymentMethod: "card",
    paymentStatus: "pending",
    deliveryAddressText: `${prefix}-address-${suffix}`,
    deliveryLat: 30,
    deliveryLng: 31,
    deliveryFee: "0.00",
    subtotal: total,
    total,
    walletAmountUsed,
    externalAmountDue,
  }).returning();
  orderIds.push(row.id);
  return row;
}

async function main() {
  await runMigrations();

  const [customer] = await db.insert(usersTable).values({
    phone: `${prefix}-customer`,
    role: "customer",
    name: prefix,
    walletBalance: "20.00",
  }).returning();
  userIds.push(customer.id);

  // A captured session is monotonic despite pending, duplicate, and contradictory
  // terminal events.
  const paidSession = await createSession(customer.id, "paid");
  const paidOrder = await createOrder(customer.id, paidSession.id, "paid", "3.00", "10.00");
  await db.transaction((tx) => debitWallet(tx, {
    userId: customer.id,
    amountCents: 300,
    description: `${prefix}-paid-debit`,
    referenceType: "order_payment",
    referenceId: paidOrder.id,
  }));
  await addInbox(paidSession, "paid-success");
  await addInbox(paidSession, "paid-pending", { success: true, pending: true });
  await addInbox(paidSession, "paid-duplicate");
  const contradictoryPaid = await addInbox(paidSession, "paid-contradiction", { success: false });
  assert.equal(contradictoryPaid.status, "dead_letter");
  let [freshPaid] = await db.select().from(paymentSessionsTable)
    .where(eq(paymentSessionsTable.id, paidSession.id));
  assert.equal(freshPaid.status, "paid");
  assert.equal(Number(freshPaid.refundedAmount), 0);

  // A failed checkout restores its wallet allocation exactly once.
  const failedSession = await createSession(customer.id, "failed");
  const failedOrder = await createOrder(customer.id, failedSession.id, "failed", "4.00", "10.00");
  await db.transaction((tx) => debitWallet(tx, {
    userId: customer.id,
    amountCents: 400,
    description: `${prefix}-failed-debit`,
    referenceType: "order_payment",
    referenceId: failedOrder.id,
  }));
  await addInbox(failedSession, "failed-terminal", { success: false });
  await addInbox(failedSession, "failed-duplicate", { success: false });
  const contradictoryFailed = await addInbox(failedSession, "failed-contradiction");
  assert.equal(contradictoryFailed.status, "dead_letter");
  const [afterFailure] = await db.select().from(usersTable).where(eq(usersTable.id, customer.id));
  assert.equal(Number(afterFailure.walletBalance), 17);

  // Provider identity and accounting mismatches are quarantined, never applied.
  const mismatches = [
    ["amount", { amount_cents: 999 }],
    ["currency", { currency: "USD" }],
    ["integration", { integration_id: "999" }],
    ["reference", {
      order: {
        id: paidSession.paymobOrderId,
        merchant_order_id: `${prefix}-wrong-reference`,
      },
    }],
  ] as const;
  for (const [name, override] of mismatches) {
    const receipt = await addInbox(paidSession, `mismatch-${name}`, override);
    assert.equal(receipt.status, "dead_letter", `${name} mismatch must be quarantined`);
  }
  [freshPaid] = await db.select().from(paymentSessionsTable)
    .where(eq(paymentSessionsTable.id, paidSession.id));
  assert.equal(freshPaid.status, "paid");

  // Ledger helpers preserve balanceAfter continuity and make operation keys
  // idempotent. The database itself rejects mutation of accounting history.
  const firstCredit = await db.transaction((tx) => creditWallet(tx, {
    userId: customer.id,
    amountCents: 200,
    description: `${prefix}-idempotent-refund`,
    referenceType: "refund",
    referenceId: paidOrder.id,
  }));
  const duplicateCredit = await db.transaction((tx) => creditWallet(tx, {
    userId: customer.id,
    amountCents: 200,
    description: `${prefix}-idempotent-refund`,
    referenceType: "refund",
    referenceId: paidOrder.id,
  }));
  assert.equal(duplicateCredit.id, firstCredit.id);
  const ledger = await db.select().from(walletTransactionsTable)
    .where(eq(walletTransactionsTable.userId, customer.id))
    .orderBy(asc(walletTransactionsTable.id));
  let expectedBalance = 20;
  for (const entry of ledger) {
    expectedBalance += (entry.type === "credit" ? 1 : -1) * Number(entry.amount);
    assert.equal(Number(entry.balanceAfter), expectedBalance, "ledger balanceAfter continuity");
  }
  assert.equal(expectedBalance, 19);
  await rejectsDb(
    db.update(walletTransactionsTable).set({ description: `${prefix}-tampered` })
      .where(eq(walletTransactionsTable.id, firstCredit.id)),
    "wallet UPDATE must be rejected",
  );
  await rejectsDb(
    db.delete(walletTransactionsTable).where(eq(walletTransactionsTable.id, firstCredit.id)),
    "wallet DELETE must be rejected",
  );
  await rejectsDb(
    db.update(ordersTable).set({ walletAmountUsed: "2.00", externalAmountDue: "11.00" })
      .where(eq(ordersTable.id, paidOrder.id)),
    "order allocation mutation must be rejected",
  );

  // Both the database capture ceiling and the refund finalizer reject over-refund.
  await rejectsDb(
    db.update(paymentSessionsTable).set({ refundedAmount: "10.01" })
      .where(eq(paymentSessionsTable.id, paidSession.id)),
    "refunded total must not exceed capture",
  );
  const overOrder = await createOrder(customer.id, paidSession.id, "over-refund", "0.00", "11.00");
  const [overRefund] = await db.insert(refundRequestsTable).values({
    orderId: overOrder.id,
    customerId: customer.id,
    source: "cancellation",
    method: "paymob",
    status: "processing",
    amount: "11.00",
    reason: prefix,
  }).returning();
  refundIds.push(overRefund.id);
  const [overClaim] = await db.insert(paymentRefundClaimsTable).values({
    refundRequestId: overRefund.id,
    orderId: overOrder.id,
    paymentSessionId: paidSession.id,
    customerId: customer.id,
    paymobTransactionId: `${prefix}-refund-over`,
    amount: "11.00",
  }).returning();
  claimIds.push(overClaim.id);
  await assert.rejects(
    finalizeProviderRefundClaim(overClaim.id),
    /PAYMENT_REFUND_EXCEEDS_CAPTURE/,
  );

  // Competing inserts for the same accounting subject have one database winner.
  const claimOrder = await createOrder(customer.id, paidSession.id, "claim-race", "0.00", "10.00");
  const requests = await Promise.all((["customer_request", "cancellation"] as const).map(async (source) => {
    const [row] = await db.insert(refundRequestsTable).values({
      orderId: claimOrder.id,
      customerId: customer.id,
      source,
      method: "paymob",
      status: "processing",
      amount: "1.00",
      reason: `${prefix}-${source}`,
    }).returning();
    refundIds.push(row.id);
    return row;
  }));
  const race = await Promise.allSettled(requests.map((request, index) =>
    db.insert(paymentRefundClaimsTable).values({
      refundRequestId: request.id,
      orderId: claimOrder.id,
      paymentSessionId: paidSession.id,
      customerId: customer.id,
      paymobTransactionId: `${prefix}-race-${index}`,
      amount: "1.00",
    }).returning()
  ));
  assert.equal(race.filter((result) => result.status === "fulfilled").length, 1);
  const raceClaims = await db.select().from(paymentRefundClaimsTable)
    .where(eq(paymentRefundClaimsTable.orderId, claimOrder.id));
  claimIds.push(...raceClaims.map((row) => row.id));
  assert.equal(raceClaims.length, 1);

  // Permission checks execute through real routes and resolve every grant from DB.
  const [emptyGroup] = await db.insert(adminPermissionGroupsTable).values({
    key: `${prefix}-empty`,
    name: prefix,
    permissions: [],
  }).returning();
  const allPermissions = [
    "payments.read", "refunds.read", "settlements.read", "pricing.read",
    "commissions.read", "reports.export", "notifications.read", "settings.read",
    "reviews.read", "access.read",
  ];
  const [inactiveGroup] = await db.insert(adminPermissionGroupsTable).values({
    key: `${prefix}-inactive`,
    name: prefix,
    permissions: allPermissions,
  }).returning();
  const [admin, inactiveAdmin] = await db.insert(usersTable).values([
    { phone: `${prefix}-admin`, role: "admin", name: prefix },
    { phone: `${prefix}-inactive-admin`, role: "admin", name: prefix },
  ]).returning();
  userIds.push(admin.id, inactiveAdmin.id);
  await db.insert(adminAccountsTable).values([
    { userId: admin.id, permissionGroupId: emptyGroup.id, isActive: true },
    { userId: inactiveAdmin.id, permissionGroupId: inactiveGroup.id, isActive: false },
  ]);
  const adminToken = (await issueSession(admin)).token;
  const inactiveToken = (await issueSession(inactiveAdmin)).token;
  server = app.listen(0);
  const address = server.address();
  assert(address && typeof address === "object");
  const base = `http://127.0.0.1:${address.port}`;
  const paths = [
    "/api/admin/operations/payments",
    "/api/admin/refunds",
    "/api/admin/operations/settlements",
    "/api/admin/operations/pricing",
    "/api/admin/operations/restaurant-commissions",
    "/api/admin/operations/reports/orders.csv?start=2026-01-01&end=2026-01-02",
    "/api/admin/operations/notifications",
    "/api/admin/operations/settings",
    "/api/admin/operations/reviews",
    "/api/admin/access/groups",
  ];
  for (const path of paths) {
    const denied = await fetch(`${base}${path}`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(denied.status, 403, `${path} must deny an ungranted admin`);
    const inactive = await fetch(`${base}${path}`, {
      headers: { authorization: `Bearer ${inactiveToken}` },
    });
    assert.equal(inactive.status, 403, `${path} must deny an inactive admin`);
  }
  await db.update(adminPermissionGroupsTable).set({ permissions: ["pricing.read"] })
    .where(eq(adminPermissionGroupsTable.id, emptyGroup.id));
  const granted = await fetch(`${base}/api/admin/operations/pricing`, {
    headers: { authorization: `Bearer ${adminToken}` },
  });
  assert.equal(granted.status, 200, "an explicitly granted operation must be allowed");

  // Settlement financial snapshots and business audit records are immutable.
  const [settlement] = await db.insert(restaurantSettlementsTable).values({
    idempotencyKey: `${prefix}-settlement`,
    restaurantId: 1,
    periodStart: "2026-01-01",
    periodEnd: "2026-01-02",
    orderCount: 1,
    grossAmount: "10.00",
    commissionRate: "10.00",
    commissionAmount: "1.00",
    refundAmount: "0.00",
    netAmount: "9.00",
    createdByAdminId: admin.id,
  }).returning();
  const [audit] = await db.insert(businessAuditLogsTable).values({
    actorAdminId: admin.id,
    action: `${prefix}.test`,
    entityType: "regression",
    entityId: prefix,
    requestId: prefix,
  }).returning();
  await rejectsDb(
    db.update(restaurantSettlementsTable).set({ grossAmount: "99.00" })
      .where(eq(restaurantSettlementsTable.id, settlement.id)),
    "settlement financial snapshot UPDATE must be rejected",
  );
  await rejectsDb(
    db.delete(restaurantSettlementsTable).where(eq(restaurantSettlementsTable.id, settlement.id)),
    "settlement DELETE must be rejected",
  );
  await rejectsDb(
    db.update(businessAuditLogsTable).set({ action: `${prefix}.tampered` })
      .where(eq(businessAuditLogsTable.id, audit.id)),
    "business audit UPDATE must be rejected",
  );
  await rejectsDb(
    db.delete(businessAuditLogsTable).where(eq(businessAuditLogsTable.id, audit.id)),
    "business audit DELETE must be rejected",
  );

  console.log("payment, wallet, webhook, and admin regression passed");
}

try {
  await main();
} finally {
  if (server) {
    await new Promise<void>((resolve, reject) =>
      server!.close((error) => error ? reject(error) : resolve())
    );
  }
  // The regression proves append-only triggers above. Temporarily disabling only
  // those fixture guards is necessary to leave no regression accounting rows.
  await db.execute(sql`ALTER TABLE wallet_transactions DISABLE TRIGGER USER`);
  await db.execute(sql`ALTER TABLE business_audit_logs DISABLE TRIGGER USER`);
  await db.execute(sql`ALTER TABLE restaurant_settlements DISABLE TRIGGER USER`);
  try {
    if (userIds.length) {
      await db.delete(walletTransactionsTable)
        .where(inArray(walletTransactionsTable.userId, userIds));
    }
    await db.delete(businessAuditLogsTable).where(eq(businessAuditLogsTable.requestId, prefix));
    await db.delete(restaurantSettlementsTable)
      .where(eq(restaurantSettlementsTable.idempotencyKey, `${prefix}-settlement`));
  } finally {
    await db.execute(sql`ALTER TABLE wallet_transactions ENABLE TRIGGER USER`);
    await db.execute(sql`ALTER TABLE business_audit_logs ENABLE TRIGGER USER`);
    await db.execute(sql`ALTER TABLE restaurant_settlements ENABLE TRIGGER USER`);
  }
  if (inboxIds.length) {
    await db.delete(paymobWebhookInboxTable)
      .where(inArray(paymobWebhookInboxTable.id, inboxIds));
  }
  if (claimIds.length) {
    await db.delete(paymentRefundClaimsTable)
      .where(inArray(paymentRefundClaimsTable.id, claimIds));
  }
  if (refundIds.length) {
    await db.delete(refundRequestsTable)
      .where(inArray(refundRequestsTable.id, refundIds));
  }
  if (orderIds.length) {
    await db.execute(sql`DELETE FROM order_status_events WHERE order_id IN (${sql.join(orderIds.map((value) => sql`${value}`), sql`, `)})`);
    await db.delete(ordersTable).where(inArray(ordersTable.id, orderIds));
  }
  if (sessionIds.length) {
    await db.delete(paymentSessionsTable)
      .where(inArray(paymentSessionsTable.id, sessionIds));
  }
  if (userIds.length) {
    await db.delete(authSessionsTable).where(inArray(authSessionsTable.userId, userIds));
    await db.delete(adminAccountsTable).where(inArray(adminAccountsTable.userId, userIds));
    await db.delete(usersTable).where(inArray(usersTable.id, userIds));
  }
  await db.delete(adminPermissionGroupsTable)
    .where(and(
      sql`${adminPermissionGroupsTable.key} LIKE ${`${prefix}%`}`,
    ));
  await pool.end();
}