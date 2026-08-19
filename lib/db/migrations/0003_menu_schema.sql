-- Migration 0003: menu schema (categories, products, variants, add-ons)

CREATE TABLE IF NOT EXISTS "categories" (
  "id" serial PRIMARY KEY NOT NULL,
  "restaurant_id" integer NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "image_url" text,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "products" (
  "id" serial PRIMARY KEY NOT NULL,
  "restaurant_id" integer NOT NULL,
  "category_id" integer,
  "name" text NOT NULL,
  "description" text,
  "image_url" text,
  "base_price" numeric(10,2) DEFAULT '0' NOT NULL,
  "is_available" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "product_variants" (
  "id" serial PRIMARY KEY NOT NULL,
  "product_id" integer NOT NULL,
  "name" text NOT NULL,
  "price_delta" numeric(10,2) DEFAULT '0' NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "product_addons" (
  "id" serial PRIMARY KEY NOT NULL,
  "product_id" integer NOT NULL,
  "name" text NOT NULL,
  "price" numeric(10,2) DEFAULT '0' NOT NULL,
  "is_available" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "categories_restaurant_id_idx" ON "categories" ("restaurant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_restaurant_id_idx" ON "products" ("restaurant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_category_id_idx" ON "products" ("category_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_variants_product_id_idx" ON "product_variants" ("product_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "product_addons_product_id_idx" ON "product_addons" ("product_id");
