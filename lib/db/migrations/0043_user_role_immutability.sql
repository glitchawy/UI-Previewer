CREATE OR REPLACE FUNCTION reject_user_role_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'users.role is immutable';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS users_role_immutable ON users;
--> statement-breakpoint
CREATE TRIGGER users_role_immutable
BEFORE UPDATE OF role ON users
FOR EACH ROW
EXECUTE FUNCTION reject_user_role_mutation();