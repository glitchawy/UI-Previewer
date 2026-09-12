ALTER TABLE refund_requests
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS proof_path TEXT;

CREATE TABLE IF NOT EXISTS refund_proof_uploads (
  id SERIAL PRIMARY KEY,
  object_path TEXT NOT NULL,
  order_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  refund_request_id INTEGER,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  size INTEGER NOT NULL CHECK (size > 0 AND size <= 10000000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS refund_proof_uploads_object_path_unique
  ON refund_proof_uploads (object_path);
CREATE UNIQUE INDEX IF NOT EXISTS refund_proof_uploads_order_unique
  ON refund_proof_uploads (order_id);
CREATE UNIQUE INDEX IF NOT EXISTS refund_proof_uploads_refund_request_unique
  ON refund_proof_uploads (refund_request_id)
  WHERE refund_request_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS refund_proof_uploads_customer_idx
  ON refund_proof_uploads (customer_id);