CREATE TABLE IF NOT EXISTS "customer_favorites" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "target_type" text NOT NULL,
  "target_id" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "customer_favorites_unique" ON "customer_favorites" ("user_id", "target_type", "target_id");
