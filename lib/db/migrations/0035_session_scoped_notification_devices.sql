ALTER TABLE notification_device_tokens
  ADD COLUMN session_id integer REFERENCES auth_sessions(id) ON DELETE CASCADE;
--> statement-breakpoint
DELETE FROM notification_device_tokens WHERE session_id IS NULL;
--> statement-breakpoint
ALTER TABLE notification_device_tokens ALTER COLUMN session_id SET NOT NULL;
--> statement-breakpoint
CREATE INDEX notification_device_tokens_session_active_idx
  ON notification_device_tokens(session_id, revoked_at);