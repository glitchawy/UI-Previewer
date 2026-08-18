import { createHash, randomInt } from "node:crypto";
import { and, eq, isNull, desc } from "drizzle-orm";
import { db, otpCodesTable } from "@workspace/db";
import { logger } from "./logger";

const IS_PROD = process.env.NODE_ENV === "production";

/** Development-only universal code, never accepted in production. */
export const DEV_OTP = "123456";

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/**
 * OTP delivery mode:
 * - "dev" (default outside production): the fixed DEV_OTP works; no SMS.
 * - "sms" (default in production): send via Twilio; requires TWILIO_ACCOUNT_SID,
 *   TWILIO_AUTH_TOKEN, TWILIO_FROM secrets.
 * - "log": explicit opt-in that writes the generated code to server logs
 *   (for staging/manual provisioning; codes remain random and expiring).
 */
function deliveryMode(): "dev" | "sms" | "log" {
  const configured = process.env["OTP_DELIVERY"];
  if (configured === "sms" || configured === "log" || configured === "dev") {
    if (configured === "dev" && IS_PROD) return "sms"; // never allow dev mode in production
    return configured;
  }
  return IS_PROD ? "sms" : "dev";
}

async function sendSms(phone: string, code: string): Promise<void> {
  const sid = process.env["TWILIO_ACCOUNT_SID"];
  const token = process.env["TWILIO_AUTH_TOKEN"];
  const from = process.env["TWILIO_FROM"];
  if (!sid || !token || !from) {
    throw new Error("SMS provider not configured (TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM)");
  }
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: `+2${phone}`,
      From: from,
      Body: `كود التحقق الخاص بك في طلبات بيتك: ${code}`,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`SMS send failed (${res.status}): ${text.slice(0, 200)}`);
  }
}

/**
 * Generate, store, and deliver a fresh OTP for phone+role.
 * Throws if delivery is impossible (caller should surface an explicit error).
 */
export async function issueOtp(phone: string, role: string): Promise<void> {
  const mode = deliveryMode();

  if (mode === "dev") {
    // Fixed development code; nothing stored or sent.
    logger.info({ phone, role }, `Dev OTP active (${DEV_OTP})`);
    return;
  }

  const code = String(randomInt(100000, 1000000));

  // Invalidate previous codes for this phone+role, then store the new one.
  await db.delete(otpCodesTable).where(and(eq(otpCodesTable.phone, phone), eq(otpCodesTable.role, role)));
  await db.insert(otpCodesTable).values({
    phone,
    role,
    codeHash: hashCode(code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  if (mode === "sms") {
    await sendSms(phone, code);
    logger.info({ phone, role }, "OTP sent via SMS");
  } else {
    // Explicitly configured log delivery (staging / manual provisioning).
    logger.info({ phone, role, otp: code }, "OTP issued (log delivery)");
  }
}

/**
 * Verify an OTP for phone+role. Returns true when valid (and consumes it).
 * In non-production dev mode, the fixed DEV_OTP is accepted.
 */
export async function verifyOtpCode(phone: string, role: string, otp: string): Promise<
  { ok: true } | { ok: false; reason: "invalid" | "expired" | "too_many_attempts" }
> {
  if (deliveryMode() === "dev") {
    return otp === DEV_OTP ? { ok: true } : { ok: false, reason: "invalid" };
  }

  const rows = await db
    .select()
    .from(otpCodesTable)
    .where(and(eq(otpCodesTable.phone, phone), eq(otpCodesTable.role, role), isNull(otpCodesTable.consumedAt)))
    .orderBy(desc(otpCodesTable.createdAt))
    .limit(1);

  const record = rows[0];
  if (!record) return { ok: false, reason: "invalid" };
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (record.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "too_many_attempts" };

  if (hashCode(otp) !== record.codeHash) {
    await db
      .update(otpCodesTable)
      .set({ attempts: record.attempts + 1 })
      .where(eq(otpCodesTable.id, record.id));
    return { ok: false, reason: "invalid" };
  }

  await db.update(otpCodesTable).set({ consumedAt: new Date() }).where(eq(otpCodesTable.id, record.id));
  return { ok: true };
}
