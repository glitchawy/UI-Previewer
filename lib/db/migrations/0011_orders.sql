CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL,
  restaurant_id INTEGER NOT NULL,
  branch_id INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT NOT NULL DEFAULT 'cash',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  delivery_address_text TEXT NOT NULL,
  delivery_lat DOUBLE PRECISION NOT NULL,
  delivery_lng DOUBLE PRECISION NOT NULL,
  delivery_fee NUMERIC(10,2) NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS orders_customer_created_idx ON orders (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_restaurant_created_idx ON orders (restaurant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  variant_id INTEGER,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  addon_ids INTEGER[] NOT NULL DEFAULT '{}',
  addon_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  line_total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON order_items (order_id);

CREATE TABLE IF NOT EXISTS order_addons (
  id SERIAL PRIMARY KEY,
  order_item_id INTEGER NOT NULL,
  addon_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL
);
CREATE INDEX IF NOT EXISTS order_addons_order_item_idx ON order_addons (order_item_id);