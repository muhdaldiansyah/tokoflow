-- Migration 089 — unify money column types to NUMERIC(14,2).
--
-- The schema inherited INTEGER money columns from CatatOrder (rupiah, where
-- whole-units are fine). MY ringgit needs 2-decimal precision. Migration
-- 077 added MY tax fields as NUMERIC(14,2) and migration 087 introduced
-- order_payments.amount as NUMERIC(12,2), but legacy money columns on
-- orders / products / invoices / receipts stayed INTEGER. Multiplying a
-- NUMERIC(14,2) sst_amount against an INTEGER subtotal silently loses
-- precision and breaks UBL line-total reconciliation when MyInvois rounds.
--
-- This migration normalises every money column to NUMERIC(14,2). The cast
-- is loss-less for existing INTEGER values (RM 100 → RM 100.00). Tokoflow
-- has zero rows in production, so no data risk.
--
-- ppn_rate is included even though it is a percentage (legacy ID 0/11) so
-- it can mirror sst_rate (NUMERIC(4,2)) cleanly during the compat window.

-- ─── orders ──────────────────────────────────────────────────────────────
-- `orders.transfer_amount` is a STORED generated column (072) computed from
-- `total + COALESCE(unique_code, 0)`. The mechanism was deprecated by 084
-- but the column was preserved for legacy report compat. Postgres won't let
-- us re-type a column referenced by a generated column, so we drop and
-- recreate it around the type change. The new generated column inherits the
-- new NUMERIC(14,2) type from `total`, which keeps legacy report queries
-- arithmetic-compatible.
ALTER TABLE orders DROP COLUMN IF EXISTS transfer_amount;

ALTER TABLE orders
  ALTER COLUMN subtotal      TYPE NUMERIC(14, 2) USING subtotal::numeric,
  ALTER COLUMN discount      TYPE NUMERIC(14, 2) USING discount::numeric,
  ALTER COLUMN total         TYPE NUMERIC(14, 2) USING total::numeric,
  ALTER COLUMN paid_amount   TYPE NUMERIC(14, 2) USING paid_amount::numeric;

ALTER TABLE orders ADD COLUMN transfer_amount NUMERIC(14, 2)
  GENERATED ALWAYS AS (total + COALESCE(unique_code, 0)) STORED;

COMMENT ON COLUMN orders.transfer_amount IS
  'DEPRECATED 2026-05-02 (see migration 084). = total + COALESCE(unique_code, 0). Kept as NUMERIC(14,2) post-089 for legacy report compat; new orders leave unique_code NULL so the value equals total.';

-- ─── products ────────────────────────────────────────────────────────────
ALTER TABLE products
  ALTER COLUMN price         TYPE NUMERIC(14, 2) USING price::numeric,
  ALTER COLUMN cost_price    TYPE NUMERIC(14, 2) USING cost_price::numeric;

-- ─── invoices ────────────────────────────────────────────────────────────
ALTER TABLE invoices
  ALTER COLUMN subtotal      TYPE NUMERIC(14, 2) USING subtotal::numeric,
  ALTER COLUMN discount      TYPE NUMERIC(14, 2) USING discount::numeric,
  ALTER COLUMN ppn_rate      TYPE NUMERIC(4, 2)  USING ppn_rate::numeric,
  ALTER COLUMN ppn_amount    TYPE NUMERIC(14, 2) USING ppn_amount::numeric,
  ALTER COLUMN total         TYPE NUMERIC(14, 2) USING total::numeric,
  ALTER COLUMN paid_amount   TYPE NUMERIC(14, 2) USING paid_amount::numeric;

-- ─── receipts ────────────────────────────────────────────────────────────
ALTER TABLE receipts
  ALTER COLUMN subtotal      TYPE NUMERIC(14, 2) USING subtotal::numeric,
  ALTER COLUMN tax           TYPE NUMERIC(14, 2) USING tax::numeric,
  ALTER COLUMN total         TYPE NUMERIC(14, 2) USING total::numeric;
