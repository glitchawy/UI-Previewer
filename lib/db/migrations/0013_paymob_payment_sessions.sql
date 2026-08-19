ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_session_id INTEGER,
  ADD COLUMN IF NOT EXISTS paymob_transaction_id TEXT;

CREATE INDEX IF NOT EXISTS orders_payment_session_idx
  ON orders (payment_session_id);

CREATE TABLE IF NOT EXISTS payment_sessions (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  provider TEXT NOT NULL DEFAULT 'paymob',
  reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP',
  paymob_order_id TEXT UNIQUE,
  paymob_transaction_id TEXT UNIQUE,
  payment_url TEXT,
  failure_reason TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payment_sessions_customer_created_idx
  ON payment_sessions (customer_id, created_at DESC);