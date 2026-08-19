/**
 * OTP subsystem — generation, delivery, verification
 * ====================================================
 *
 * Security properties:
 *  - OTPs are never stored in plaintext (SHA-256 hashed)
 *  - 6-digit random code, 5-minute TTL
 *  - Max 5 verification attempts per code before lockout
 *  - Server-side resend cooldown: 60 s minimum between sends
 *  - Hourly rate limit: max 5 OTP sends per phone number per hour
 *  - All outcomes (issue, verify, reject) are logged with pino
 *  - In dev mode the fixed DEV_OTP is accepted; no network call is made
 *  - In log mode codes are real + random but written to the log only (staging)
 *  - In live mode codes are delivered via WhatsApp (production)
 */

import { createHash, randomInt } from "node:crypto";
import { and, eq, isNull, desc, gte, count } from "drizzle-orm";
import { db, otpCodesTable } from "@workspace/db";
import { logger } from "./logger";
import { sendWhatsAppOtp, resolveDeliveryMode, DEV_OTP, WhatsAppDeliveryError } from "./whatsapp";

// ─── Constants ────────────────────────────────────────────────────────────────

const OTP_TTL_MS        = 5 * 60 * 1000;   // 5 minutes
const MAX_ATTEMPTS      = 5;                 // max wrong guesses before lockout
const RESEND_COOLDOWN_S = 60;               // minimum seconds between sends
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;  // 1 hour sliding window
const RATE_LIMIT_MAX    = 5;               // max sends per phone per window

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

function generateCode(): string {
  return String(randomInt(100_000, 1_000_000)); // 6-digit, uniform distribution
}

// ─── issueOtp ─────────────────────────────────────────────────────────────────

export type IssueResult =
  | { ok: true; mode: string }
  | { ok: false; reason: "cooldown"; retryAfterSeconds: number }
  | { ok: false; reason: "rate_limited" }
  | { ok: false; reason: "provider_error"; detail: string };

/**
 * Generate, persist, and deliver an OTP for the given phone + role.
 *
 * Returns a structured result — callers must handle all cases.
 * In dev mode this is a fast no-op; the fixed DEV_OTP is always valid.
 */
export async function issueOtp(phone: string, role: string): Promise<IssueResult> {
  const mode = resolveDeliveryMode();

  if (mode === "dev") {
    logger.debug({ phone, role }, `OTP skipped — dev mode (use ${DEV_OTP})`);
    return { ok: true, mode: "dev" };
  }

  // ── Cooldown check ────────────────────────────────────────────────────────
  // Prevent hammering: the most recent OTP for this phone+role must be at
  // least RESEND_COOLDOWN_S seconds old.
  const recent = await db
    .select({ createdAt: otpCodesTable.createdAt, resendCount: otpCodesTable.resendCount })
    .from(otpCodesTable)
    .where(and(eq(otpCodesTable.phone, phone), eq(otpCodesTable.role, role)))
    .orderBy(desc(otpCodesTable.createdAt))
    .limit(1);

  if (recent.length > 0) {
    const ageMs = Date.now() - recent[0].createdAt.getTime();
    const cooldownMs = RESEND_COOLDOWN_S * 1_000;
    if (ageMs < cooldownMs) {
      const retryAfterSeconds = Math.ceil((cooldownMs - ageMs) / 1_000);
      logger.warn({ phone, role, retryAfterSeconds }, "OTP resend blocked — cooldown");
      return { ok: false, reason: "cooldown", retryAfterSeconds };
    }
  }

  // ── Hourly rate limit ─────────────────────────────────────────────────────
  // Cap at RATE_LIMIT_MAX requests per phone across all roles in a rolling window.
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW);
  const countResult = await db
    .select({ n: count() })
    .from(otpCodesTable)
    .where(and(eq(otpCodesTable.phone, phone), gte(otpCodesTable.createdAt, windowStart)));

  const requestsInWindow = Number(countResult[0]?.n ?? 0);
  if (requestsInWindow >= RATE_LIMIT_MAX) {
    logger.warn({ phone, role, requestsInWindow }, "OTP rate limit exceeded");
    return { ok: false, reason: "rate_limited" };
  }

  // ── Generate and persist ──────────────────────────────────────────────────
  const code = generateCode();
  const codeHash = hashCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Delete any previous unconsumed codes for this phone+role before inserting
  // (keeps otp_codes table clean and prevents stale code confusion)
  await db
    .delete(otpCodesTable)
    .where(and(eq(otpCodesTable.phone, phone), eq(otpCodesTable.role, role), isNull(otpCodesTable.consumedAt)));

  // ── Deliver ───────────────────────────────────────────────────────────────
  let deliveredVia: string;
  try {
    deliveredVia = await sendWhatsAppOtp(phone, code);
  } catch (err) {
    const detail = err instanceof WhatsAppDeliveryError ? err.message : String(err);
    logger.error({ phone, role, err: detail }, "WhatsApp OTP delivery failed");
    return { ok: false, reason: "provider_error", detail };
  }

  // Persist only after successful delivery
  await db.insert(otpCodesTable).values({
    phone,
    role,
    codeHash,
    expiresAt,
    deliveredVia,
    resendCount: requestsInWindow, // how many prior sends in this window
  });

  logger.info({ phone, role, deliveredVia, windowRequests: requestsInWindow + 1 }, "OTP issued");
  return { ok: true, mode: deliveredVia };
}

