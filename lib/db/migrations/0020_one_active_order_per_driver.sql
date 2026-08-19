CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_one_active_per_driver
  ON orders (driver_profile_id)
  WHERE driver_profile_id IS NOT NULL
    AND status IN ('ready', 'picked_up');