import { and, eq, lt, lte, sql } from "drizzle-orm";
import {
  cartItemsTable,
  db,
  orderStatusEventsTable,
  ordersTable,
  paymentSessionsTable,
  refundRequestsTable,
  type PaymentSession,
} from "@workspace/db";
import { logger } from "./logger";
import { findPaymobOrderByReference } from "./paymob";
import { creditWallet, toCents } from "./wallet-ledger";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const PAYMENT_SESSION_EXPIRY_REASON = "Checkout session expired before a payment callback arrived";

export async function restoreWalletForCancelledOrders(
  tx: Transaction,
  session: PaymentSession,
  cancelledOrders: Array<{ id: number; walletAmountUsed: string }>,
) {
  const withWallet = cancelledOrders.filter((order) => toCents(order.walletAmountUsed) > 0);
  if (!withWallet.length) return;
  await tx.execute(sql`SELECT pg_advisory_xact_lock(${session.customerId})`);
  for (const order of withWallet) {
    const [refund] = await tx.insert(refundRequestsTable).values({
      orderId: order.id,
      customerId: session.customerId,
      source: "cancellation",
      method: "wallet",
      status: "approved",
      amount: order.walletAmountUsed,
      reason: "إعادة رصيد المحفظة بعد إلغاء جلسة الدفع",
      resolutionNote: "تمت الإعادة تلقائياً لأن الدفع الخارجي لم يكتمل",
      reviewedAt: new Date(),
    }).onConflictDoNothing().returning({ id: refundRequestsTable.id });
    const refundId = refund?.id ?? (await tx.select({ id: refundRequestsTable.id })
      .from(refundRequestsTable)
      .where(and(
        eq(refundRequestsTable.source, "cancellation"),
        eq(refundRequestsTable.orderId, order.id),
      ))
      .limit(1))[0]?.id;
    if (!refundId) throw new Error("CANCELLATION_REFUND_NOT_FOUND");
    await creditWallet(tx, {
      userId: session.customerId,
      amountCents: toCents(order.walletAmountUsed),
      description: `إعادة رصيد طلب TB-${String(order.id).padStart(6, "0")}`,
      referenceType: "refund",
      referenceId: refundId,
    });
  }
}

export async function expireLockedPaymentSession(
  tx: Transaction,
  session: PaymentSession,
  now = new Date(),
) {
  if (session.status !== "pending" || session.expiresAt > now) return false;
  await tx.update(paymentSessionsTable).set({
    status: "failed",
    failureReason: PAYMENT_SESSION_EXPIRY_REASON,
    processedAt: now,
  }).where(and(eq(paymentSessionsTable.id, session.id), eq(paymentSessionsTable.status, "pending")));
  await tx.update(cartItemsTable).set({ paymentSessionId: null }).where(and(
    eq(cartItemsTable.userId, session.customerId),
    eq(cartItemsTable.paymentSessionId, session.id),
  ));
  const cancelledOrders = await tx.update(ordersTable).set({
    paymentStatus: "failed",
    status: "cancelled",
  }).where(and(
    eq(ordersTable.paymentSessionId, session.id),
    eq(ordersTable.paymentStatus, "pending"),
    eq(ordersTable.status, "pending"),
  )).returning({ id: ordersTable.id, walletAmountUsed: ordersTable.walletAmountUsed });
  await restoreWalletForCancelledOrders(tx, session, cancelledOrders);
  if (cancelledOrders.length) {
    await tx.insert(orderStatusEventsTable).values(cancelledOrders.map((order) => ({
      orderId: order.id,
      status: "cancelled" as const,
    })));
  }
  return true;
}

