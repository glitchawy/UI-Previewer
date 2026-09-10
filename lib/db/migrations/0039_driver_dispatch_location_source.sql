ALTER TABLE driver_profiles
  ADD COLUMN IF NOT EXISTS dispatch_location_source text
  CHECK (dispatch_location_source IN ('foreground_idle', 'active_tracking'));