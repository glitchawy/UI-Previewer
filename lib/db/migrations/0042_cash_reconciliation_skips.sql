ALTER TABLE cash_order_reconciliations
  DROP CONSTRAINT IF EXISTS cash_order_reconciliations_status_check;
--> statement-breakpoint
ALTER TABLE cash_order_reconciliations
  ADD CONSTRAINT cash_order_reconciliations_status_check
  CHECK (status IN ('pending','processing','retry','processed','dead_letter','skipped'));
--> statement-breakpoint
ALTER TABLE cash_order_reconciliations
  ADD COLUMN IF NOT EXISTS safe_reason text;
--> statement-breakpoint
ALTER TABLE cash_order_reconciliations
  ADD CONSTRAINT cash_order_reconciliations_safe_reason_check
  CHECK (
    (status = 'skipped' AND safe_reason IN ('REFUNDED_ORDER_NOT_SETTLEMENT_ELIGIBLE','FAILED_ORDER_NOT_SETTLEMENT_ELIGIBLE','CANCELLED_ORDER_NOT_SETTLEMENT_ELIGIBLE'))
    OR (status <> 'skipped' AND safe_reason IS NULL)
  );
--> statement-breakpoint
DROP INDEX IF EXISTS business_audit_transition_uidx;
--> statement-breakpoint
CREATE UNIQUE INDEX business_audit_transition_uidx
  ON business_audit_logs(action, entity_type, entity_id)
  WHERE action IN (
    'driver.order.picked_up',
    'driver.order.delivered',
    'system.cash_order.reconciled',
    'system.cash_order.reconciliation_skipped'
  );