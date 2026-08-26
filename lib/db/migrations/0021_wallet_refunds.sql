ALTER TABLE users
  ADD COLUMN wallet_balance numeric(12,2) NOT NULL DEFAULT 0;

ALTER TABLE users
  ADD CONSTRAINT users_wallet_balance_nonnegative CHECK (wallet_balance >= 0);

ALTER TABLE orders
  ADD COLUMN wallet_amount_used numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN external_amount_due numeric(10,2);

UPDATE orders SET external_amount_due = total;

ALTER TABLE orders
  ALTER COLUMN external_amount_due SET NOT NULL,
  ALTER COLUMN external_amount_due SET DEFAULT 0,
  ADD CONSTRAINT orders_wallet_amount_nonnegative CHECK (wallet_amount_used >= 0),
  ADD CONSTRAINT orders_external_amount_nonnegative CHECK (external_amount_due >= 0),
  ADD CONSTRAINT orders_payment_allocation_matches_total CHECK (wallet_amount_used + external_amount_due = total);

ALTER TABLE payment_sessions
  ADD COLUMN refunded_amount numeric(10,2) NOT NULL DEFAULT 0,
  ADD CONSTRAINT payment_sessions_refunded_nonnegative CHECK (refunded_amount >= 0),
  ADD CONSTRAINT payment_sessions_refunded_within_capture CHECK (refunded_amount <= amount);

CREATE TABLE wallet_transactions (
  id serial PRIMARY KEY,
  user_id integer NOT NULL,
  type text NOT NULL CHECK (type IN ('credit', 'debit')),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  description text NOT NULL,
  reference_type text NOT NULL CHECK (reference_type IN ('refund', 'order_payment', 'admin_adjustment')),
  reference_id integer NOT NULL,
  balance_after numeric(12,2) NOT NULL CHECK (balance_after >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX wallet_transactions_operation_unique
  ON wallet_transactions (user_id, type, reference_type, reference_id);
CREATE INDEX wallet_transactions_user_created_idx
  ON wallet_transactions (user_id, created_at DESC);

CREATE TABLE refund_requests (
  id serial PRIMARY KEY,
  order_id integer NOT NULL,
  customer_id integer NOT NULL,
  source text NOT NULL CHECK (source IN ('customer_request', 'cancellation')),
  method text NOT NULL CHECK (method IN ('wallet', 'paymob')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'approved', 'rejected', 'failed')),
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  reason text NOT NULL,
  reviewed_by integer,
  resolution_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX refund_requests_source_order_unique
  ON refund_requests (source, order_id);
CREATE INDEX refund_requests_status_created_idx
  ON refund_requests (status, created_at DESC);

CREATE TABLE payment_refund_claims (
  id serial PRIMARY KEY,
  refund_request_id integer NOT NULL,
  order_id integer NOT NULL,
  payment_session_id integer NOT NULL,
  customer_id integer NOT NULL,
  paymob_transaction_id text NOT NULL,
  amount numeric(10,2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'succeeded', 'ambiguous', 'failed')),
  provider_response text,
  failure_reason text,
  resolved_by integer,
  resolution_note text,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX payment_refund_claims_request_unique
  ON payment_refund_claims (refund_request_id);
CREATE UNIQUE INDEX payment_refund_claims_order_unique
  ON payment_refund_claims (order_id);
CREATE INDEX payment_refund_claims_session_status_idx
  ON payment_refund_claims (payment_session_id, status);