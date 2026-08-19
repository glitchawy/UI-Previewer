-- Migration 0005: add lat/lng to restaurants table

ALTER TABLE "restaurants"
  ADD COLUMN IF NOT EXISTS "lat" double precision,
  ADD COLUMN IF NOT EXISTS "lng" double precision;