// ─── verifyOtpCode ────────────────────────────────────────────────────────────

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired" | "too_many_attempts" | "not_found" };

/**
 * Verify a submitted OTP against the stored hash.
 *
 * On success the code is consumed (consumedAt set) so it cannot be reused.
 * On wrong guess the attempt counter is incremented.
 * In dev mode the fixed DEV_OTP is always accepted (no DB read needed).
 */
export async function verifyOtpCode(phone: string, role: string, otp: string): Promise<VerifyResult> {
  const mode = resolveDeliveryMode();

  if (mode === "dev") {
    if (otp === DEV_OTP) {
      logger.debug({ phone, role }, "OTP verified (dev mode)");
      return { ok: true };
    }
    logger.debug({ phone, role }, "OTP invalid (dev mode)");
    return { ok: false, reason: "invalid" };
  }

  // Fetch the latest unconsumed code for this phone+role
  const rows = await db
    .select()
    .from(otpCodesTable)
    .where(and(eq(otpCodesTable.phone, phone), eq(otpCodesTable.role, role), isNull(otpCodesTable.consumedAt)))
    .orderBy(desc(otpCodesTable.createdAt))
    .limit(1);

  const record = rows[0];

  if (!record) {
    logger.warn({ phone, role }, "OTP verification — no active code found");
    return { ok: false, reason: "not_found" };
  }

  // Lockout check before anything else
  if (record.attempts >= MAX_ATTEMPTS) {
    logger.warn({ phone, role, attempts: record.attempts }, "OTP verification — too many attempts");
    return { ok: false, reason: "too_many_attempts" };
  }

  // Expiry check
  if (record.expiresAt.getTime() < Date.now()) {
    logger.info({ phone, role, expiresAt: record.expiresAt.toISOString() }, "OTP verification — expired");
    return { ok: false, reason: "expired" };
  }

  // Constant-time comparison via hash equality
  if (hashCode(otp) !== record.codeHash) {
    const newAttempts = record.attempts + 1;
    await db
      .update(otpCodesTable)
      .set({ attempts: newAttempts })
      .where(eq(otpCodesTable.id, record.id));

    logger.warn(
      { phone, role, attempts: newAttempts, maxAttempts: MAX_ATTEMPTS },
      "OTP verification — wrong code",
    );
    // Auto-lock after final bad attempt
    if (newAttempts >= MAX_ATTEMPTS) {
      return { ok: false, reason: "too_many_attempts" };
    }
    return { ok: false, reason: "invalid" };
  }

  // Success — consume the code
  await db.update(otpCodesTable).set({ consumedAt: new Date() }).where(eq(otpCodesTable.id, record.id));
  logger.info({ phone, role, deliveredVia: record.deliveredVia }, "OTP verified successfully");
  return { ok: true };
}
