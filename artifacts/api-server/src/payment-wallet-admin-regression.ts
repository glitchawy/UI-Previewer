import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import {
  adminAccountsTable,
  adminPermissionGroupsTable,
  authSessionsTable,
  branchesTable,
  businessAuditLogsTable,
  cartItemsTable,
  db,
  orderItemsTable,
  ordersTable,
  notificationsTable,
  paymentRefundClaimsTable,
  paymentSessionsTable,
  paymobWebhookInboxTable,
  productAddonsTable,
  productVariantsTable,
  productsTable,
  pool,
  refundRequestsTable,
  restaurantsTable,
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
const checkoutFixtureRestaurantIds: number[] = [];
const checkoutFixtureBranchIds: number[] = [];
const checkoutFixtureProductIds: number[] = [];
const checkoutFixtureVariantIds: number[] = [];
const checkoutFixtureAddonIds: number[] = [];
let server: ReturnType<typeof app.listen> | undefined;
let adminPrivacyOrderId: number | undefined;

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

  // Public capability discovery is secret-free, and the order route must reject
  // an unavailable external-card amount before creating any durable allocation.
  const paymobEnvironmentKeys = [
    "PAYMOB_INTEGRATION_IDS",
    "PAYMOB_INTEGRATION_ID",
    "PAYMOB_PUBLIC_APP_URL",
    "PAYMOB_PUBLIC_KEY",
    "PAYMOB_SECRET_KEY",
    "PAYMOB_API_KEY",
    "PAYMOB_IFRAME_ID",
  ] as const;
  const savedPaymobEnvironment = new Map(
    paymobEnvironmentKeys.map((key) => [key, process.env[key]]),
  );
  for (const key of paymobEnvironmentKeys) delete process.env[key];
  try {
    const capability = await fetch(`${base}/api/payments/capabilities`);
    assert.equal(capability.status, 200);
    assert.deepEqual(await capability.json(), {
      cardPaymentsAvailable: false,
      provider: "paymob",
      status: "unavailable",
    });

    const checkoutCustomers = await db.insert(usersTable).values([
      {
        phone: `${prefix}-card-customer`,
        role: "customer",
        name: prefix,
        walletBalance: "0.00",
        addressText: prefix,
        lat: 30,
        lng: 31,
      },
      {
        phone: `${prefix}-cash-customer`,
        role: "customer",
        name: prefix,
        walletBalance: "0.00",
        addressText: prefix,
        lat: 30,
        lng: 31,
      },
      {
        phone: `${prefix}-wallet-customer`,
        role: "customer",
        name: prefix,
        walletBalance: "1000.00",
        addressText: prefix,
        lat: 30,
        lng: 31,
      },
      {
        phone: `${prefix}-options-customer`,
        role: "customer",
        name: prefix,
        walletBalance: "0.00",
        addressText: prefix,
        lat: 30,
        lng: 31,
      },
      {
        phone: `${prefix}-unavailable-customer`,
        role: "customer",
        name: prefix,
        walletBalance: "0.00",
        addressText: prefix,
        lat: 30,
        lng: 31,
      },
      {
        phone: `${prefix}-closed-customer`,
        role: "customer",
        name: prefix,
        walletBalance: "100.00",
        addressText: prefix,
        lat: 30,
        lng: 31,
      },
    ]).returning();
    userIds.push(...checkoutCustomers.map((row) => row.id));
    const [restaurant] = await db.insert(restaurantsTable).values({
      ownerUserId: checkoutCustomers[0]!.id,
      name: `${prefix}-checkout-restaurant`,
      address: prefix,
      lat: 30,
      lng: 31,
      status: "ACTIVE",
      hours: JSON.stringify(Object.fromEntries(
        ["SAT", "SUN", "MON", "TUE", "WED", "THU", "FRI"].map((day) => [
          day, { open: "00:00", close: "00:00", closed: false },
        ]),
      )),
    }).returning();
    checkoutFixtureRestaurantIds.push(restaurant.id);
    const [branch] = await db.insert(branchesTable).values({
      restaurantId: restaurant.id,
      name: prefix,
      address: prefix,
      lat: 30,
      lng: 31,
    }).returning();
    checkoutFixtureBranchIds.push(branch.id);
    const [product] = await db.insert(productsTable).values({
      restaurantId: restaurant.id,
      name: prefix,
      basePrice: "10.00",
    }).returning();
    checkoutFixtureProductIds.push(product.id);
    const [closedRestaurant] = await db.insert(restaurantsTable).values({
      ownerUserId: checkoutCustomers[5]!.id,
      name: `${prefix}-closed-restaurant`,
      address: prefix,
      lat: 30,
      lng: 31,
      status: "ACTIVE",
      hours: JSON.stringify(Object.fromEntries(
        ["SAT", "SUN", "MON", "TUE", "WED", "THU", "FRI"].map((day) => [
          day, { open: "10:00", close: "18:00", closed: true },
        ]),
      )),
    }).returning();
    checkoutFixtureRestaurantIds.push(closedRestaurant.id);
    const [closedBranch] = await db.insert(branchesTable).values({
      restaurantId: closedRestaurant.id,
      name: prefix,
      address: prefix,
      lat: 30,
      lng: 31,
      isOpen: true,
    }).returning();
    checkoutFixtureBranchIds.push(closedBranch.id);
    const [closedProduct] = await db.insert(productsTable).values({
      restaurantId: closedRestaurant.id,
      name: `${prefix}-closed-product`,
      basePrice: "10.00",
    }).returning();
    checkoutFixtureProductIds.push(closedProduct.id);
    await db.insert(cartItemsTable).values(checkoutCustomers.slice(0, 3).map((checkoutCustomer) => ({
      userId: checkoutCustomer.id,
      restaurantId: restaurant.id,
      productId: product.id,
      quantity: 1,
      unitPrice: "10.00",
    })));
    await db.insert(cartItemsTable).values({
      userId: checkoutCustomers[5]!.id,
      restaurantId: closedRestaurant.id,
      productId: closedProduct.id,
      quantity: 1,
      unitPrice: "10.00",
    });
    const [optionsProduct] = await db.insert(productsTable).values({
      restaurantId: restaurant.id,
      name: `${prefix}-options-product`,
      basePrice: "70.00",
    }).returning();
    checkoutFixtureProductIds.push(optionsProduct.id);
    const [optionVariant] = await db.insert(productVariantsTable).values({
      productId: optionsProduct.id,
      name: "وسط",
      priceDelta: "10.00",
      isDefault: true,
    }).returning();
    checkoutFixtureVariantIds.push(optionVariant.id);
    const [optionAddon] = await db.insert(productAddonsTable).values({
      productId: optionsProduct.id,
      name: "جبنة إضافية",
      price: "15.00",
    }).returning();
    checkoutFixtureAddonIds.push(optionAddon.id);
    const checkoutTokens = await Promise.all(checkoutCustomers.map(async (checkoutCustomer) =>
      (await issueSession(checkoutCustomer)).token
    ));
    const place = (index: number, body: Record<string, unknown>) => fetch(`${base}/api/orders`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${checkoutTokens[index]}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const unavailableCard = await place(0, { paymentMethod: "card" });
    assert.equal(unavailableCard.status, 503);
    assert.equal((await unavailableCard.json() as { code?: string }).code, "PAYMOB_UNAVAILABLE");
    assert.equal(
      (await db.select().from(ordersTable).where(eq(ordersTable.customerId, checkoutCustomers[0]!.id))).length,
      0,
    );
    assert.equal(
      (await db.select().from(paymentSessionsTable)
        .where(eq(paymentSessionsTable.customerId, checkoutCustomers[0]!.id))).length,
      0,
    );
    assert.equal(
      (await db.select().from(walletTransactionsTable)
        .where(eq(walletTransactionsTable.userId, checkoutCustomers[0]!.id))).length,
      0,
    );
    assert.equal(
      (await db.select().from(cartItemsTable)
        .where(eq(cartItemsTable.userId, checkoutCustomers[0]!.id))).length,
      1,
      "rejected card checkout must leave the cart untouched",
    );

    const closedOrder = await place(5, { paymentMethod: "cash", useWalletAmount: 10 });
    assert.equal(closedOrder.status, 409);
    assert.equal((await closedOrder.json() as { code?: string }).code, "RESTAURANT_NOT_ACCEPTING");
    assert.equal((await db.select().from(ordersTable)
      .where(eq(ordersTable.customerId, checkoutCustomers[5]!.id))).length, 0);
    assert.equal((await db.select().from(paymentSessionsTable)
      .where(eq(paymentSessionsTable.customerId, checkoutCustomers[5]!.id))).length, 0);
    assert.equal((await db.select().from(walletTransactionsTable)
      .where(eq(walletTransactionsTable.userId, checkoutCustomers[5]!.id))).length, 0);
    assert.equal((await db.select().from(notificationsTable)
      .where(eq(notificationsTable.userId, checkoutCustomers[5]!.id))).length, 0);
    assert.equal((await db.select().from(cartItemsTable)
      .where(eq(cartItemsTable.userId, checkoutCustomers[5]!.id))).length, 1);

    const cash = await place(1, { paymentMethod: "cash" });
    assert.equal(cash.status, 201, "cash checkout must remain available");
    const cashResult = await cash.json() as { orders: { id: number }[] };
    orderIds.push(...cashResult.orders.map((order) => order.id));
    adminPrivacyOrderId = cashResult.orders[0]?.id;

    const walletOnly = await place(2, { paymentMethod: "card", useWalletAmount: 1000 });
    assert.equal(walletOnly.status, 201, "a fully wallet-covered order must not require Paymob");
    const walletResult = await walletOnly.json() as {
      orders: { id: number; externalAmountDue: number }[];
      paymentSessionId: number | null;
    };
    orderIds.push(...walletResult.orders.map((order) => order.id));
    assert.equal(walletResult.paymentSessionId, null);
    assert.ok(walletResult.orders.every((order) => order.externalAmountDue === 0));

    // Construct the cart input exclusively from the real public menu response.
    // No client price is accepted: checkout recomputes 70 + 10 + 15 + 25.
    // Construct options from the canonical public menu while its branch and
    // schedule are both accepting orders.
    const menuResponse = await fetch(`${base}/api/restaurants/${restaurant.id}/menu`);
    assert.equal(menuResponse.status, 200);
    const menu = await menuResponse.json() as {
      products: {
        id: number;
        name: string;
        variants: { id: number; name: string }[];
        addons: { id: number; name: string }[];
      }[];
    };
    const apiProduct = menu.products.find((candidate) => candidate.id === optionsProduct.id);
    assert.ok(apiProduct);
    const apiVariant = apiProduct.variants.find((candidate) => candidate.name === "وسط");
    const apiAddon = apiProduct.addons.find((candidate) => candidate.name === "جبنة إضافية");
    assert.ok(apiVariant);
    assert.ok(apiAddon);
    const addFromApiShape = (index: number, productId: number, variantId: number | null, addonIds: number[]) =>
      fetch(`${base}/api/cart/items`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${checkoutTokens[index]}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({ productId, variantId, addonIds, quantity: 1 }),
      });
    const validCart = await addFromApiShape(3, apiProduct.id, apiVariant.id, [apiAddon.id]);
    assert.equal(validCart.status, 201);
    const validCartBody = await validCart.json() as { total: number };
    assert.equal(validCartBody.total, 95);
    const validOptionsOrder = await place(3, { paymentMethod: "cash" });
    assert.equal(validOptionsOrder.status, 201);
    const validOptionsResult = await validOptionsOrder.json() as {
      orders: { id: number; total: number }[];
    };
    orderIds.push(...validOptionsResult.orders.map((order) => order.id));
    assert.equal(validOptionsResult.orders[0]?.total, 120);
    const [storedOptionLine] = await db.select({
      unitPrice: orderItemsTable.unitPrice,
      addonPrice: orderItemsTable.addonPrice,
    }).from(orderItemsTable).where(eq(orderItemsTable.orderId, validOptionsResult.orders[0]!.id));
    assert.equal(Number(storedOptionLine.unitPrice), 95);
    assert.equal(Number(storedOptionLine.addonPrice), 15);

    // IDs from another product are rejected, even when the add-on itself exists.
    const tamperedCart = await addFromApiShape(4, product.id, null, [apiAddon.id]);
    assert.equal(tamperedCart.status, 400);
    const laterUnavailableCart = await addFromApiShape(4, apiProduct.id, apiVariant.id, [apiAddon.id]);
    assert.equal(laterUnavailableCart.status, 201);
    await db.update(productAddonsTable).set({ isAvailable: false }).where(eq(productAddonsTable.id, apiAddon.id));
    const unavailableOrder = await place(4, { paymentMethod: "cash" });
    assert.equal(unavailableOrder.status, 409);
    assert.equal(
      (await db.select().from(ordersTable).where(eq(ordersTable.customerId, checkoutCustomers[4]!.id))).length,
      0,
    );
    await db.update(productAddonsTable).set({ isAvailable: true }).where(eq(productAddonsTable.id, apiAddon.id));
    await db.update(cartItemsTable)
      .set({ restaurantId: -restaurant.id })
      .where(eq(cartItemsTable.userId, checkoutCustomers[4]!.id));
    const crossRestaurantOrder = await place(4, { paymentMethod: "cash" });
    assert.equal(crossRestaurantOrder.status, 409);
    assert.equal(
      (await db.select().from(ordersTable).where(eq(ordersTable.customerId, checkoutCustomers[4]!.id))).length,
      0,
    );
  } finally {
    for (const [key, value] of savedPaymobEnvironment) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }

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
  await db.update(adminPermissionGroupsTable).set({ permissions: ["pricing.read", "orders.read"] })
    .where(eq(adminPermissionGroupsTable.id, emptyGroup.id));
  const granted = await fetch(`${base}/api/admin/operations/pricing`, {
    headers: { authorization: `Bearer ${adminToken}` },
  });
  assert.equal(granted.status, 200, "an explicitly granted operation must be allowed");

  // Coordinates remain available to internal dispatch calculations, but no
  // customer or driver coordinate key or precise value may reach an admin.
  assert.ok(adminPrivacyOrderId);
  await db.update(ordersTable).set({
    deliveryLat: 30.123456,
    deliveryLng: 31.654321,
  }).where(eq(ordersTable.id, adminPrivacyOrderId));
  const adminDetailResponse = await fetch(`${base}/api/admin/core/orders/${adminPrivacyOrderId}`, {
    headers: { authorization: `Bearer ${adminToken}` },
  });
  assert.equal(adminDetailResponse.status, 200);
  const adminDetail = await adminDetailResponse.json() as Record<string, unknown>;
  const serializedAdminDetail = JSON.stringify(adminDetail);
  assert.doesNotMatch(serializedAdminDetail, /"(?:lat|lng|[A-Za-z]+Lat|[A-Za-z]+Lng)":/i);
  assert.equal(serializedAdminDetail.includes("30.123456"), false);
  assert.equal(serializedAdminDetail.includes("31.654321"), false);

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
    await db.execute(sql`DELETE FROM order_addons WHERE order_item_id IN (
      SELECT id FROM order_items WHERE order_id IN (${sql.join(orderIds.map((value) => sql`${value}`), sql`, `)})
    )`);
    await db.execute(sql`DELETE FROM order_items WHERE order_id IN (${sql.join(orderIds.map((value) => sql`${value}`), sql`, `)})`);
    await db.execute(sql`DELETE FROM order_status_events WHERE order_id IN (${sql.join(orderIds.map((value) => sql`${value}`), sql`, `)})`);
    await db.execute(sql`DELETE FROM notifications WHERE entity_type = 'order' AND entity_id IN (${sql.join(orderIds.map((value) => sql`${value}`), sql`, `)})`);
    await db.delete(ordersTable).where(inArray(ordersTable.id, orderIds));
  }
  if (sessionIds.length) {
    await db.delete(paymentSessionsTable)
      .where(inArray(paymentSessionsTable.id, sessionIds));
  }
  if (userIds.length) {
    await db.delete(cartItemsTable).where(inArray(cartItemsTable.userId, userIds));
  }
  if (checkoutFixtureProductIds.length) {
    if (checkoutFixtureAddonIds.length) {
      await db.delete(productAddonsTable).where(inArray(productAddonsTable.id, checkoutFixtureAddonIds));
    }
    if (checkoutFixtureVariantIds.length) {
      await db.delete(productVariantsTable).where(inArray(productVariantsTable.id, checkoutFixtureVariantIds));
    }
    await db.delete(productsTable).where(inArray(productsTable.id, checkoutFixtureProductIds));
  }
  if (checkoutFixtureBranchIds.length) {
    await db.delete(branchesTable).where(inArray(branchesTable.id, checkoutFixtureBranchIds));
  }
  if (checkoutFixtureRestaurantIds.length) {
    await db.delete(restaurantsTable).where(inArray(restaurantsTable.id, checkoutFixtureRestaurantIds));
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