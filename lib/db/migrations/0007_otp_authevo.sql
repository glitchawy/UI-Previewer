-- Migration 0007: adapt otp_codes for Authevo-managed OTP lifecycle
-- Authevo handles code generation, delivery, and verification server-side.
-- The otp_codes table is now a send audit log (cooldown + rate-limit + webhooks).

ALTER TABLE "otp_codes"
  -- Authevo manages the code — we no longer store or hash it ourselves
  ALTER COLUMN "code_hash"  DROP NOT NULL,
  -- Authevo manages attempt counting
  ALTER COLUMN "attempts"   DROP NOT NULL,
  -- Authevo returns expiry as seconds; we may store it but it is not required
  ALTER COLUMN "expires_at" DROP NOT NULL,
  -- Authevo's message_id for correlating webhook delivery status updates
  ADD COLUMN IF NOT EXISTS "message_id"      text,
  -- Delivery status updated via webhook: pending | sent | delivered | read | failed
  ADD COLUMN IF NOT EXISTS "delivery_status" text NOT NULL DEFAULT 'pending';
