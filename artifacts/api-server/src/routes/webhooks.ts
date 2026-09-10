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

import { createHash } from "node:crypto";
import { Router } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  otpCodesTable,
  paymobWebhookInboxTable,
} from "@workspace/db";
import { logger } from "../lib/logger";
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
  const payloadHash = createHash("sha256").update(rawBody).digest("hex");
  const transactionId = transaction.id === undefined ? "" : String(transaction.id);
  // Paymob reuses a transaction id as a payment evolves (for example pending
  // then success). Key the durable event by the material payment facts so an
  // identical retry dedupes while a state transition is retained.
  const materialFacts = [
    transaction.success, transaction.pending, transaction.error_occured,
    (transaction as Record<string, unknown>).is_refunded,
    (transaction as Record<string, unknown>).is_voided,
    (transaction as Record<string, unknown>).is_capture,
    transaction.amount_cents, transaction.currency, transaction.integration_id,
    transaction.order?.id, transaction.order?.merchant_order_id,
    transaction.special_reference,
  ].map((value) => value === undefined ? "" : String(value).trim().toLowerCase()).join("|");
  const factsHash = createHash("sha256").update(materialFacts).digest("hex");
  const providerEventKey = transactionId
    ? `transaction:${transactionId}:${factsHash}`
    : `payload:${payloadHash}`;
  try {
    await db.insert(paymobWebhookInboxTable).values({
      providerEventKey,
      payloadHash,
      payload: callback,
    }).onConflictDoNothing();
  } catch (error) {
    logger.error({ err: error, providerEventKey }, "Paymob webhook durable receipt failed");
    res.status(503).json({ error: "unable to persist callback" });
    return;
  }
  res.status(202).end();
});

export default router;
