ALTER TABLE product_variants
  ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS restaurant_name TEXT,
  ADD COLUMN IF NOT EXISTS branch_name TEXT;

UPDATE orders o
SET restaurant_name = r.name
FROM restaurants r
WHERE o.restaurant_id = r.id
  AND o.restaurant_name IS NULL;

UPDATE orders o
SET branch_name = b.name
FROM branches b
WHERE o.branch_id = b.id
  AND o.branch_name IS NULL;

ALTER TABLE orders
  ALTER COLUMN restaurant_name SET NOT NULL;

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS product_name TEXT,
  ADD COLUMN IF NOT EXISTS variant_name TEXT;

UPDATE order_items oi
SET product_name = p.name
FROM products p
WHERE oi.product_id = p.id
  AND oi.product_name IS NULL;

UPDATE order_items oi
SET variant_name = v.name
FROM product_variants v
WHERE oi.variant_id = v.id
  AND oi.variant_name IS NULL;

ALTER TABLE order_items
  ALTER COLUMN product_name SET NOT NULL;

CREATE TABLE IF NOT EXISTS order_status_events (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS order_status_events_order_created_idx
  ON order_status_events (order_id, created_at ASC);

INSERT INTO order_status_events (order_id, status, created_at)
SELECT o.id, 'pending', o.created_at
FROM orders o
WHERE NOT EXISTS (
  SELECT 1 FROM order_status_events ose WHERE ose.order_id = o.id
);