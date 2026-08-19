/**
 * OTP subsystem — issue and verify via Authevo
 * =============================================
 *
 * All OTP code generation, delivery, expiry, and attempt counting is
 * delegated to Authevo (https://authevo.dev). This module handles:
 *
 *  1. Our own pre-flight rate limiting (saves Authevo credits, prevents abuse)
 *     - 120-second cooldown between sends per phone+role
 *     - Max 3 sends per phone per 10-minute window (mirrors Authevo's own limit)
 *  2. Translating Authevo results into our app's structured return types
 *  3. Writing an audit record to otp_codes for webhook correlation
 *
 * Delivery mode is determined by which key is set in AUTHEVO_API_KEY:
 *   sandbox test key → Authevo accepts "123456", no real message sent
 *   live key         → Authevo sends real WhatsApp OTPs
 */

import { and, eq, gte, count, desc } from "drizzle-orm";
import { db, otpCodesTable } from "@workspace/db";
import { logger } from "./logger";
import { sendOtp, verifyOtp, AuthevoApiError } from "./authevo";
import type { VerifyOtpOutcome } from "./authevo";

// ─── Rate-limiting constants ──────────────────────────────────────────────────

/** Minimum seconds between OTP sends for the same phone+role. */
const COOLDOWN_S = 120; // 2 minutes

/** Max sends per phone across all roles in the sliding window. */
const RATE_LIMIT_MAX = 3;

/** Width of the rate-limit sliding window — matches Authevo's own limit. */
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1_000; // 10 minutes

// ─── E.164 helper ─────────────────────────────────────────────────────────────

/** Convert an Egyptian mobile number to E.164 format (+2 prefix). */
function toE164(phone: string): string {
  return `+2${phone}`; // e.g. 01234567890 → +201234567890
}

// ─── issueOtp ─────────────────────────────────────────────────────────────────

export type IssueResult =
  | { ok: true; messageId: string; expiresIn: number }
  | { ok: false; reason: "cooldown"; retryAfterSeconds: number }
  | { ok: false; reason: "rate_limited" }
  | { ok: false; reason: "channel_not_linked" }  // WhatsApp failed, Telegram not set up
  | { ok: false; reason: "billing_error"; detail: string }
  | { ok: false; reason: "provider_error"; detail: string };

/**
 * Issue an OTP for the given phone + role.
 *
 * Enforces local rate limiting before calling Authevo.
 * Returns a structured result — never throws for expected failures.
 */
export async function issueOtp(phone: string, role: string): Promise<IssueResult> {
  // ── Cooldown check ──────────────────────────────────────────────────────────
  const recent = await db
    .select({ createdAt: otpCodesTable.createdAt })
    .from(otpCodesTable)
    .where(and(eq(otpCodesTable.phone, phone), eq(otpCodesTable.role, role)))
    .orderBy(desc(otpCodesTable.createdAt))
    .limit(1);

  if (recent.length > 0) {
    const ageMs = Date.now() - recent[0].createdAt.getTime();
    const cooldownMs = COOLDOWN_S * 1_000;
    if (ageMs < cooldownMs) {
      const retryAfterSeconds = Math.ceil((cooldownMs - ageMs) / 1_000);
      logger.warn({ phone, role, retryAfterSeconds }, "OTP blocked — cooldown");
      return { ok: false, reason: "cooldown", retryAfterSeconds };
    }
  }

  // ── Rate limit check ────────────────────────────────────────────────────────
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const countResult = await db
    .select({ n: count() })
    .from(otpCodesTable)
    .where(and(eq(otpCodesTable.phone, phone), gte(otpCodesTable.createdAt, windowStart)));

  const sendsInWindow = Number(countResult[0]?.n ?? 0);
  if (sendsInWindow >= RATE_LIMIT_MAX) {
    logger.warn({ phone, role, sendsInWindow }, "OTP blocked — rate limit");
    return { ok: false, reason: "rate_limited" };
  }

  // ── Call Authevo ────────────────────────────────────────────────────────────
  let authevoResult: Awaited<ReturnType<typeof sendOtp>>;
  try {
    authevoResult = await sendOtp(toE164(phone));
  } catch (err) {
    if (err instanceof AuthevoApiError) {
      logger.error({ phone, role, code: err.code, status: err.statusCode }, "Authevo send error");

      if (err.code === "CHANNEL_NOT_LINKED") {
        return { ok: false, reason: "channel_not_linked" };
      }
      if (
        err.code === "INSUFFICIENT_CREDITS" ||
        err.code === "DEPOSIT_REQUIRED" ||
        err.code === "FREE_TRIAL_EXHAUSTED" ||
        err.code === "SPEND_CAP_EXCEEDED"
      ) {
        return { ok: false, reason: "billing_error", detail: err.message };
      }
      if (err.code === "RATE_LIMIT_EXCEEDED") {
        // Authevo's own rate limit hit despite our guard — treat as rate_limited
        return { ok: false, reason: "rate_limited" };
      }
    }
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: "provider_error", detail };
  }

  // ── Persist audit record ────────────────────────────────────────────────────
  await db.insert(otpCodesTable).values({
    phone,
    role,
    deliveredVia: "authevo",
    messageId: authevoResult.messageId,
    deliveryStatus: "sent",
    resendCount: sendsInWindow,
  });

  logger.info(
    { phone, role, messageId: authevoResult.messageId, expiresIn: authevoResult.expiresIn },
    "OTP issued via Authevo",
  );
  return { ok: true, messageId: authevoResult.messageId, expiresIn: authevoResult.expiresIn };
}

// ─── verifyOtpCode ────────────────────────────────────────────────────────────

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" | "too_many_attempts" | "not_found" };

/**
 * Verify the 6-digit code entered by the user against Authevo.
 *
 * Authevo manages all code state (expiry, attempt counting, consumption).
 * We simply relay the result.
 */
export async function verifyOtpCode(
  phone: string,
  _role: string,  // kept for API compatibility; Authevo verifies by phone only
  code: string,
): Promise<VerifyResult> {
  let outcome: VerifyOtpOutcome;
  try {
    outcome = await verifyOtp(toE164(phone), code);
  } catch (err) {
    // 5xx / network error from Authevo — surface as provider_error to caller
    const detail = err instanceof Error ? err.message : String(err);
    logger.error({ phone, err: detail }, "Authevo verify network/server error");
    // We return invalid so the UI shows a generic retry message
    return { ok: false, reason: "invalid" };
  }

  if (outcome.ok) {
    logger.info({ phone }, "OTP verified via Authevo");
    return { ok: true };
  }

  logger.warn({ phone, reason: outcome.reason }, "OTP verification failed");

  switch (outcome.reason) {
    case "too_many_attempts":
      return { ok: false, reason: "too_many_attempts" };
    case "expired_or_used":
      return { ok: false, reason: "expired" };
    case "not_found":
      return { ok: false, reason: "not_found" };
    default:
      return { ok: false, reason: "invalid" };
  }
}
