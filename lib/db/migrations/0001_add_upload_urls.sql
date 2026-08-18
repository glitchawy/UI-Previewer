ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "logo_url" text;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "cover_url" text;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "national_id_front_url" text;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "national_id_back_url" text;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "criminal_record_url" text;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "license_url" text;
