ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "address_text" text,
  ADD COLUMN IF NOT EXISTS "address_place_id" text,
  ADD COLUMN IF NOT EXISTS "address_details" text;
