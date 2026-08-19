/**
 * Authevo webhook handler
 * POST /api/webhooks/authevo
 *
 * IMPORTANT: This route is mounted in app.ts BEFORE express.json() so that
 * req.body arrives as a raw Buffer — required for HMAC-SHA256 signature verification.
 *
 * Event types handled:
 *   otp.status_update  — delivery status for a sent OTP (sent/delivered/read/failed)
 *   account.low_balance — Authevo balance below minimum; log a warning
 *
 * Signature verification:
 *   X-Authevo-Signature: sha256=<hmac-sha256-hex>
 *   Signed with AUTHEVO_WEBHOOK_SECRET from Replit Secrets.
 */

import { Router } from "express";
import { and, eq, sql } from "drizzle-orm";
import {
  db,
  cartItemsTable,
  otpCodesTable,
  orderStatusEventsTable,
  ordersTable,
  paymentSessionsTable,
} from "@workspace/db";
import { logger } from "../lib/logger";
import { expireLockedPaymentSession } from "../lib/payment-session-lifecycle";
import { verifyWebhookSignature } from "../lib/authevo";
import { verifyWebhookHmac } from "../lib/paymob";

const router = Router();
export const paymobWebhookRouter = Router();

// ─── Event payload types ──────────────────────────────────────────────────────

interface OtpStatusUpdateEvent {
  event: "otp.status_update";
  meta_message_id: string;
  status: "delivered" | "read" | "failed";
}

interface AccountLowBalanceEvent {
  event: "account.low_balance";
  balance: number;
}

type AuthevoEvent = OtpStatusUpdateEvent | AccountLowBalanceEvent;

// ─── Handler ──────────────────────────────────────────────────────────────────

router.post("/", async (req, res): Promise<void> => {
  // req.body is a raw Buffer — mounted with express.raw() in app.ts
  const rawBody = req.body as Buffer;
  const signature = req.headers["x-authevo-signature"] as string | undefined;

  // 1. Verify signature — reject immediately if invalid
  if (!verifyWebhookSignature(rawBody, signature)) {
    logger.warn({ ip: req.ip }, "Authevo webhook: invalid signature — rejected");
    res.status(401).json({ error: "invalid signature" });
    return;
  }

  // 2. Parse payload
  let event: AuthevoEvent;
  try {
    event = JSON.parse(rawBody.toString("utf-8")) as AuthevoEvent;
  } catch {
    logger.warn("Authevo webhook: non-JSON body");
    res.status(400).json({ error: "invalid JSON" });
    return;
  }

  // 3. Dispatch by event type
  try {
    switch (event.event) {
      case "otp.status_update":
        await handleOtpStatusUpdate(event);
        break;

      case "account.low_balance":
        handleLowBalance(event);
        break;

      default:
        // Unknown events → log and ack (do not return 4xx to avoid retries)
        logger.info({ event: (event as { event: string }).event }, "Authevo webhook: unknown event type (ignored)");
    }
  } catch (err) {
    // Don't let a DB error cause Authevo to retry infinitely for otp.status_update.
    // Log and ack — the audit log is best-effort.
    logger.error({ err }, "Authevo webhook: error handling event");
  }

  // 4. Always ack with 200 so Authevo doesn't retry
  res.status(200).end();
});

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleOtpStatusUpdate(event: OtpStatusUpdateEvent): Promise<void> {
  const { meta_message_id, status } = event;

  logger.info({ messageId: meta_message_id, status }, "Authevo OTP status update");

  // Update our audit record — keyed by Authevo's message_id
  const updated = await db
    .update(otpCodesTable)
    .set({ deliveryStatus: status })
    .where(eq(otpCodesTable.messageId, meta_message_id))
    .returning({ id: otpCodesTable.id });

  if (updated.length === 0) {
    // Could happen if the send audit record was pruned or belongs to a different env
    logger.warn({ messageId: meta_message_id }, "Authevo webhook: no otp_code row found for message_id");
  }
}

function handleLowBalance(event: AccountLowBalanceEvent): void {
  logger.warn(
    { balance: event.balance },
    "⚠️  Authevo account balance is low — top up to avoid failed OTP deliveries",
  );
}

type PaymobCallback = {
  obj?: {
    id?: string | number;
    success?: boolean | string;
    error_occured?: boolean | string;
    pending?: boolean | string;
    amount_cents?: string | number;
    currency?: string;
    integration_id?: string | number;
    order?: { id?: string | number; merchant_order_id?: string };
    special_reference?: string;
  };
  id?: string | number;
  success?: boolean | string;
  error_occured?: boolean | string;
  pending?: boolean | string;
  amount_cents?: string | number;
  currency?: string;
  integration_id?: string | number;
  order?: { id?: string | number; merchant_order_id?: string };
  special_reference?: string;
};

function asBoolean(value: unknown) {
  return value === true || value === "true";
}

function isBooleanLike(value: unknown) {
  return value === true || value === false || value === "true" || value === "false";
}

