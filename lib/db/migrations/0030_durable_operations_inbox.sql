CREATE TABLE paymob_webhook_inbox (
  id bigserial PRIMARY KEY,
  provider_event_key text NOT NULL,
  payload_hash text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','retry','processed','dead_letter')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  received_at timestamptz NOT NULL DEFAULT now(),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  lease_owner text,
  lease_expires_at timestamptz,
  processed_at timestamptz,
  dead_lettered_at timestamptz,
  payment_session_id integer,
  order_ids integer[],
  last_error text,
  CONSTRAINT paymob_webhook_inbox_provider_event_uidx UNIQUE (provider_event_key),
  CONSTRAINT paymob_webhook_inbox_payload_hash_uidx UNIQUE (payload_hash),
  CONSTRAINT paymob_webhook_inbox_error_length CHECK (last_error IS NULL OR length(last_error) <= 2000)
);
--> statement-breakpoint
CREATE INDEX paymob_webhook_inbox_claim_idx
  ON paymob_webhook_inbox(status, next_attempt_at, lease_expires_at);
--> statement-breakpoint
ALTER TABLE notification_outbox
  DROP CONSTRAINT IF EXISTS notification_outbox_status_check;
--> statement-breakpoint
ALTER TABLE notification_outbox
  ADD COLUMN IF NOT EXISTS deduplication_key text,
  ADD COLUMN IF NOT EXISTS next_attempt_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS lease_owner text,
  ADD COLUMN IF NOT EXISTS lease_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz;
--> statement-breakpoint
ALTER TABLE notification_outbox
  ADD CONSTRAINT notification_outbox_status_check
    CHECK (status IN ('pending','processing','retry','sent','cancelled','dead_letter')),
  ADD CONSTRAINT notification_outbox_error_length
    CHECK (last_error IS NULL OR length(last_error) <= 2000);
--> statement-breakpoint
UPDATE notification_outbox
SET deduplication_key = 'outbox:' || id::text
WHERE deduplication_key IS NULL;
--> statement-breakpoint
ALTER TABLE notification_outbox ALTER COLUMN deduplication_key SET NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX notification_outbox_deduplication_uidx ON notification_outbox(deduplication_key);
--> statement-breakpoint
DROP INDEX IF EXISTS notification_outbox_status_idx;
--> statement-breakpoint
CREATE INDEX notification_outbox_claim_idx
  ON notification_outbox(status, next_attempt_at, lease_expires_at);