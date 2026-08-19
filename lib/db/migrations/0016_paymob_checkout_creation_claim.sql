ALTER TABLE payment_sessions
  ADD COLUMN IF NOT EXISTS checkout_creation_status TEXT NOT NULL DEFAULT 'not_started';