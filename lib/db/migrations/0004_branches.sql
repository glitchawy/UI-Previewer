-- Migration 0004: branches and branch_staff

CREATE TABLE IF NOT EXISTS "branches" (
  "id" serial PRIMARY KEY NOT NULL,
  "restaurant_id" integer NOT NULL,
  "name" text NOT NULL,
  "address" text NOT NULL,
  "phone" text,
  "lat" double precision,
  "lng" double precision,
  "is_open" boolean DEFAULT true NOT NULL,
  "notes" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "branch_staff" (
  "id" serial PRIMARY KEY NOT NULL,
  "branch_id" integer NOT NULL,
  "user_id" integer NOT NULL,
  "role" text DEFAULT 'STAFF' NOT NULL,
  "joined_at" timestamp with time zone DEFAULT now() NOT NULL,
  "left_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "branches_restaurant_id_idx" ON "branches" ("restaurant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "branch_staff_branch_id_idx" ON "branch_staff" ("branch_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "branch_staff_user_id_idx" ON "branch_staff" ("user_id");
