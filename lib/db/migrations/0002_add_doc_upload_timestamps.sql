ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "national_id_front_uploaded_at" timestamptz;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "national_id_back_uploaded_at" timestamptz;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "criminal_record_uploaded_at" timestamptz;--> statement-breakpoint
ALTER TABLE "driver_profiles" ADD COLUMN IF NOT EXISTS "license_uploaded_at" timestamptz;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "logo_uploaded_at" timestamptz;--> statement-breakpoint
ALTER TABLE "restaurants" ADD COLUMN IF NOT EXISTS "cover_uploaded_at" timestamptz;
