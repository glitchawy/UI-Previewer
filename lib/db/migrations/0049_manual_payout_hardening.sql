-- Manual payout hardening follows 0048_manual_payouts.  Keep this migration
-- separate because 0048 may already have been applied in deployed databases.

ALTER TABLE wallet_transactions
  DROP CONSTRAINT IF EXISTS wallet_transactions_reference_type_check;
ALTER TABLE wallet_transactions
  ADD CONSTRAINT wallet_transactions_reference_type_check
  CHECK (reference_type IN (
    'refund', 'order_payment', 'admin_adjustment', 'restaurant_settlement',
    'driver_earning', 'manual_payout'
  ));
--> statement-breakpoint

ALTER TABLE manual_payout_requests
  DROP CONSTRAINT IF EXISTS manual_payout_fee_math_check;
ALTER TABLE manual_payout_requests
  ADD CONSTRAINT manual_payout_fee_math_check
  CHECK (
    (fee_payer = 'recipient' AND net_amount = gross_amount - fee_amount)
    OR (fee_payer = 'platform' AND net_amount = gross_amount)
  );
--> statement-breakpoint

ALTER TABLE manual_payout_allocations
  DROP CONSTRAINT IF EXISTS manual_payout_allocations_terminal_timestamp_check;
ALTER TABLE manual_payout_allocations
  ADD CONSTRAINT manual_payout_allocations_terminal_timestamp_check
  CHECK (
    ((status = 'released' AND released_at IS NOT NULL) OR (status <> 'released' AND released_at IS NULL))
    AND ((status = 'consumed' AND consumed_at IS NOT NULL) OR (status <> 'consumed' AND consumed_at IS NULL))
  );
--> statement-breakpoint

