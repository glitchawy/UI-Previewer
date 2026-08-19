ALTER TABLE cart_items
  ADD COLUMN IF NOT EXISTS payment_session_id INTEGER;

CREATE INDEX IF NOT EXISTS cart_items_payment_session_idx
  ON cart_items (payment_session_id);

ALTER TABLE payment_sessions
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

UPDATE payment_sessions
  SET expires_at = created_at + INTERVAL '1 hour'
  WHERE expires_at IS NULL;

ALTER TABLE payment_sessions
  ALTER COLUMN expires_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS payment_sessions_customer_status_expiry_idx
  ON payment_sessions (customer_id, status, expires_at);