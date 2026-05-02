-- Migration 084 — deprecate unique_code / transfer_amount mechanism
--
-- The IDR-style unique_code (1-999 added to total for transfer matching) was
-- forked from CatatOrder Indonesia. In MYR economics it's actively broken:
--   IDR Rp 50,000 + 446 = 0.9% noise
--   MYR RM 125 + 446 = 357% surcharge ← what merchants saw
--
-- Tokoflow uses Billplz refs + the reconciliation engine (migration 083)
-- for payment matching, so unique_code is dead weight. Code paths that
-- generated it have been removed (this migration cleans the live rows
-- that already had codes assigned).
--
-- We DO NOT drop the columns — legacy paid orders from before this
-- migration may have valid `transfer_amount` values that downstream
-- reports reference. Setting unique_code to NULL on unpaid rows alone
-- makes the new display logic show RM total cleanly.

-- Clear stale unique_code from all unpaid orders so the dashboard shows
-- correct prices immediately.
UPDATE orders
SET unique_code = NULL
WHERE unique_code IS NOT NULL
  AND payment_status != 'paid'
  AND deleted_at IS NULL;

-- The partial transfer_amount index is no longer hot — searches are now
-- by total. Drop the index but keep the generated column.
DROP INDEX IF EXISTS idx_orders_transfer_amount;

COMMENT ON COLUMN orders.unique_code IS
  'DEPRECATED 2026-05-02. IDR-style transfer matching, broken in MYR. New orders leave NULL. Existing rows preserved for legacy report compat.';
COMMENT ON COLUMN orders.transfer_amount IS
  'DEPRECATED 2026-05-02. = total + COALESCE(unique_code, 0). With unique_code now always NULL, equals total.';
