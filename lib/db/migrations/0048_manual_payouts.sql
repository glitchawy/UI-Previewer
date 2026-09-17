CREATE TABLE IF NOT EXISTS manual_payout_requests (
  id serial PRIMARY KEY,
  recipient_user_id integer NOT NULL,
  recipient_role text NOT NULL CHECK (recipient_role IN ('driver', 'partner')),
  channel text NOT NULL CHECK (channel IN ('instapay', 'mobile_wallet', 'cash_branch')),
  destination jsonb NOT NULL,
  idempotency_key text NOT NULL,
  gross_amount numeric(12, 2) NOT NULL CHECK (gross_amount > 0),
  fee_amount numeric(12, 2) NOT NULL CHECK (fee_amount >= 0),
  fee_payer text NOT NULL CHECK (fee_payer IN ('recipient', 'platform')),
  net_amount numeric(12, 2) NOT NULL CHECK (net_amount > 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'paid')),
  provider text NOT NULL DEFAULT 'manual',
  provider_metadata jsonb,
  transfer_reference text,
  rejection_reason text,
  approved_by_admin_id integer,
  approved_at timestamptz,
  rejected_by_admin_id integer,
  rejected_at timestamptz,
  paid_by_admin_id integer,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS manual_payout_requests_recipient_idempotency_uidx
  ON manual_payout_requests (recipient_user_id, idempotency_key);
CREATE INDEX IF NOT EXISTS manual_payout_requests_status_created_idx
  ON manual_payout_requests (status, created_at);
CREATE INDEX IF NOT EXISTS manual_payout_requests_recipient_created_idx
  ON manual_payout_requests (recipient_user_id, created_at);

CREATE TABLE IF NOT EXISTS manual_payout_allocations (
  id serial PRIMARY KEY,
  payout_request_id integer NOT NULL,
  recipient_user_id integer NOT NULL,
  source_type text NOT NULL CHECK (source_type IN ('driver_earning', 'restaurant_settlement')),
  source_id integer NOT NULL,
  source_reference_id integer NOT NULL,
  amount numeric(12, 2) NOT NULL CHECK (amount > 0),
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'released', 'consumed')),
  released_at timestamptz,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS manual_payout_allocations_request_source_uidx
  ON manual_payout_allocations (payout_request_id, source_type, source_id);
CREATE UNIQUE INDEX IF NOT EXISTS manual_payout_allocations_active_source_uidx
  ON manual_payout_allocations (source_type, source_id)
  WHERE status IN ('reserved', 'consumed');
CREATE INDEX IF NOT EXISTS manual_payout_allocations_recipient_status_idx
  ON manual_payout_allocations (recipient_user_id, status);

CREATE TABLE IF NOT EXISTS manual_payout_proofs (
  id serial PRIMARY KEY,
  payout_request_id integer NOT NULL UNIQUE,
  object_path text NOT NULL UNIQUE,
  content_type text NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp')),
  size integer NOT NULL CHECK (size > 0 AND size <= 10000000),
  is_signed_receipt boolean NOT NULL DEFAULT false,
  uploaded_by_admin_id integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS manual_payout_proofs_admin_idx
  ON manual_payout_proofs (uploaded_by_admin_id, created_at);

INSERT INTO platform_settings (key, value, version)
VALUES (
  'payouts',
  '{"channels":{"instapay":{"fee":5},"mobile_wallet":{"fee":10},"cash_branch":{"fee":100}},"defaultFeePayer":"recipient"}'::jsonb,
  1
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO admin_permission_groups (key, name, permissions, is_system)
VALUES ('payout_operators', 'Manual payout operators', ARRAY['payouts.read', 'payouts.manage'], true)
ON CONFLICT (key) DO NOTHING;