CREATE TABLE IF NOT EXISTS "admin_permission_groups" (
  "id" serial PRIMARY KEY NOT NULL,
  "key" text NOT NULL,
  "name" text NOT NULL,
  "permissions" text[] DEFAULT '{}'::text[] NOT NULL,
  "is_system" boolean DEFAULT false NOT NULL,
  "created_by_admin_id" integer,
  "updated_by_admin_id" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "admin_permission_groups_key_uidx" ON "admin_permission_groups" USING btree ("key");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "admin_accounts" (
  "user_id" integer PRIMARY KEY NOT NULL,
  "email" text,
  "permission_group_id" integer,
  "is_active" boolean DEFAULT true NOT NULL,
  "is_super_admin" boolean DEFAULT false NOT NULL,
  "created_by_admin_id" integer,
  "updated_by_admin_id" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "admin_accounts_email_uidx" ON "admin_accounts" USING btree ("email");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "admin_accounts_group_idx" ON "admin_accounts" USING btree ("permission_group_id");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "business_audit_logs" (
  "id" serial PRIMARY KEY NOT NULL,
  "actor_admin_id" integer NOT NULL,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" text NOT NULL,
  "before" jsonb,
  "after" jsonb,
  "reason" text,
  "request_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "business_audit_entity_idx" ON "business_audit_logs" USING btree ("entity_type","entity_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "business_audit_actor_idx" ON "business_audit_logs" USING btree ("actor_admin_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "business_audit_request_idx" ON "business_audit_logs" USING btree ("request_id");