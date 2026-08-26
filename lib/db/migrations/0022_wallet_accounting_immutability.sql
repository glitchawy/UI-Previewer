CREATE OR REPLACE FUNCTION reject_wallet_transaction_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'wallet_transactions is append-only';
END;
$$;

CREATE TRIGGER wallet_transactions_reject_update
BEFORE UPDATE ON wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION reject_wallet_transaction_mutation();

CREATE TRIGGER wallet_transactions_reject_delete
BEFORE DELETE ON wallet_transactions
FOR EACH ROW
EXECUTE FUNCTION reject_wallet_transaction_mutation();

CREATE OR REPLACE FUNCTION reject_order_payment_allocation_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.wallet_amount_used IS DISTINCT FROM OLD.wallet_amount_used
     OR NEW.external_amount_due IS DISTINCT FROM OLD.external_amount_due THEN
    RAISE EXCEPTION 'order payment allocation is immutable after insert';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER orders_reject_payment_allocation_update
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION reject_order_payment_allocation_mutation();