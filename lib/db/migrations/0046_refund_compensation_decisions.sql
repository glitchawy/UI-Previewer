ALTER TABLE refund_requests
  ADD COLUMN IF NOT EXISTS compensation_type TEXT,
  ADD COLUMN IF NOT EXISTS responsible_party TEXT,
  ADD COLUMN IF NOT EXISTS compensation_items JSONB;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'refund_requests_compensation_type_valid'
  ) THEN
    ALTER TABLE refund_requests
      ADD CONSTRAINT refund_requests_compensation_type_valid
      CHECK (
        compensation_type IS NULL
        OR compensation_type IN ('full_refund', 'item_refund', 'courtesy_credit')
      );
  END IF;
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'refund_requests_responsible_party_valid'
  ) THEN
    ALTER TABLE refund_requests
      ADD CONSTRAINT refund_requests_responsible_party_valid
      CHECK (
        responsible_party IS NULL
        OR responsible_party IN (
          'restaurant', 'driver', 'customer', 'platform', 'shared', 'undetermined'
        )
      );
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS refund_requests_order_status_idx
  ON refund_requests (order_id, status);

CREATE OR REPLACE FUNCTION reject_approved_refund_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'approved' AND (
    NEW.order_id IS DISTINCT FROM OLD.order_id
    OR NEW.customer_id IS DISTINCT FROM OLD.customer_id
    OR NEW.source IS DISTINCT FROM OLD.source
    OR NEW.method IS DISTINCT FROM OLD.method
    OR NEW.status IS DISTINCT FROM OLD.status
    OR NEW.amount IS DISTINCT FROM OLD.amount
    OR NEW.reason IS DISTINCT FROM OLD.reason
    OR NEW.description IS DISTINCT FROM OLD.description
    OR NEW.proof_path IS DISTINCT FROM OLD.proof_path
    OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
    OR NEW.resolution_note IS DISTINCT FROM OLD.resolution_note
    OR NEW.compensation_type IS DISTINCT FROM OLD.compensation_type
    OR NEW.responsible_party IS DISTINCT FROM OLD.responsible_party
    OR NEW.compensation_items IS DISTINCT FROM OLD.compensation_items
    OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
  ) THEN
    RAISE EXCEPTION 'approved refund decision is immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS refund_requests_reject_approved_mutation ON refund_requests;
CREATE TRIGGER refund_requests_reject_approved_mutation
BEFORE UPDATE ON refund_requests
FOR EACH ROW
EXECUTE FUNCTION reject_approved_refund_mutation();