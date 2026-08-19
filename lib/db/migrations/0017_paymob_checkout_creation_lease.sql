ALTER TABLE payment_sessions
  ADD COLUMN IF NOT EXISTS checkout_creation_started_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS payment_sessions_checkout_creation_idx
  ON payment_sessions (status, checkout_creation_status, checkout_creation_started_at);