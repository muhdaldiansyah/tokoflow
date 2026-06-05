-- Migration 108 — DB-level payment_status invariant
--
-- Problem: payment_status is derived in 4+ separate application code paths.
-- Any new write path that forgets to call derivePaymentStatus() leaves the
-- column stale (migration 107 fixed the Billplz webhook gap; this migration
-- prevents ALL future gaps at the database layer).
--
-- Solution: BEFORE INSERT OR UPDATE trigger that derives payment_status
-- whenever paid_amount or total actually changes. Direct payment_status sets
-- (the AI-parse path in PATCH /api/orders/[id]) are preserved when neither
-- paid_amount nor total is being touched — the trigger only fires when those
-- columns change.
--
-- Idempotency: the trigger result always matches the TS derivePaymentStatus()
-- function, so existing application-level derivations are now just defense-
-- in-depth rather than the sole source of truth.

CREATE OR REPLACE FUNCTION public.derive_order_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- INSERT: always derive (paid_amount comes in as 0, total > 0 → "unpaid").
  -- UPDATE: only derive when paid_amount or total actually changed, so that
  --   a direct `SET payment_status = 'paid'` (e.g. AI-parsed order) where
  --   paid_amount is NOT being changed is left untouched by this trigger.
  IF TG_OP = 'INSERT'
     OR (NEW.paid_amount IS DISTINCT FROM OLD.paid_amount)
     OR (NEW.total      IS DISTINCT FROM OLD.total)
  THEN
    NEW.payment_status := CASE
      WHEN COALESCE(NEW.total, 0) = 0                              THEN 'paid'
      WHEN COALESCE(NEW.paid_amount, 0) >= COALESCE(NEW.total, 0)  THEN 'paid'
      WHEN COALESCE(NEW.paid_amount, 0)  > 0                       THEN 'partial'
      ELSE 'unpaid'
    END;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_derive_payment_status ON public.orders;
CREATE TRIGGER trg_derive_payment_status
  BEFORE INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.derive_order_payment_status();

COMMENT ON FUNCTION public.derive_order_payment_status() IS
  'Keeps orders.payment_status in sync with paid_amount/total on every insert or '
  'change to those columns. Mirrors TS derivePaymentStatus(). Direct payment_status '
  'sets without touching paid_amount are preserved (AI-parse path).';
