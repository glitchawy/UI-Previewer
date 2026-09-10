CREATE OR REPLACE FUNCTION reject_business_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'business_audit_logs is append-only';
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS business_audit_logs_reject_update ON business_audit_logs;
--> statement-breakpoint
CREATE TRIGGER business_audit_logs_reject_update
BEFORE UPDATE ON business_audit_logs
FOR EACH ROW
EXECUTE FUNCTION reject_business_audit_log_mutation();
--> statement-breakpoint
DROP TRIGGER IF EXISTS business_audit_logs_reject_delete ON business_audit_logs;
--> statement-breakpoint
CREATE TRIGGER business_audit_logs_reject_delete
BEFORE DELETE ON business_audit_logs
FOR EACH ROW
EXECUTE FUNCTION reject_business_audit_log_mutation();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION reject_restaurant_settlement_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'restaurant settlements cannot be deleted';
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS restaurant_settlements_reject_delete ON restaurant_settlements;
--> statement-breakpoint
CREATE TRIGGER restaurant_settlements_reject_delete
BEFORE DELETE ON restaurant_settlements
FOR EACH ROW
EXECUTE FUNCTION reject_restaurant_settlement_delete();