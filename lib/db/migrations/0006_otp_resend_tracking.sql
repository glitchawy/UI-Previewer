-- Migration 0006: track OTP resend count and delivery channel

ALTER TABLE "otp_codes"
  ADD COLUMN IF NOT EXISTS "resend_count" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "delivered_via" text DEFAULT 'dev' NOT NULL;

-- Index to speed up cooldown + rate-limit checks (phone, createdAt)
CREATE INDEX IF NOT EXISTS "otp_codes_phone_created_idx" ON "otp_codes" ("phone", "created_at" DESC);
