ALTER TABLE "driver_profiles" ADD COLUMN "is_online" boolean DEFAULT false NOT NULL;
ALTER TABLE "driver_profiles" ADD COLUMN "is_available" boolean DEFAULT false NOT NULL;
ALTER TABLE "driver_profiles" ADD COLUMN "last_heartbeat_at" timestamptz;
ALTER TABLE "driver_profiles" ADD COLUMN "current_workload" integer DEFAULT 0 NOT NULL;
ALTER TABLE "driver_profiles" ADD COLUMN "service_radius_km" double precision DEFAULT 15 NOT NULL;
UPDATE "driver_profiles" dp SET "current_workload" = 1, "is_available" = false
WHERE EXISTS (
  SELECT 1 FROM "orders" o
  WHERE o."driver_profile_id" = dp."id" AND o."status" IN ('ready', 'picked_up')
);

CREATE TABLE "driver_location_history" (
  "id" serial PRIMARY KEY,
  "driver_profile_id" integer NOT NULL,
  "order_id" integer,
  "lat" double precision NOT NULL,
  "lng" double precision NOT NULL,
  "recorded_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "driver_location_history_coordinate_check" CHECK ("lat" between -90 and 90 and "lng" between -180 and 180)
);
CREATE INDEX "driver_location_history_driver_time_idx" ON "driver_location_history" ("driver_profile_id", "recorded_at");

CREATE TABLE "driver_order_offers" (
  "id" serial PRIMARY KEY,
  "order_id" integer NOT NULL,
  "driver_profile_id" integer NOT NULL,
  "status" text DEFAULT 'pending' NOT NULL,
  "distance_km" double precision NOT NULL,
  "offered_at" timestamptz DEFAULT now() NOT NULL,
  "expires_at" timestamptz NOT NULL,
  "responded_at" timestamptz
);
CREATE UNIQUE INDEX "driver_order_offer_attempt_uidx" ON "driver_order_offers" ("order_id", "driver_profile_id");
CREATE UNIQUE INDEX "driver_order_offer_pending_order_uidx" ON "driver_order_offers" ("order_id") WHERE "status" = 'pending';
CREATE INDEX "driver_order_offer_driver_status_idx" ON "driver_order_offers" ("driver_profile_id", "status", "expires_at");

CREATE TABLE "driver_earnings" (
  "id" serial PRIMARY KEY,
  "order_id" integer NOT NULL,
  "driver_profile_id" integer NOT NULL,
  "delivery_fee" numeric(10,2) NOT NULL,
  "share_rate" numeric(5,2) NOT NULL,
  "bonus" numeric(10,2) DEFAULT 0 NOT NULL,
  "net_amount" numeric(10,2) NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "driver_earnings_amounts_check" CHECK ("delivery_fee" >= 0 and "share_rate" between 0 and 100 and "bonus" >= 0 and "net_amount" >= 0)
);
CREATE UNIQUE INDEX "driver_earnings_order_uidx" ON "driver_earnings" ("order_id");
CREATE INDEX "driver_earnings_driver_time_idx" ON "driver_earnings" ("driver_profile_id", "created_at");

CREATE OR REPLACE FUNCTION prevent_driver_earnings_mutation() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'driver earnings snapshots are immutable'; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER "driver_earnings_immutable_update" BEFORE UPDATE OR DELETE ON "driver_earnings"
FOR EACH ROW EXECUTE FUNCTION prevent_driver_earnings_mutation();