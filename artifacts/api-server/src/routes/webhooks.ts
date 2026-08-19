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
import { eq } from "drizzle-orm";
import { db, otpCodesTable } from "@workspace/db";
import { logger } from "../lib/logger";
import { verifyWebhookSignature } from "../lib/authevo";

const router = Router();

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

export default router;
