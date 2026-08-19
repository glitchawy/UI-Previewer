---
name: WhatsApp OTP System
description: OTP delivery, security properties, required env vars, and delivery modes for the Talabat Betak platform
---

## Required secrets (Replit Secrets — never hardcode)
- `WHATSAPP_API_URL` — provider base URL, e.g. `https://api.yourprovider.com/v1`
- `WHATSAPP_API_TOKEN` — bearer token for the provider
- `WHATSAPP_SENDER_ID` — (optional) sender phone / ID
- `WHATSAPP_TEMPLATE` — (optional) pre-approved template name for Meta WABA

## Delivery modes (`OTP_DELIVERY` env var)
- `dev` (default in development) — fixed code `123456` accepted; no network call
- `log` (staging) — real random code written to server log only
- `live` (required in production) — sends via WhatsApp API

**Why:** spec requires WhatsApp (not SMS); provider credentials provided by owner later. The abstraction is in `artifacts/api-server/src/lib/whatsapp.ts`.

## Security properties
- SHA-256 hashed in DB — never plaintext
- 5-minute TTL (`OTP_TTL_MS`)
- 5 max verification attempts before lockout (`MAX_ATTEMPTS`)
- 60-second server-side resend cooldown (`RESEND_COOLDOWN_S`) — enforced in `issueOtp`, not just frontend
- Hourly rate limit: 5 sends per phone per rolling 60-minute window (`RATE_LIMIT_MAX`)
- Codes invalidated (deleted) on new issue for same phone+role

## Account separation
`auth.ts` explicitly checks if a phone is registered under a different role and returns Arabic error naming both roles. A customer cannot become a partner — separate accounts required.

## DB schema (otp_codes table)
Fields: `id, phone, role, code_hash, attempts, resend_count, delivered_via, expires_at, consumed_at, created_at`
Index: `otp_codes_phone_created_idx` on (phone, created_at DESC) for cooldown/rate-limit queries.