export async function cancelPendingPaymentSession(
  tx: Transaction,
  session: PaymentSession,
  reason: string,
) {
  if (session.status !== "pending") return false;
  await tx.update(paymentSessionsTable).set({
    status: "failed",
    failureReason: reason,
    processedAt: new Date(),
  }).where(and(eq(paymentSessionsTable.id, session.id), eq(paymentSessionsTable.status, "pending")));
  await tx.update(cartItemsTable).set({ paymentSessionId: null }).where(and(
    eq(cartItemsTable.userId, session.customerId),
    eq(cartItemsTable.paymentSessionId, session.id),
  ));
  const cancelledOrders = await tx.update(ordersTable).set({
    paymentStatus: "failed",
    status: "cancelled",
  }).where(and(
    eq(ordersTable.paymentSessionId, session.id),
    eq(ordersTable.paymentStatus, "pending"),
    eq(ordersTable.status, "pending"),
  )).returning({ id: ordersTable.id, walletAmountUsed: ordersTable.walletAmountUsed });
  await restoreWalletForCancelledOrders(tx, session, cancelledOrders);
  if (cancelledOrders.length) {
    await tx.insert(orderStatusEventsTable).values(cancelledOrders.map((order) => ({
      orderId: order.id,
      status: "cancelled" as const,
    })));
  }
  return true;
}

export async function expireDuePaymentSessions() {
  const now = new Date();
  const retryableClaimBefore = new Date(now.getTime() - 2 * 60_000);
  const staleClaims = await db.select({ id: paymentSessionsTable.id }).from(paymentSessionsTable)
    .where(and(
      eq(paymentSessionsTable.status, "pending"),
      eq(paymentSessionsTable.checkoutCreationStatus, "creating"),
      lt(paymentSessionsTable.checkoutCreationStartedAt, retryableClaimBefore),
    ));
  for (const staleClaim of staleClaims) {
    const [candidate] = await db.select().from(paymentSessionsTable)
      .where(eq(paymentSessionsTable.id, staleClaim.id))
      .limit(1);
    if (!candidate || candidate.status !== "pending" || candidate.checkoutCreationStatus !== "creating") continue;
    let providerOrderId: string | null;
    try {
      providerOrderId = await findPaymobOrderByReference(candidate.reference);
    } catch (err) {
      logger.warn({ err, paymentSessionId: candidate.id }, "Unable to reconcile ambiguous Paymob checkout creation");
      continue;
    }
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${staleClaim.id})`);
      const [session] = await tx.select().from(paymentSessionsTable)
        .where(eq(paymentSessionsTable.id, staleClaim.id))
        .limit(1);
      if (!session || session.status !== "pending" || session.paymentUrl ||
        session.checkoutCreationStatus !== "creating" ||
        !session.checkoutCreationStartedAt ||
        session.checkoutCreationStartedAt >= retryableClaimBefore) return;
      if (await expireLockedPaymentSession(tx, session, now)) return;
      if (providerOrderId) {
        await tx.update(paymentSessionsTable).set({
          paymobOrderId: providerOrderId,
          checkoutCreationStatus: "provider_created",
          checkoutCreationStartedAt: null,
        }).where(eq(paymentSessionsTable.id, session.id));
        logger.warn({ paymentSessionId: session.id, providerOrderId }, "Paymob checkout reconciled without a recoverable URL");
      } else {
        logger.warn(
          { paymentSessionId: session.id },
          "Paymob checkout inquiry found no provider order; retaining claim until definitive expiry or reconciliation",
        );
      }
    });
  }
  const dueSessions = await db.select({ id: paymentSessionsTable.id }).from(paymentSessionsTable)
    .where(and(eq(paymentSessionsTable.status, "pending"), lte(paymentSessionsTable.expiresAt, now)));
  let expiredCount = 0;
  for (const dueSession of dueSessions) {
    const expired = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${dueSession.id})`);
      const [session] = await tx.select().from(paymentSessionsTable)
        .where(eq(paymentSessionsTable.id, dueSession.id))
        .limit(1);
      return session ? expireLockedPaymentSession(tx, session, now) : false;
    });
    if (expired) expiredCount += 1;
  }
  return expiredCount;
}

let expiryTimer: ReturnType<typeof setInterval> | null = null;

export function startPaymentSessionExpiryWorker() {
  if (expiryTimer) return;
  const run = async () => {
    try {
      const expiredCount = await expireDuePaymentSessions();
      if (expiredCount) logger.info({ expiredCount }, "Expired stale Paymob checkout sessions");
    } catch (err) {
      logger.error({ err }, "Unable to expire stale Paymob checkout sessions");
    }
  };
  void run();
  expiryTimer = setInterval(() => { void run(); }, 60_000);
  expiryTimer.unref();
}