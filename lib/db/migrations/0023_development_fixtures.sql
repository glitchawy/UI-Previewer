ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_development_fixture" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "is_development_fixture" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "is_development_fixture" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN IF NOT EXISTS "is_development_fixture" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN IF NOT EXISTS "is_development_fixture" boolean DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_development_fixture" boolean DEFAULT false NOT NULL;