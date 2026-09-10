ALTER TABLE operations_worker_heartbeat
  ADD COLUMN last_health_evaluated_at timestamptz,
  ADD COLUMN last_health_critical boolean NOT NULL DEFAULT false;
--> statement-breakpoint
CREATE TABLE operations_alert_conditions (
  condition_key text PRIMARY KEY,
  active boolean NOT NULL DEFAULT false,
  severity text NOT NULL DEFAULT 'warning' CHECK (severity IN ('warning','critical')),
  sequence integer NOT NULL DEFAULT 0,
  first_detected_at timestamptz, last_detected_at timestamptz,
  last_alert_at timestamptz, recovered_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE operations_alert_deliveries (
  id serial PRIMARY KEY,
  condition_key text NOT NULL,
  event_kind text NOT NULL CHECK (event_kind IN ('active','recovery')),
  severity text NOT NULL CHECK (severity IN ('warning','critical')),
  payload jsonb NOT NULL,
  deduplication_key text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','retry','delivered','skipped','dead_letter')),
  attempt_count integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_owner text, lease_expires_at timestamptz,
  last_error text CHECK (last_error IS NULL OR length(last_error) <= 2000),
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX operations_alert_deliveries_dedupe_uidx
  ON operations_alert_deliveries(deduplication_key);
--> statement-breakpoint
CREATE INDEX operations_alert_deliveries_claim_idx
  ON operations_alert_deliveries(status,next_attempt_at,lease_expires_at);