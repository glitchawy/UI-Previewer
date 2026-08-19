CREATE TABLE IF NOT EXISTS "cart_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "restaurant_id" integer NOT NULL,
  "product_id" integer NOT NULL,
  "variant_id" integer,
  "quantity" integer NOT NULL DEFAULT 1,
  "addon_ids" integer[] NOT NULL DEFAULT '{}',
  "unit_price" numeric(10,2) NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at" timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "cart_items_user_id_idx" ON "cart_items" ("user_id");