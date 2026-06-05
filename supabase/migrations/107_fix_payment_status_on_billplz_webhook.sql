-- Migration 107 — Fix stale orders.payment_status after Billplz webhook
--
-- Bug: mark_order_payment_paid updated orders.paid_amount but never wrote
-- orders.payment_status. After a Billplz payment webhook fired, the order
-- card in the dashboard still showed "Unpaid" because OrderCard reads the
-- payment_status column directly (not re-derived from paid_amount).
--
-- Fix: derive and write payment_status atomically in the same UPDATE that
-- credits paid_amount, using the same logic as derivePaymentStatus() in TS.

CREATE OR REPLACE FUNCTION public.mark_order_payment_paid(
  p_billplz_bill_id TEXT,
  p_paid_amount NUMERIC,
  p_payment_method TEXT,
  p_paid_at TIMESTAMPTZ,
  p_metadata JSONB
) RETURNS order_payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment order_payments;
  v_was_already_paid BOOLEAN;
  v_order orders%ROWTYPE;
  v_new_paid_amount NUMERIC;
BEGIN
  -- Lock the row so concurrent webhook deliveries serialize.
  SELECT * INTO v_payment
  FROM order_payments
  WHERE billplz_bill_id = p_billplz_bill_id
  FOR UPDATE;

  IF v_payment.id IS NULL THEN
    RAISE EXCEPTION 'order_payment not found for bill %', p_billplz_bill_id;
  END IF;

  v_was_already_paid := v_payment.status = 'paid';

  UPDATE order_payments
  SET status = 'paid',
      paid_at = p_paid_at,
      payment_method = p_payment_method,
      metadata = COALESCE(p_metadata, metadata)
  WHERE id = v_payment.id
  RETURNING * INTO v_payment;

  IF NOT v_was_already_paid THEN
    -- Compute new paid_amount so we can derive payment_status in the same UPDATE.
    SELECT COALESCE(paid_amount, 0) + p_paid_amount INTO v_new_paid_amount
    FROM orders WHERE id = v_payment.order_id;

    UPDATE orders
    SET paid_amount       = v_new_paid_amount,
        payment_claimed_at = NULL,
        payment_status    = CASE
          WHEN v_new_paid_amount >= total THEN 'paid'
          WHEN v_new_paid_amount  > 0     THEN 'partial'
          ELSE 'unpaid'
        END
    WHERE id = v_payment.order_id
    RETURNING * INTO v_order;

    IF COALESCE(p_paid_amount, 0) <> 0 THEN
      INSERT INTO financial_ledger_entries(
        user_id,
        customer_id,
        order_id,
        payment_id,
        entry_type,
        amount_delta,
        cash_delta,
        gross_amount,
        net_amount,
        provider,
        payment_method,
        external_reference,
        reason,
        actor_type,
        source_table,
        source_id,
        idempotency_key,
        metadata,
        occurred_at
      )
      VALUES (
        v_payment.user_id,
        v_order.customer_id,
        v_payment.order_id,
        v_payment.id,
        'payment_received',
        p_paid_amount,
        p_paid_amount,
        p_paid_amount,
        p_paid_amount,
        v_payment.provider,
        p_payment_method,
        p_billplz_bill_id,
        'billplz_webhook_paid',
        'billplz',
        'order_payments',
        v_payment.id,
        'order_payment_paid:' || v_payment.id::text,
        COALESCE(p_metadata, '{}'::jsonb),
        COALESCE(p_paid_at, NOW())
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN v_payment;
END;
$$;

-- Permissions unchanged — service_role only (same as migration 106).
REVOKE EXECUTE ON FUNCTION public.mark_order_payment_paid(TEXT, NUMERIC, TEXT, TIMESTAMPTZ, JSONB) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.mark_order_payment_paid(TEXT, NUMERIC, TEXT, TIMESTAMPTZ, JSONB) TO service_role;

-- Back-fill: fix any existing orders where paid_amount reflects a real
-- payment but payment_status was left stale as 'unpaid' or 'partial'.
-- Zero-total orders are always 'paid' (100% discount). All others derive.
UPDATE orders
SET payment_status = CASE
  WHEN total = 0                        THEN 'paid'
  WHEN COALESCE(paid_amount, 0) >= total THEN 'paid'
  WHEN COALESCE(paid_amount, 0)  > 0    THEN 'partial'
  ELSE 'unpaid'
END
WHERE payment_status IS DISTINCT FROM CASE
  WHEN total = 0                        THEN 'paid'
  WHEN COALESCE(paid_amount, 0) >= total THEN 'paid'
  WHEN COALESCE(paid_amount, 0)  > 0    THEN 'partial'
  ELSE 'unpaid'
END;
