ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS estimated_preparation_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_travel_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_total_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS estimated_distance_km DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS estimated_delivery_method TEXT;