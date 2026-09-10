CREATE TABLE "auth_sessions" (
  "id" serial PRIMARY KEY,
  "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL,
  "absolute_expires_at" timestamptz NOT NULL,
  "idle_expires_at" timestamptz NOT NULL,
  "last_used_at" timestamptz DEFAULT now() NOT NULL,
  "revoked_at" timestamptz,
  "revocation_reason" text,
  "replaced_by_session_id" integer,
  "replacement_of_session_id" integer,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  CONSTRAINT "auth_sessions_token_hash_format_check" CHECK ("token_hash" ~ '^[0-9a-f]{64}$'),
  CONSTRAINT "auth_sessions_absolute_expiry_check" CHECK ("absolute_expires_at" > "created_at"),
  CONSTRAINT "auth_sessions_idle_expiry_check" CHECK ("idle_expires_at" <= "absolute_expires_at")
);
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_replaced_by_fk"
  FOREIGN KEY ("replaced_by_session_id") REFERENCES "auth_sessions"("id") ON DELETE SET NULL;
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_replacement_of_fk"
  FOREIGN KEY ("replacement_of_session_id") REFERENCES "auth_sessions"("id") ON DELETE SET NULL;
CREATE UNIQUE INDEX "auth_sessions_token_hash_uidx" ON "auth_sessions" ("token_hash");
CREATE INDEX "auth_sessions_user_active_idx" ON "auth_sessions" ("user_id", "revoked_at");
CREATE INDEX "auth_sessions_expiry_idx" ON "auth_sessions" ("absolute_expires_at", "idle_expires_at");