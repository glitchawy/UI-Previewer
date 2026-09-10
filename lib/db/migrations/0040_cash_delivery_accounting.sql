ALTER TABLE business_audit_logs ALTER COLUMN actor_admin_id DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE business_audit_logs ADD COLUMN IF NOT EXISTS actor_user_id integer;
--> statement-breakpoint
ALTER TABLE business_audit_logs ADD COLUMN IF NOT EXISTS actor_role text;
--> statement-breakpoint
ALTER TABLE business_audit_logs ADD CONSTRAINT business_audit_actor_check
  CHECK (actor_admin_id IS NOT NULL OR actor_user_id IS NOT NULL OR actor_role = 'system');
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS business_audit_transition_uidx
  ON business_audit_logs(action, entity_type, entity_id)
  WHERE action IN ('driver.order.picked_up','driver.order.delivered','system.cash_order.reconciled');
--> statement-breakpoint
ALTER TABLE restaurant_settlements ALTER COLUMN created_by_admin_id DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_reference_type_check;
--> statement-breakpoint
ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_reference_type_check
  CHECK (reference_type IN ('refund','order_payment','admin_adjustment','restaurant_settlement','driver_earning'));
--> statement-breakpoint
ALTER TABLE restaurant_settlements ADD COLUMN IF NOT EXISTS order_id integer;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS restaurant_settlements_order_uidx
  ON restaurant_settlements(order_id) WHERE order_id IS NOT NULL;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_restaurant_settlement_snapshot_update() RETURNS trigger AS $$
BEGIN
  IF NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
    OR NEW.restaurant_id IS DISTINCT FROM OLD.restaurant_id
    OR NEW.order_id IS DISTINCT FROM OLD.order_id
    OR NEW.period_start IS DISTINCT FROM OLD.period_start
    OR NEW.period_end IS DISTINCT FROM OLD.period_end
    OR NEW.order_count IS DISTINCT FROM OLD.order_count
    OR NEW.gross_amount IS DISTINCT FROM OLD.gross_amount
    OR NEW.commission_rate IS DISTINCT FROM OLD.commission_rate
    OR NEW.commission_amount IS DISTINCT FROM OLD.commission_amount
    OR NEW.refund_amount IS DISTINCT FROM OLD.refund_amount
    OR NEW.net_amount IS DISTINCT FROM OLD.net_amount
    OR NEW.created_by_admin_id IS DISTINCT FROM OLD.created_by_admin_id
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'restaurant settlement financial snapshot is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS cash_order_reconciliations (
  id serial PRIMARY KEY,
  order_id integer NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','retry','processed','dead_letter')),
  attempt_count integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_owner text,
  lease_expires_at timestamptz,
  last_error text,
  processed_at timestamptz,
  dead_lettered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT cash_order_reconciliation_error_length CHECK (last_error IS NULL OR length(last_error) <= 2000)
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS cash_order_reconciliations_claim_idx
  ON cash_order_reconciliations(status,next_attempt_at,lease_expires_at);