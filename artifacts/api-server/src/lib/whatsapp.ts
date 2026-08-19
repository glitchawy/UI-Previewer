/**
 * WhatsApp OTP Provider Abstraction
 * ===================================
 * The project owner has a WhatsApp OTP service subscription.
 * Drop credentials in via Replit Secrets (never hardcode them).
 *
 * Required environment variables (all must be set in production):
 *
 *   WHATSAPP_API_URL      — Full base URL of the provider API
 *                           e.g. https://api.yourprovider.com/v1
 *
 *   WHATSAPP_API_TOKEN    — Bearer token / API key for the provider
 *
 *   WHATSAPP_SENDER_ID    — (Optional) Your WhatsApp Business sender phone
 *                           number or sender ID as required by the provider
 *                           e.g. +20111XXXXXXX or a numeric ID
 *
 *   WHATSAPP_TEMPLATE     — (Optional) Message template name if the provider
 *                           requires pre-approved templates (Meta WABA etc.)
 *                           When set, the provider will receive { template, params }
 *                           instead of a free-form message body.
 *
 * Delivery modes (controlled via OTP_DELIVERY env var):
 *   dev   — no network call; fixed DEV_OTP accepted (default in development)
 *   log   — generates real random codes, writes to server log (staging)
 *   live  — sends via WhatsApp API (required in production)
 *
 * Provider contract:
 *   The provider must accept POST {WHATSAPP_API_URL}/send with:
 *     Authorization: Bearer {WHATSAPP_API_TOKEN}
 *     Content-Type: application/json
 *     {
 *       "to":       "+20XXXXXXXXXX",   // Egyptian number in E.164
 *       "senderId": "{WHATSAPP_SENDER_ID}",   // optional
 *       "code":     "123456",          // 6-digit OTP
 *       "message":  "...",             // pre-formatted Arabic message
 *       "template": "{WHATSAPP_TEMPLATE}",  // if WHATSAPP_TEMPLATE is set
 *       "params":   ["123456", "5"]    // template variable substitutions
 *     }
 *   It must return HTTP 2xx on success.
 *   Any non-2xx response is treated as a delivery failure.
 */

import { logger } from "./logger";

export class WhatsAppDeliveryError extends Error {
  constructor(
    public readonly statusCode: number | null,
    message: string,
  ) {
    super(message);
    this.name = "WhatsAppDeliveryError";
  }
}

export type DeliveryMode = "dev" | "log" | "live";

export function resolveDeliveryMode(): DeliveryMode {
  const IS_PROD = process.env.NODE_ENV === "production";
  const configured = process.env["OTP_DELIVERY"] as string | undefined;

  if (configured === "live") return "live";
  if (configured === "log") return "log";
  if (configured === "dev") {
    // Never allow dev mode in production — fall through to live
    if (IS_PROD) return "live";
    return "dev";
  }
  // Default: live in production, dev everywhere else
  return IS_PROD ? "live" : "dev";
}

/** The fixed development-only OTP (never accepted in production). */
export const DEV_OTP = "123456";

/**
 * Sends a WhatsApp OTP message to an Egyptian mobile number.
 *
 * @param phone  Egyptian phone without country code, e.g. "01234567890"
 * @param code   6-digit plaintext OTP (hashed before DB storage — this is the raw value to send)
 *
 * Throws WhatsAppDeliveryError on any provider failure.
 * In dev/log mode this is a no-op or logs only.
 */
export async function sendWhatsAppOtp(phone: string, code: string): Promise<DeliveryMode> {
  const mode = resolveDeliveryMode();

  if (mode === "dev") {
    // Nothing sent; caller accepts DEV_OTP as valid
    logger.debug({ phone }, "WhatsApp OTP skipped (dev mode)");
    return "dev";
  }

  if (mode === "log") {
    // Real random code, but delivered to log only (staging / manual provisioning)
    logger.info({ phone, otp: code }, "WhatsApp OTP issued (log delivery — staging)");
    return "log";
  }

  // ── Live mode ──────────────────────────────────────────────────────────────
  const apiUrl = process.env["WHATSAPP_API_URL"];
  const apiToken = process.env["WHATSAPP_API_TOKEN"];
  const senderId = process.env["WHATSAPP_SENDER_ID"];
  const template = process.env["WHATSAPP_TEMPLATE"];

  if (!apiUrl || !apiToken) {
    throw new WhatsAppDeliveryError(
      null,
      "WhatsApp provider not configured — set WHATSAPP_API_URL and WHATSAPP_API_TOKEN in Replit Secrets",
    );
  }

  const e164 = `+2${phone}`; // Egyptian E.164: +20XXXXXXXXXX
  const messageText =
    `كود التحقق الخاص بك في طلبات بيتك: *${code}*\n\n` +
    `صالح لمدة 5 دقائق. لا تشاركه مع أي شخص.`;

  const payload: Record<string, unknown> = {
    to: e164,
    code,
    message: messageText,
  };
  if (senderId) payload["senderId"] = senderId;
  if (template) {
    payload["template"] = template;
    payload["params"] = [code, "5"]; // [OTP, TTL in minutes]
  }

  let response: Response;
  try {
    response = await fetch(`${apiUrl}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000), // 10 s timeout
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error({ phone, err: msg }, "WhatsApp API network error");
    throw new WhatsAppDeliveryError(null, `WhatsApp API unreachable: ${msg}`);
  }

  if (!response.ok) {
    let body = "";
    try { body = await response.text(); } catch { /* ignore */ }
    logger.error({ phone, status: response.status, body: body.slice(0, 300) }, "WhatsApp API returned error");
    throw new WhatsAppDeliveryError(
      response.status,
      `WhatsApp send failed (HTTP ${response.status}): ${body.slice(0, 200)}`,
    );
  }

  logger.info({ phone, e164 }, "WhatsApp OTP sent successfully");
  return "live";
}
