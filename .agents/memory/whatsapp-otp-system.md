---
name: WhatsApp OTP System — Authevo
description: OTP delivery via Authevo, required secrets, rate limiting, Telegram fallback, and webhook setup
---

## Provider: Authevo (https://authevo.dev)
Two endpoints: `POST /v1/otp/send` and `POST /v1/otp/verify`
Base URL: `https://api.authevo.dev`
Auth: `Authorization: Bearer AUTHEVO_API_KEY`

## Required Replit Secrets (never hardcode)
- `AUTHEVO_API_KEY` — live key (sk_…) OR sandbox test key (sandbox accepts "123456", no charge)
- `AUTHEVO_WEBHOOK_SECRET` — webhook signing secret from Authevo dashboard → Settings

## Key architecture decision: Authevo manages OTP lifecycle
Authevo generates codes, delivers them, tracks expiry and attempt limits.
We do NOT hash codes or verify them locally anymore (deprecated since migration 0007).
`otp_codes` table is now an audit log for: our cooldown/rate-limit checks + webhook correlation via `message_id`.

## Rate limiting (two layers)
1. **Ours**: 120s cooldown + max 3 sends per phone per 10-min window (mirrors Authevo's own limit)
2. **Authevo's**: 3 sends/phone/10min, 5 failed verifies/phone/15-min block
Authevo `RATE_LIMIT_EXCEEDED` is handled gracefully as `rate_limited` result.

## Telegram fallback
- `generateTelegramLink(e164Phone)` → `POST /v1/otp/telegram-link` → one-tap t.me URL, 15-min TTL
- Called non-blocking after every successful registration; result included in verify-otp response as `telegramLink`
- Once the user taps the link, all future WhatsApp failures fall back to Telegram automatically

## Webhook endpoint
`POST /api/webhooks/authevo` — mounted BEFORE `express.json()` in `app.ts` using `express.raw({ type: "application/json" })`
**Why raw before json:** HMAC-SHA256 signature must be computed on the raw Buffer; json() consumes the stream.
Handles: `otp.status_update` → updates `otp_codes.delivery_status` by `message_id`; `account.low_balance` → server warn log.
Signature header: `X-Authevo-Signature: sha256=<hex>` verified with AUTHEVO_WEBHOOK_SECRET.

## File locations
- `artifacts/api-server/src/lib/authevo.ts` — Authevo API client (sendOtp, verifyOtp, generateTelegramLink, verifyWebhookSignature)
- `artifacts/api-server/src/lib/otp.ts` — issueOtp / verifyOtpCode (our rate-limit layer + Authevo calls)
- `artifacts/api-server/src/routes/webhooks.ts` — webhook handler

## DB schema (otp_codes after migration 0007)
Active: `id, phone, role, message_id, delivery_status, resend_count, delivered_via, created_at`
Deprecated (nullable, unused): `code_hash, attempts, consumed_at, expires_at`
