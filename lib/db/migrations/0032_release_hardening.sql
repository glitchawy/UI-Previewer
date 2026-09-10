UPDATE users SET session_token = NULL WHERE session_token IS NOT NULL;
--> statement-breakpoint
ALTER TABLE users DROP COLUMN IF EXISTS session_token;
--> statement-breakpoint
ALTER TABLE notification_outbox
  ADD COLUMN IF NOT EXISTS recipient_cursor integer NOT NULL DEFAULT 0;