paymobWebhookRouter.post("/", async (req, res): Promise<void> => {
  const rawBody = req.body as Buffer;
  const signature = typeof req.query.hmac === "string"
    ? req.query.hmac
    : (req.headers["x-paymob-hmac"] as string | undefined);
  let callback: PaymobCallback;
  try {
    callback = JSON.parse(rawBody.toString("utf-8")) as PaymobCallback;
  } catch {
    res.status(400).json({ error: "invalid JSON" });
    return;
  }
  if (!verifyWebhookHmac(callback, signature)) {
    logger.warn({ ip: req.ip }, "Paymob webhook: invalid HMAC rejected");
    res.status(401).json({ error: "invalid signature" });
    return;
  }

  const transaction = callback.obj ?? callback;
  const providerOrderId = transaction.order?.id === undefined ? "" : String(transaction.order.id);
  const reference = transaction.order?.merchant_order_id ?? transaction.special_reference ?? "";
  if (!providerOrderId && !reference) {
    logger.warn("Paymob webhook: callback has no payment reference");
    res.status(200).end();
    return;
  }

  let [session] = providerOrderId
    ? await db.select().from(paymentSessionsTable).where(eq(paymentSessionsTable.paymobOrderId, providerOrderId)).limit(1)
    : [];
  // Unified Checkout can report a payment/order id that differs from the
  // intention response. The merchant reference remains the stable link.
  if (!session && reference) {
    [session] = await db.select().from(paymentSessionsTable)
      .where(eq(paymentSessionsTable.reference, reference))
      .limit(1);
  }
  if (!session) {
    logger.warn({ providerOrderId, reference }, "Paymob webhook: payment session not found");
    res.status(200).end();
    return;
  }

  const success = asBoolean(transaction.success);
  const pending = asBoolean(transaction.pending);
  const transactionId = transaction.id === undefined ? null : String(transaction.id);
  if (pending || !isBooleanLike(transaction.success)) {
    logger.info(
      { paymentSessionId: session.id, transactionId, pending },
      "Paymob webhook: non-terminal transaction ignored",
    );
    res.status(200).end();
    return;
  }
  await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${session.id})`);
    const [lockedSession] = await tx.select().from(paymentSessionsTable)
      .where(eq(paymentSessionsTable.id, session.id)).limit(1);
    if (!lockedSession || lockedSession.status !== "pending") return;
    if (await expireLockedPaymentSession(tx, lockedSession)) {
      logger.info({ paymentSessionId: lockedSession.id }, "Paymob webhook ignored after checkout expiry");
      return;
    }
    const receivedCents = Number(transaction.amount_cents);
    const expectedCents = Math.round(Number(lockedSession.amount) * 100);
    const receivedCurrency = transaction.currency?.toUpperCase();
    const receivedIntegrationId = transaction.integration_id === undefined ? null : String(transaction.integration_id);
    const expectedIntegrationIds = lockedSession.paymobIntegrationIds?.length
      ? lockedSession.paymobIntegrationIds
      : lockedSession.paymobIntegrationId ? [lockedSession.paymobIntegrationId] : [];
    if (
      !Number.isSafeInteger(receivedCents) ||
      receivedCents !== expectedCents ||
      receivedCurrency !== lockedSession.currency.toUpperCase() ||
      !expectedIntegrationIds.length ||
      !receivedIntegrationId ||
      !expectedIntegrationIds.includes(receivedIntegrationId)
    ) {
      logger.error(
        {
          paymentSessionId: lockedSession.id,
          receivedCents,
          expectedCents,
          receivedCurrency,
          expectedCurrency: lockedSession.currency,
          receivedIntegrationId,
          expectedIntegrationIds,
        },
        "Paymob webhook: payment details mismatch; awaiting manual reconciliation",
      );
      return;
    }
    const settledStatus = success ? ("paid" as const) : ("failed" as const);
    const nextOrderStatus = success ? ("confirmed" as const) : ("cancelled" as const);
    await tx.update(paymentSessionsTable).set({
      status: settledStatus,
      paymobTransactionId: transactionId,
      failureReason: success ? null : "Paymob transaction was declined or failed",
      processedAt: new Date(),
    }).where(eq(paymentSessionsTable.id, session.id));
    const updatedOrders = await tx.update(ordersTable).set({
      paymentStatus: settledStatus,
      paymobTransactionId: transactionId,
      status: nextOrderStatus,
    }).where(and(
      eq(ordersTable.paymentSessionId, session.id),
      eq(ordersTable.status, "pending"),
      eq(ordersTable.paymentStatus, "pending"),
    )).returning({ id: ordersTable.id });
    if (updatedOrders.length) {
      await tx.insert(orderStatusEventsTable).values(updatedOrders.map((order) => ({
        orderId: order.id,
        status: nextOrderStatus,
      })));
    }
    if (success) {
      await tx.delete(cartItemsTable).where(and(
        eq(cartItemsTable.userId, lockedSession.customerId),
        eq(cartItemsTable.paymentSessionId, lockedSession.id),
      ));
    } else {
      await tx.update(cartItemsTable).set({ paymentSessionId: null }).where(and(
        eq(cartItemsTable.userId, lockedSession.customerId),
        eq(cartItemsTable.paymentSessionId, lockedSession.id),
      ));
    }
  });
  logger.info(
    { paymentSessionId: session.id, providerOrderId, transactionId, success },
    "Paymob webhook processed",
  );
  res.status(200).end();
});

export default router;
