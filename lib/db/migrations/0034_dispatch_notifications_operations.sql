-- Proactive dispatch invariants.
UPDATE driver_order_offers o SET status = 'cancelled', responded_at = now()
WHERE status = 'pending' AND EXISTS (
  SELECT 1 FROM driver_order_offers newer
  WHERE newer.driver_profile_id = o.driver_profile_id AND newer.status = 'pending'
    AND (newer.offered_at, newer.id) > (o.offered_at, o.id)
);
--> statement-breakpoint
CREATE UNIQUE INDEX driver_order_offer_pending_driver_uidx
  ON driver_order_offers(driver_profile_id) WHERE status = 'pending';
--> statement-breakpoint
CREATE TABLE notification_device_tokens (
  id serial PRIMARY KEY, user_id integer NOT NULL, token text NOT NULL,
  token_hash text NOT NULL, platform text NOT NULL CHECK (platform IN ('ios','android','web')),
  provider text NOT NULL DEFAULT 'expo' CHECK (provider IN ('expo')),
  active_at timestamptz NOT NULL DEFAULT now(), revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX notification_device_tokens_hash_uidx ON notification_device_tokens(token_hash);
--> statement-breakpoint
CREATE INDEX notification_device_tokens_user_active_idx ON notification_device_tokens(user_id, revoked_at);
--> statement-breakpoint
CREATE TABLE notification_delivery_attempts (
  id serial PRIMARY KEY, notification_id integer NOT NULL, device_token_id integer,
  channel text NOT NULL CHECK (channel IN ('expo','webhook','none')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','retry','delivered','skipped','dead_letter')),
  payload jsonb NOT NULL, deduplication_key text NOT NULL, attempt_count integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(), lease_owner text, lease_expires_at timestamptz,
  last_error text CHECK (last_error IS NULL OR length(last_error) <= 2000),
  delivered_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX notification_delivery_attempts_dedupe_uidx ON notification_delivery_attempts(deduplication_key);
--> statement-breakpoint
CREATE INDEX notification_delivery_attempts_claim_idx ON notification_delivery_attempts(status,next_attempt_at,lease_expires_at);
--> statement-breakpoint
CREATE TABLE operations_worker_heartbeat (
  worker_name text PRIMARY KEY, owner text NOT NULL, last_started_at timestamptz NOT NULL,
  last_succeeded_at timestamptz, last_error_at timestamptz, last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);