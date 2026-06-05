-- Migration 109 — awaiting_payment gate for QR (DuitNow) store-link orders
--
-- Problem: a store-link order placed via DuitNow QR is created immediately and
-- shows up in the merchant's active list (and emails them) before the customer
-- has actually paid. Merchants chase ghost orders that never get paid.
--
-- Solution: mark QR orders awaiting_payment = true at creation. They are hidden
-- from every active merchant view until the customer uploads a payment receipt,
-- at which point upload-proof flips the flag to false (order appears + merchant
-- is notified) and the merchant verifies the receipt. A "Menunggu bayar" tab
-- still surfaces these orders so reserved stock is never invisibly stuck.
--
-- Non-QR orders (preorder pay-later, Billplz/FPX, langganan) are unaffected:
-- they default to awaiting_payment = false. Existing rows backfill to false via
-- the column default.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS awaiting_payment boolean NOT NULL DEFAULT false;

-- Partial index: only the small set of pending-payment orders is indexed, so the
-- "Menunggu bayar" tab query (user_id + newest first) stays cheap without bloating
-- the index for the overwhelming majority of rows where awaiting_payment = false.
CREATE INDEX IF NOT EXISTS idx_orders_awaiting_payment
  ON public.orders (user_id, created_at DESC)
  WHERE awaiting_payment = true;

COMMENT ON COLUMN public.orders.awaiting_payment IS
  'TRUE for store-link QR orders whose payment receipt has not been uploaded yet. '
  'Hidden from active merchant views until upload-proof flips it to false. '
  'Non-QR orders are always false.';
