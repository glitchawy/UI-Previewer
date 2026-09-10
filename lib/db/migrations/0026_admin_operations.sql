CREATE TABLE IF NOT EXISTS platform_settings (key text PRIMARY KEY, value jsonb NOT NULL, version integer NOT NULL DEFAULT 1, updated_by_admin_id integer, updated_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS delivery_pricing_tiers (id serial PRIMARY KEY, from_km numeric(8,2) NOT NULL, to_km numeric(8,2) NOT NULL, price numeric(10,2) NOT NULL, is_active boolean NOT NULL DEFAULT true, created_by_admin_id integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT delivery_pricing_range_check CHECK (from_km >= 0 AND to_km > from_km AND price >= 0));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS restaurant_commissions (restaurant_id integer PRIMARY KEY, rate numeric(5,2) NOT NULL, updated_by_admin_id integer NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT restaurant_commission_rate_check CHECK (rate >= 0 AND rate <= 100));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS driver_commission_rules (id serial PRIMARY KEY, name text NOT NULL, scope text NOT NULL DEFAULT 'all', driver_share_rate numeric(5,2) NOT NULL, bonus_per_order numeric(10,2) NOT NULL DEFAULT 0, is_active boolean NOT NULL DEFAULT true, created_by_admin_id integer NOT NULL, updated_by_admin_id integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CONSTRAINT driver_commission_values_check CHECK (driver_share_rate >= 0 AND driver_share_rate <= 100 AND bonus_per_order >= 0));
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS restaurant_settlements (id serial PRIMARY KEY, idempotency_key text NOT NULL UNIQUE, restaurant_id integer NOT NULL, period_start date NOT NULL, period_end date NOT NULL, order_count integer NOT NULL, gross_amount numeric(12,2) NOT NULL, commission_rate numeric(5,2) NOT NULL, commission_amount numeric(12,2) NOT NULL, refund_amount numeric(12,2) NOT NULL, net_amount numeric(12,2) NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','paid')), created_by_admin_id integer NOT NULL, approved_by_admin_id integer, paid_by_admin_id integer, approved_at timestamptz, paid_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS restaurant_settlements_period_idx ON restaurant_settlements(period_start,period_end);
--> statement-breakpoint
CREATE OR REPLACE FUNCTION prevent_restaurant_settlement_snapshot_update() RETURNS trigger AS $$
BEGIN
  IF NEW.idempotency_key IS DISTINCT FROM OLD.idempotency_key
    OR NEW.restaurant_id IS DISTINCT FROM OLD.restaurant_id
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
DROP TRIGGER IF EXISTS restaurant_settlement_snapshot_immutable ON restaurant_settlements;
--> statement-breakpoint
CREATE TRIGGER restaurant_settlement_snapshot_immutable BEFORE UPDATE ON restaurant_settlements FOR EACH ROW EXECUTE FUNCTION prevent_restaurant_settlement_snapshot_update();
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS notification_outbox (id serial PRIMARY KEY, event_type text NOT NULL, audience jsonb NOT NULL, title text NOT NULL, body text NOT NULL, status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','cancelled')), replay_of_id integer, attempt_count integer NOT NULL DEFAULT 0, created_by_admin_id integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS notification_outbox_status_idx ON notification_outbox(status,created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS order_reviews (id serial PRIMARY KEY, order_id integer NOT NULL UNIQUE, customer_id integer NOT NULL, restaurant_id integer NOT NULL, driver_profile_id integer, rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5), comment text, moderation_status text NOT NULL DEFAULT 'visible' CHECK (moderation_status IN ('visible','hidden')), moderation_reason text, moderated_by_admin_id integer, moderated_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS order_reviews_moderation_idx ON order_reviews(moderation_status,created_at);