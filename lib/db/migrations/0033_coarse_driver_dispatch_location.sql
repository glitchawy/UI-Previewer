ALTER TABLE driver_profiles
  ADD COLUMN IF NOT EXISTS dispatch_lat double precision,
  ADD COLUMN IF NOT EXISTS dispatch_lng double precision,
  ADD COLUMN IF NOT EXISTS dispatch_location_updated_at timestamp with time zone;