CREATE OR REPLACE FUNCTION guard_manual_payout_request_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'manual payout history is immutable';
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'pending' THEN
      RAISE EXCEPTION 'manual payout must start pending';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW IS NOT DISTINCT FROM OLD THEN
    RETURN NEW;
  END IF;

  IF NEW.recipient_user_id IS DISTINCT FROM OLD.recipient_user_id
    OR NEW.recipient_role IS DISTINCT FROM OLD.recipient_role
    OR NEW.channel IS DISTINCT FROM OLD.channel
    OR NEW.destination IS DISTINCT FROM OLD.destination
    OR NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
    OR NEW.gross_amount IS DISTINCT FROM OLD.gross_amount
    OR NEW.fee_amount IS DISTINCT FROM OLD.fee_amount
    OR NEW.fee_payer IS DISTINCT FROM OLD.fee_payer
    OR NEW.net_amount IS DISTINCT FROM OLD.net_amount
    OR NEW.provider IS DISTINCT FROM OLD.provider
    OR NEW.provider_metadata IS DISTINCT FROM OLD.provider_metadata
    OR OLD.status IN ('paid', 'rejected', 'cancelled') THEN
    RAISE EXCEPTION 'manual payout financial snapshot is immutable';
  END IF;

  IF NOT (
    (OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected', 'cancelled'))
    OR (OLD.status = 'approved' AND NEW.status IN ('rejected', 'paid'))
  ) THEN
    RAISE EXCEPTION 'invalid manual payout status transition';
  END IF;

  IF NEW.status = 'approved' AND (NEW.approved_by_admin_id IS NULL OR NEW.approved_at IS NULL) THEN
    RAISE EXCEPTION 'approved manual payout requires approving administrator';
  END IF;
  IF NEW.status = 'approved' AND NOT EXISTS (
    SELECT 1 FROM manual_payout_allocations
    WHERE payout_request_id = NEW.id AND status = 'reserved'
  ) THEN
    RAISE EXCEPTION 'approved manual payout requires reserved allocations';
  END IF;
  IF NEW.status = 'rejected' AND (
    NEW.rejected_by_admin_id IS NULL OR NEW.rejected_at IS NULL OR NEW.rejection_reason IS NULL
  ) THEN
    RAISE EXCEPTION 'rejected manual payout requires reason and administrator';
  END IF;
  IF NEW.status <> 'rejected' AND (
    NEW.rejected_by_admin_id IS NOT NULL OR NEW.rejected_at IS NOT NULL OR NEW.rejection_reason IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'rejection fields require rejected status';
  END IF;
  IF NEW.status IN ('pending', 'cancelled') AND (
    NEW.approved_by_admin_id IS NOT NULL OR NEW.approved_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'approval fields require approved status';
  END IF;
  IF NEW.status <> 'paid' AND NEW.transfer_reference IS NOT NULL THEN
    RAISE EXCEPTION 'transfer reference requires paid status';
  END IF;
  IF NEW.status = 'paid' THEN
    IF NEW.paid_by_admin_id IS NULL OR NEW.paid_at IS NULL THEN
      RAISE EXCEPTION 'paid manual payout requires paying administrator';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM manual_payout_proofs
      WHERE payout_request_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'paid manual payout requires proof';
    END IF;
    IF (NEW.channel <> 'cash_branch' AND NEW.transfer_reference IS NULL)
      OR (NEW.channel = 'cash_branch' AND NEW.transfer_reference IS NOT NULL) THEN
      RAISE EXCEPTION 'paid manual payout transfer reference is inconsistent';
    END IF;
    IF EXISTS (
      SELECT 1 FROM manual_payout_allocations
      WHERE payout_request_id = NEW.id AND status <> 'consumed'
    ) THEN
      RAISE EXCEPTION 'paid manual payout requires consumed allocations';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM manual_payout_allocations
      WHERE payout_request_id = NEW.id AND status = 'consumed'
    ) THEN
      RAISE EXCEPTION 'paid manual payout requires at least one allocation';
    END IF;
  END IF;
  IF NEW.status IN ('rejected', 'cancelled') AND EXISTS (
    SELECT 1 FROM manual_payout_allocations
    WHERE payout_request_id = NEW.id AND status = 'reserved'
  ) THEN
    RAISE EXCEPTION 'terminal manual payout cannot retain reservations';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS manual_payout_requests_guard_mutation ON manual_payout_requests;
CREATE TRIGGER manual_payout_requests_guard_mutation
BEFORE INSERT OR UPDATE OR DELETE ON manual_payout_requests
FOR EACH ROW EXECUTE FUNCTION guard_manual_payout_request_mutation();
--> statement-breakpoint

CREATE OR REPLACE FUNCTION guard_manual_payout_allocation_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  payout_user integer;
  payout_status text;
  payout_gross numeric;
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'manual payout allocations are immutable history';
  END IF;

  SELECT recipient_user_id, status, gross_amount
    INTO payout_user, payout_status, payout_gross
    FROM manual_payout_requests
    WHERE id = NEW.payout_request_id;
  IF payout_user IS NULL THEN
    RAISE EXCEPTION 'manual payout allocation requires an existing payout';
  END IF;
  IF NEW.recipient_user_id <> payout_user OR NEW.amount > payout_gross THEN
    RAISE EXCEPTION 'manual payout allocation does not match payout snapshot';
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF payout_status <> 'pending' OR NEW.status <> 'reserved' THEN
      RAISE EXCEPTION 'new allocation requires a pending payout';
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.payout_request_id IS DISTINCT FROM OLD.payout_request_id
    OR NEW.recipient_user_id IS DISTINCT FROM OLD.recipient_user_id
    OR NEW.source_type IS DISTINCT FROM OLD.source_type
    OR NEW.source_id IS DISTINCT FROM OLD.source_id
    OR NEW.source_reference_id IS DISTINCT FROM OLD.source_reference_id
    OR NEW.amount IS DISTINCT FROM OLD.amount
    OR OLD.status IN ('released', 'consumed') THEN
    RAISE EXCEPTION 'manual payout allocation source snapshot is immutable';
  END IF;
  IF OLD.status = 'reserved' AND NEW.status NOT IN ('reserved', 'released', 'consumed') THEN
    RAISE EXCEPTION 'invalid manual payout allocation transition';
  END IF;
  IF OLD.status = 'reserved' AND NEW.status = 'released' AND NEW.released_at IS NULL THEN
    RAISE EXCEPTION 'released allocation requires timestamp';
  END IF;
  IF OLD.status = 'reserved' AND NEW.status = 'consumed' AND NEW.consumed_at IS NULL THEN
    RAISE EXCEPTION 'consumed allocation requires timestamp';
  END IF;
  IF payout_status = 'paid' AND NEW.status <> 'consumed' THEN
    RAISE EXCEPTION 'paid payout allocations must be consumed';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS manual_payout_allocations_guard_mutation ON manual_payout_allocations;
CREATE TRIGGER manual_payout_allocations_guard_mutation
BEFORE INSERT OR UPDATE OR DELETE ON manual_payout_allocations
FOR EACH ROW EXECUTE FUNCTION guard_manual_payout_allocation_mutation();
--> statement-breakpoint

CREATE OR REPLACE FUNCTION guard_manual_payout_proof_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  payout_status text;
BEGIN
  SELECT status INTO payout_status
    FROM manual_payout_requests
    WHERE id = COALESCE(NEW.payout_request_id, OLD.payout_request_id);
  IF payout_status = 'paid' THEN
    RAISE EXCEPTION 'paid manual payout receipt is immutable';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'manual payout receipts are immutable history';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint

DROP TRIGGER IF EXISTS manual_payout_proofs_guard_mutation ON manual_payout_proofs;
CREATE TRIGGER manual_payout_proofs_guard_mutation
BEFORE INSERT OR UPDATE OR DELETE ON manual_payout_proofs
FOR EACH ROW EXECUTE FUNCTION guard_manual_payout_proof_mutation();