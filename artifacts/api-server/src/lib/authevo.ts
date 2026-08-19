/**
 * Authevo OTP API client
 * https://authevo.dev/en/docs
 *
 * Required Replit Secrets:
 *   AUTHEVO_API_KEY         — live key (sk_…) or sandbox test key from dashboard
 *   AUTHEVO_WEBHOOK_SECRET  — webhook signing secret from dashboard → Settings
 *
 * Two delivery keys work here without any code change:
 *   • A test key always accepts code 123456 — no real message, no charge (sandbox)
 *   • A live key sends real WhatsApp OTPs and charges per verification
 */

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { logger } from "./logger";

const BASE_URL = "https://api.authevo.dev";
const TIMEOUT_MS = 10_000;

// ─── Error types ──────────────────────────────────────────────────────────────

export type AuthevoErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_API_KEY"
  | "NOT_FOUND"
  | "RATE_LIMIT_EXCEEDED"
  | "INTERNAL_ERROR"
  | "INVALID_PHONE"
  | "OTP_NOT_FOUND"
  | "IDEMPOTENCY_KEY_IN_PROGRESS"
  | "TEMPLATE_NOT_READY"
  | "CHANNEL_NOT_LINKED"
  | "TOO_MANY_ATTEMPTS"
  | "DELIVERY_FAILED"
  | "TELEGRAM_UNAVAILABLE"
  | "INSUFFICIENT_CREDITS"
  | "DEPOSIT_REQUIRED"
  | "FREE_TRIAL_EXHAUSTED"
  | "SPEND_CAP_EXCEEDED"
  | "BILLING_ERROR"
  | "FREE_TRIAL_PAUSED";

export class AuthevoApiError extends Error {
  constructor(
    public readonly code: AuthevoErrorCode | string,
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "AuthevoApiError";
  }
}

// ─── Internal fetch helper ────────────────────────────────────────────────────

function getApiKey(): string {
  const key = process.env["AUTHEVO_API_KEY"];
  if (!key) {
    throw new AuthevoApiError(
      "INVALID_API_KEY",
      401,
      "AUTHEVO_API_KEY is not configured — add it in Replit Secrets",
    );
  }
  return key;
}

async function authevoPost(
  path: string,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {},
): Promise<unknown> {
  const apiKey = getApiKey();

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...extraHeaders,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ path, err: msg }, "Authevo API network error");
    throw new AuthevoApiError("INTERNAL_ERROR", 0, `Authevo unreachable: ${msg}`);
  }

  const json = (await response.json()) as {
    data?: unknown;
    error?: { code: string; message: string };
  };

  if (!response.ok) {
    const code = (json.error?.code ?? "INTERNAL_ERROR") as AuthevoErrorCode;
    const message = json.error?.message ?? `Authevo HTTP ${response.status}`;
    logger.warn({ path, status: response.status, code }, `Authevo error: ${message}`);
    throw new AuthevoApiError(code, response.status, message);
  }

  return json.data;
}

// ─── Send OTP ─────────────────────────────────────────────────────────────────

export interface SendOtpResult {
  messageId: string;
  expiresIn: number; // seconds until the code expires (Authevo-managed)
  status: string;    // "sent" on success
}

/**
 * Send a WhatsApp OTP to an Egyptian phone number.
 *
 * Authevo generates the code, sends the WhatsApp message, and manages
 * expiry and attempt limits — we don't touch any of that.
 *
 * An idempotency key is generated per call so safe retries don't double-send.
 *
 * @param e164Phone  Phone in E.164 format, e.g. "+201234567890"
 */
export async function sendOtp(e164Phone: string): Promise<SendOtpResult> {
  const idempotencyKey = randomUUID();
  const data = (await authevoPost(
    "/v1/otp/send",
    { phone: e164Phone },
    { "Idempotency-Key": idempotencyKey },
  )) as { message_id: string; expires_in: number; status: string };

  logger.info({ phone: e164Phone, messageId: data.message_id, expiresIn: data.expires_in }, "Authevo OTP sent");
  return {
    messageId: data.message_id,
    expiresIn: data.expires_in,
    status: data.status,
  };
}

// ─── Verify OTP ───────────────────────────────────────────────────────────────

export type VerifyOtpOutcome =
  | { ok: true }
  | { ok: false; reason: "invalid" | "expired_or_used" | "too_many_attempts" | "not_found" };

/**
 * Verify the 6-digit code entered by the user.
 *
 * Maps every Authevo error code to a structured result so callers
 * never need to catch AuthevoApiError for expected verification failures.
 * 5xx / network errors still throw.
 *
 * @param e164Phone  Phone in E.164 format, e.g. "+201234567890"
 * @param code       The 6-digit code the user entered
 */
export async function verifyOtp(e164Phone: string, code: string): Promise<VerifyOtpOutcome> {
  try {
    const data = (await authevoPost("/v1/otp/verify", { phone: e164Phone, code })) as {
      verified: boolean;
    };
    return data.verified ? { ok: true } : { ok: false, reason: "invalid" };
  } catch (err) {
    if (err instanceof AuthevoApiError) {
      switch (err.code as AuthevoErrorCode) {
        case "TOO_MANY_ATTEMPTS":
          return { ok: false, reason: "too_many_attempts" };
        case "OTP_NOT_FOUND":
          // "expired, already used, or never sent for this phone"
          return { ok: false, reason: "expired_or_used" };
        default:
          if (err.statusCode >= 400 && err.statusCode < 500) {
            // All other client errors (wrong code format, etc.) → treat as invalid
            return { ok: false, reason: "invalid" };
          }
      }
    }
    // 5xx / network → bubble up so the caller returns 503
    throw err;
  }
}

// ─── Telegram fallback link ───────────────────────────────────────────────────

export interface TelegramLinkResult {
  url: string;       // one-tap t.me link
  expiresIn: number; // seconds (15 min = 900)
}

/**
 * Generate a one-tap Telegram link so the user can link their Telegram account.
 * Once linked, Authevo automatically falls back to Telegram if WhatsApp delivery fails.
 *
 * The link expires in 15 minutes and is single-use — safe to call again
 * for the same phone to issue a fresh one.
 *
 * @param e164Phone  Phone in E.164 format, e.g. "+201234567890"
 */
export async function generateTelegramLink(e164Phone: string): Promise<TelegramLinkResult> {
  const data = (await authevoPost("/v1/otp/telegram-link", { phone: e164Phone })) as {
    telegram_bot_url: string;
    expires_in: number;
  };
  return { url: data.telegram_bot_url, expiresIn: data.expires_in };
}

// ─── Webhook signature verification ──────────────────────────────────────────

/**
 * Verify an Authevo webhook request signature using HMAC-SHA256.
 *
 * MUST be called with the RAW request body (Buffer) BEFORE any JSON parsing.
 * Returns true if the signature is valid, false otherwise.
 *
 * The X-Authevo-Signature header format is: "sha256=<hex-digest>"
 */
export function verifyWebhookSignature(rawBody: Buffer, signatureHeader: string | undefined): boolean {
  const secret = process.env["AUTHEVO_WEBHOOK_SECRET"];
  if (!secret) {
    logger.error("AUTHEVO_WEBHOOK_SECRET is not configured — rejecting webhook");
    return false;
  }
  if (!signatureHeader) {
    logger.warn("Webhook request missing X-Authevo-Signature header");
    return false;
  }

  const provided = signatureHeader.replace(/^sha256=/, "");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(provided, "hex");

  if (a.length === 0 || a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
