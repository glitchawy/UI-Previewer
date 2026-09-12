CREATE OR REPLACE FUNCTION reject_approved_refund_delete()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status = 'approved' THEN
    RAISE EXCEPTION 'approved refund decision is immutable';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS refund_requests_reject_approved_delete ON refund_requests;
CREATE TRIGGER refund_requests_reject_approved_delete
BEFORE DELETE ON refund_requests
FOR EACH ROW
EXECUTE FUNCTION reject_approved_refund_delete();