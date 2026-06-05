-- Migration 087 — order_payments table for in-flow customer payments.
--
-- Architecture: ADR 0001 (docs/decisions/0001-merchant-payments.md).
-- Separate table (not columns on orders) so we can model the full state
-- machine: pending / paid / failed / refunded / expired. Supports retries,
-- partial flows, and audit trail without bloating the orders row.
--
-- One order may have multiple order_payments rows (e.g. customer abandons
-- first checkout, retries from success page). The most recent paid row is
-- the merchant's source of truth; earlier failed/expired rows stay for audit.

CREATE TABLE IF NOT EXISTS order_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  amount NUMERIC(12, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'expired')),
  provider TEXT NOT NULL CHECK (provider IN ('billplz', 'duitnow_manual', 'cash')),

  -- Billplz-specific. Null for non-billplz providers.
  billplz_bill_id TEXT,
  billplz_url TEXT,

  -- Channel reported by Billplz callback (fpx / card / duitnow / grabpay / tng).
  payment_method TEXT,

  -- Surfaced to the merchant for trust. We never collect or store full PII;
  -- this is whatever the customer typed at the order form / Billplz checkout.
  payer_name TEXT,
  payer_email TEXT,
  payer_phone TEXT,

  -- Billplz fee deducted on settlement, surfaced as a transparent line on the
  -- order detail. NULL until the bill clears.
  fee_amount NUMERIC(12, 2),

  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,

  -- Webhook payload kept verbatim for audit + future reconciliation.
  metadata JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_payments_order ON order_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_billplz_bill
  ON order_payments(billplz_bill_id) WHERE billplz_bill_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_payments_user_status
  ON order_payments(user_id, status);

-- Auto-update updated_at on row change.
CREATE OR REPLACE FUNCTION set_order_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_order_payments_updated_at ON order_payments;
CREATE TRIGGER trg_order_payments_updated_at
  BEFORE UPDATE ON order_payments
  FOR EACH ROW EXECUTE FUNCTION set_order_payments_updated_at();

-- RLS — merchant can read only their own payments. The webhook handler
-- writes via the service role and is the only writer.
ALTER TABLE order_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "merchant reads own payments" ON order_payments;
CREATE POLICY "merchant reads own payments" ON order_payments
  FOR SELECT USING (user_id = auth.uid());

-- Atomic mark-paid RPC. Idempotent: same billplz_bill_id arriving twice
-- (Billplz retries webhooks until 200) results in a single paid update,
-- not double-credit on orders.paid_amount.
--
-- Returns the order_payments row so the caller can act on it (broadcast,
-- trigger MyInvois, etc.).
CREATE OR REPLACE FUNCTION mark_order_payment_paid(
  p_billplz_bill_id TEXT,
  p_paid_amount NUMERIC,
  p_payment_method TEXT,
  p_paid_at TIMESTAMPTZ,
  p_metadata JSONB
) RETURNS order_payments
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment order_payments;
  v_was_already_paid BOOLEAN;
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

  -- Update the payment row regardless (refresh metadata) but only credit
  -- orders.paid_amount on the FIRST transition to paid.
  UPDATE order_payments
  SET status = 'paid',
      paid_at = p_paid_at,
      payment_method = p_payment_method,
      metadata = COALESCE(p_metadata, metadata)
  WHERE id = v_payment.id
  RETURNING * INTO v_payment;

  IF NOT v_was_already_paid THEN
    UPDATE orders
    SET paid_amount = COALESCE(paid_amount, 0) + p_paid_amount,
        payment_claimed_at = NULL  -- clear pending claim if any
    WHERE id = v_payment.order_id;
  END IF;

  RETURN v_payment;
END;
$$;

-- Companion: mark failed/expired without touching orders.paid_amount.
CREATE OR REPLACE FUNCTION mark_order_payment_failed(
  p_billplz_bill_id TEXT,
  p_status TEXT,
  p_metadata JSONB
) RETURNS order_payments
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment order_payments;
BEGIN
  IF p_status NOT IN ('failed', 'expired') THEN
    RAISE EXCEPTION 'mark_order_payment_failed only accepts failed or expired, got %', p_status;
  END IF;

  UPDATE order_payments
  SET status = p_status,
      metadata = COALESCE(p_metadata, metadata)
  WHERE billplz_bill_id = p_billplz_bill_id
    AND status = 'pending'
  RETURNING * INTO v_payment;

  RETURN v_payment;
END;
$$;

COMMENT ON FUNCTION mark_order_payment_paid IS
  'Atomic, idempotent webhook handler. First call transitions to paid AND credits orders.paid_amount. Subsequent calls (Billplz retries) only refresh metadata.';
COMMENT ON FUNCTION mark_order_payment_failed IS
  'Mark pending order_payment as failed/expired. No effect on orders.paid_amount.';
