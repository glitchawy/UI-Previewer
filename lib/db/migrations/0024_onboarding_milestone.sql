ALTER TABLE "restaurants" ADD COLUMN "rejection_reason" text;
ALTER TABLE "restaurants" ADD COLUMN "latest_document_uploaded_at" timestamp with time zone;
ALTER TABLE "driver_profiles" ADD COLUMN "rejection_reason" text;
ALTER TABLE "driver_profiles" ADD COLUMN "latest_document_uploaded_at" timestamp with time zone;

CREATE TABLE "application_decisions" (
  "id" serial PRIMARY KEY NOT NULL,
  "application_type" text NOT NULL,
  "application_id" integer NOT NULL,
  "applicant_user_id" integer NOT NULL,
  "actor_admin_id" integer NOT NULL,
  "from_status" text NOT NULL,
  "to_status" text NOT NULL,
  "reason" text,
  "request_id" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "application_decisions_type_check" CHECK ("application_type" IN ('restaurant', 'driver'))
);
CREATE INDEX "application_decisions_application_idx" ON "application_decisions" ("application_type", "application_id", "created_at");
CREATE UNIQUE INDEX "application_decisions_request_uidx" ON "application_decisions" ("application_type", "application_id", "request_id") WHERE "request_id" IS NOT NULL;

CREATE TABLE "application_documents" (
  "id" serial PRIMARY KEY NOT NULL,
  "application_type" text NOT NULL,
  "application_id" integer NOT NULL,
  "document_type" text NOT NULL,
  "object_path" text NOT NULL,
  "uploader_user_id" integer NOT NULL,
  "version" integer NOT NULL,
  "uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
  "review_status" text DEFAULT 'PENDING' NOT NULL,
  "reviewed_by_admin_id" integer,
  "reviewed_at" timestamp with time zone,
  "review_reason" text,
  CONSTRAINT "application_documents_type_check" CHECK ("application_type" IN ('restaurant', 'driver')),
  CONSTRAINT "application_documents_review_check" CHECK ("review_status" IN ('PENDING', 'APPROVED', 'REJECTED'))
);
CREATE UNIQUE INDEX "application_documents_version_uidx" ON "application_documents" ("application_type", "application_id", "document_type", "version");
CREATE INDEX "application_documents_application_idx" ON "application_documents" ("application_type", "application_id", "uploaded_at");
CREATE INDEX "application_documents_object_path_idx" ON "application_documents" ("object_path");

CREATE TABLE "notifications" (
  "id" serial PRIMARY KEY NOT NULL,
  "user_id" integer NOT NULL,
  "event_type" text NOT NULL,
  "title" text NOT NULL,
  "body" text NOT NULL,
  "entity_type" text,
  "entity_id" integer,
  "deduplication_key" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "read_at" timestamp with time zone
);
CREATE UNIQUE INDEX "notifications_deduplication_uidx" ON "notifications" ("deduplication_key");
CREATE INDEX "notifications_user_idx" ON "notifications" ("user_id", "created_at");

INSERT INTO "application_documents" ("application_type", "application_id", "document_type", "object_path", "uploader_user_id", "version", "uploaded_at")
SELECT 'restaurant', id, 'logo', logo_url, owner_user_id, 1, created_at FROM restaurants WHERE logo_url IS NOT NULL
UNION ALL
SELECT 'restaurant', id, 'cover', cover_url, owner_user_id, 1, created_at FROM restaurants WHERE cover_url IS NOT NULL
UNION ALL
SELECT 'driver', id, 'national_id_front', national_id_front_url, user_id, 1, created_at FROM driver_profiles WHERE national_id_front_url IS NOT NULL
UNION ALL
SELECT 'driver', id, 'national_id_back', national_id_back_url, user_id, 1, created_at FROM driver_profiles WHERE national_id_back_url IS NOT NULL
UNION ALL
SELECT 'driver', id, 'criminal_record', criminal_record_url, user_id, 1, created_at FROM driver_profiles WHERE criminal_record_url IS NOT NULL
UNION ALL
SELECT 'driver', id, 'license', license_url, user_id, 1, created_at FROM driver_profiles WHERE license_url IS NOT NULL;