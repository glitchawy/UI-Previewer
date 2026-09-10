CREATE TABLE IF NOT EXISTS platform_revenue_allocations (
  id serial PRIMARY KEY,
  reference text NOT NULL UNIQUE,
  kind text NOT NULL CHECK (kind IN ('delivery_fee_share')),
  source text NOT NULL CHECK (source IN ('cash_delivery')),
  order_id integer NOT NULL UNIQUE,
  payment_method text NOT NULL CHECK (payment_method IN ('cash')),
  payment_session_id integer,
  restaurant_id integer NOT NULL,
  driver_profile_id integer NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS platform_revenue_allocations_created_idx
  ON platform_revenue_allocations(created_at, id);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION reject_platform_revenue_allocation_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'platform_revenue_allocations is append-only';
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS platform_revenue_allocations_reject_update ON platform_revenue_allocations;
--> statement-breakpoint
CREATE TRIGGER platform_revenue_allocations_reject_update
BEFORE UPDATE ON platform_revenue_allocations
FOR EACH ROW EXECUTE FUNCTION reject_platform_revenue_allocation_mutation();
--> statement-breakpoint
DROP TRIGGER IF EXISTS platform_revenue_allocations_reject_delete ON platform_revenue_allocations;
--> statement-breakpoint
CREATE TRIGGER platform_revenue_allocations_reject_delete
BEFORE DELETE ON platform_revenue_allocations
FOR EACH ROW EXECUTE FUNCTION reject_platform_revenue_allocation_mutation();