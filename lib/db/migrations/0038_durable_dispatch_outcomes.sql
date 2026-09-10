CREATE TABLE IF NOT EXISTS "order_dispatch_attempts" (
  "id" serial PRIMARY KEY NOT NULL,
  "order_id" integer NOT NULL,
  "attempt_number" integer NOT NULL,
  "outcome" text NOT NULL,
  "safe_reason" text,
  "offer_id" integer,
  "driver_profile_id" integer,
  "coarse_distance_km" double precision,
  "next_retry_at" timestamp with time zone,
  "attempted_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "order_dispatch_attempt_outcome_check" CHECK (
    ("outcome" = 'offered' AND "offer_id" IS NOT NULL AND "driver_profile_id" IS NOT NULL
      AND "coarse_distance_km" IS NOT NULL AND "safe_reason" IS NULL AND "next_retry_at" IS NULL)
    OR
    ("outcome" = 'no_eligible_driver' AND "offer_id" IS NULL AND "driver_profile_id" IS NULL
      AND "coarse_distance_km" IS NULL
      AND "safe_reason" IN ('NO_FRESH_ELIGIBLE_DRIVER', 'BRANCH_LOCATION_UNAVAILABLE', 'OFFER_CONFLICT')
      AND "next_retry_at" IS NOT NULL)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS "order_dispatch_attempt_number_uidx"
  ON "order_dispatch_attempts" ("order_id", "attempt_number");
CREATE UNIQUE INDEX IF NOT EXISTS "order_dispatch_attempt_offer_uidx"
  ON "order_dispatch_attempts" ("offer_id") WHERE "offer_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "order_dispatch_attempt_order_time_idx"
  ON "order_dispatch_attempts" ("order_id", "attempted_at");
CREATE INDEX IF NOT EXISTS "order_dispatch_attempt_retry_idx"
  ON "order_dispatch_attempts" ("next_retry_at") WHERE "outcome" = 'no_eligible_driver';

-- Re-offers after an expiry are valid attempts; pending-offer partial indexes still prevent duplicates.
DROP INDEX IF EXISTS "driver_order_offer_attempt_uidx";

-- Dispatch outcomes are operational records, not permanent location history.
DELETE FROM "order_dispatch_attempts" WHERE "attempted_at" < now() - interval '30 days';