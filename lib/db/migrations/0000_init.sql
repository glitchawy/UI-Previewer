CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"role" text NOT NULL,
	"name" text,
	"lat" double precision,
	"lng" double precision,
	"session_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "restaurants" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_user_id" integer NOT NULL,
	"owner_name" text,
	"email" text,
	"name" text NOT NULL,
	"description" text,
	"phone" text,
	"address" text NOT NULL,
	"branches" integer DEFAULT 1 NOT NULL,
	"hours" text,
	"category" text,
	"delivery_type" text DEFAULT 'restaurant' NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "driver_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"full_name" text NOT NULL,
	"area" text NOT NULL,
	"vehicle_type" text NOT NULL,
	"documents" text,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "otp_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"phone" text NOT NULL,
	"role" text NOT NULL,
	"code_hash" text NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
