ALTER TABLE payment_sessions
  ADD COLUMN IF NOT EXISTS paymob_integration_ids TEXT[];