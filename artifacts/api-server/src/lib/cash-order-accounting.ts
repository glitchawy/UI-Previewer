import { and, desc, eq, inArray, ne, sql } from "drizzle-orm";
import {
  driverCommissionRulesTable,
  driverEarningsTable,
  driverProfilesTable,
  ordersTable,
  platformRevenueAllocationsTable,
  restaurantCommissionsTable,
  restaurantsTable,
  restaurantSettlementsTable,
} from "@workspace/db";
import { creditWallet, fromCents, toCents, type DbTransaction } from "./wallet-ledger";

/**
 * Posts the canonical per-order settlement snapshots. The caller must hold the
 * order advisory lock and run this in the same transaction as delivery.
 */
export async function settleDeliveredCashOrder(tx: DbTransaction, orderId: number) {
  const [order] = await tx.select().from(ordersTable).where(eq(ordersTable.id, orderId)).limit(1);
  if (!order || order.status !== "delivered" || order.paymentMethod !== "cash") {
    throw new Error("CASH_DELIVERED_ORDER_REQUIRED");
  }
  if (order.paymentStatus !== "pending" && order.paymentStatus !== "paid") {
    throw new Error("CASH_ORDER_PAYMENT_NOT_SETTLEMENT_ELIGIBLE");
  }
  if (!order.driverProfileId) throw new Error("DELIVERED_ORDER_DRIVER_REQUIRED");
  await tx.execute(sql`SELECT pg_advisory_xact_lock(78240, ${order.driverProfileId})`);

  const [restaurant] = await tx.select().from(restaurantsTable)
    .where(eq(restaurantsTable.id, order.restaurantId)).limit(1);
  const [driver] = await tx.select().from(driverProfilesTable)
    .where(eq(driverProfilesTable.id, order.driverProfileId)).limit(1);
  const [commission] = await tx.select().from(restaurantCommissionsTable)
    .where(eq(restaurantCommissionsTable.restaurantId, order.restaurantId)).limit(1);
  const [rule] = await tx.select().from(driverCommissionRulesTable)
    .where(eq(driverCommissionRulesTable.isActive, true))
    .orderBy(desc(driverCommissionRulesTable.updatedAt)).limit(1);
  const existingEarning = await tx.select().from(driverEarningsTable)
    .where(eq(driverEarningsTable.orderId, order.id)).limit(1);
  const existingSettlement = await tx.select().from(restaurantSettlementsTable)
    .where(eq(restaurantSettlementsTable.orderId, order.id)).limit(1);
  if (!restaurant || !driver) throw new Error("CASH_SETTLEMENT_PARTY_NOT_FOUND");

  const subtotalCents = toCents(order.subtotal);
  const deliveryFeeCents = toCents(order.deliveryFee);
  const totalCents = toCents(order.total);
  const walletCents = toCents(order.walletAmountUsed);
  const externalCents = toCents(order.externalAmountDue);
  if (walletCents + externalCents !== totalCents || subtotalCents + deliveryFeeCents !== totalCents) {
    throw new Error("ORDER_ALLOCATION_DOES_NOT_BALANCE");
  }
  const commissionRate = Number(commission?.rate ?? 0);
  const commissionCents = existingSettlement[0]
    ? toCents(existingSettlement[0].commissionAmount)
    : Math.round(subtotalCents * commissionRate / 100);
  const restaurantNetCents = existingSettlement[0]
    ? toCents(existingSettlement[0].netAmount)
    : subtotalCents - commissionCents;
  const shareRate = Number(rule?.driverShareRate ?? 70);
  const bonusCents = toCents(rule?.bonusPerOrder ?? 0);
  const driverNetCents = existingEarning[0]
    ? toCents(existingEarning[0].netAmount)
    : Math.round(deliveryFeeCents * shareRate / 100) + bonusCents;
  if (driverNetCents > deliveryFeeCents) throw new Error("DRIVER_EARNING_EXCEEDS_DELIVERY_FEE");
  const platformDeliveryShareCents = deliveryFeeCents - driverNetCents;
  if (restaurantNetCents + commissionCents !== subtotalCents ||
      driverNetCents + platformDeliveryShareCents !== deliveryFeeCents ||
      restaurantNetCents + commissionCents + driverNetCents + platformDeliveryShareCents !==
        externalCents + walletCents) {
    throw new Error("ORDER_ACCOUNTING_DOES_NOT_BALANCE");
  }

  const earning = existingEarning[0] ?? (await tx.insert(driverEarningsTable).values({
    orderId: order.id,
    driverProfileId: driver.id,
    deliveryFee: fromCents(deliveryFeeCents),
    shareRate: shareRate.toFixed(2),
    bonus: fromCents(bonusCents),
    netAmount: fromCents(driverNetCents),
  }).onConflictDoNothing().returning())[0];
  if (!earning) {
    const [concurrent] = await tx.select().from(driverEarningsTable)
      .where(eq(driverEarningsTable.orderId, order.id)).limit(1);
    if (!concurrent) throw new Error("DRIVER_EARNING_POST_FAILED");
  }

  const accountingDate = (order.deliveredAt ?? new Date()).toISOString().slice(0, 10);
  await tx.insert(restaurantSettlementsTable).values({
    idempotencyKey: `cash-order:${order.id}`,
    orderId: order.id,
    restaurantId: order.restaurantId,
    periodStart: accountingDate,
    periodEnd: accountingDate,
    orderCount: 1,
    grossAmount: fromCents(subtotalCents),
    commissionRate: (existingSettlement[0]
      ? Number(existingSettlement[0].commissionRate)
      : commissionRate).toFixed(2),
    commissionAmount: fromCents(commissionCents),
    refundAmount: "0.00",
    netAmount: fromCents(restaurantNetCents),
    createdByAdminId: null,
  }).onConflictDoNothing();
  await tx.insert(platformRevenueAllocationsTable).values({
    reference: `cash-order:${order.id}:delivery-fee-share`,
    kind: "delivery_fee_share",
    source: "cash_delivery",
    orderId: order.id,
    paymentMethod: "cash",
    paymentSessionId: order.paymentSessionId,
    restaurantId: order.restaurantId,
    driverProfileId: driver.id,
    amount: fromCents(platformDeliveryShareCents),
  }).onConflictDoNothing();

  if (restaurantNetCents > 0) await creditWallet(tx, {
    userId: restaurant.ownerUserId,
    amountCents: restaurantNetCents,
    description: `Cash order ${order.id} restaurant settlement`,
    referenceType: "restaurant_settlement",
    referenceId: order.id,
  });
  if (driverNetCents > 0) await creditWallet(tx, {
    userId: driver.userId,
    amountCents: driverNetCents,
    description: `Cash order ${order.id} driver earning`,
    referenceType: "driver_earning",
    referenceId: order.id,
  });
  await tx.update(ordersTable).set({ paymentStatus: "paid" })
    .where(eq(ordersTable.id, order.id));

  const [otherActive] = await tx.select({ id: ordersTable.id }).from(ordersTable).where(and(
    eq(ordersTable.driverProfileId, driver.id),
    ne(ordersTable.id, order.id),
    inArray(ordersTable.status, ["ready", "picked_up"]),
  )).limit(1);
  if (!otherActive) {
    await tx.update(driverProfilesTable).set({
      currentLat: null,
      currentLng: null,
      locationUpdatedAt: null,
      ...(driver.dispatchLocationSource === "active_tracking" ? {
        dispatchLat: null,
        dispatchLng: null,
        dispatchLocationUpdatedAt: null,
        dispatchLocationSource: null,
      } : {}),
    }).where(eq(driverProfilesTable.id, driver.id));
  }
}