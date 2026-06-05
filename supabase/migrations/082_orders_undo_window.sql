-- Migration 082 — 7-day undo window + audit on orders
--
-- Adds soft-undo semantic distinct from hard delete (deleted_at):
--   undone_at            = timestamp the merchant pressed "Batalkan"
--   undo_window_ends_at  = soft cutoff; past it, force=true is required
--   undo_reason          = free-text reason captured at undo time
--
-- Window default = created_at + 7 days. Existing rows are backfilled.
-- New rows pick up the window via a BEFORE INSERT trigger.
--
-- Why window-then-force vs hard delete only:
--   1. Mistakes happen — anti-anxiety pillar (positioning bible 02 §1.10)
--   2. Audit trail — when a paid order is undone, we want a record of WHY
--   3. Force escape hatch — past 7 days, merchant still has to clean up

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS undone_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS undo_window_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS undo_reason TEXT;

-- Backfill: every existing order gets a window relative to its created_at.
-- Past orders' windows will already be expired — that's correct.
UPDATE orders
SET undo_window_ends_at = created_at + INTERVAL '7 days'
WHERE undo_window_ends_at IS NULL;

CREATE OR REPLACE FUNCTION set_orders_undo_window()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.undo_window_ends_at IS NULL THEN
    NEW.undo_window_ends_at := COALESCE(NEW.created_at, NOW()) + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_orders_undo_window_trigger ON orders;
CREATE TRIGGER set_orders_undo_window_trigger
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION set_orders_undo_window();

-- Index for "show me undone orders" admin / audit queries. Partial so the
-- index stays small — most orders are NOT undone.
CREATE INDEX IF NOT EXISTS idx_orders_undone_at
  ON orders(user_id, undone_at DESC)
  WHERE undone_at IS NOT NULL;

-- Companion to decrement_product_stock (migration 055): restores stock when
-- an order is undone. Returns TRUE if the product is tracked + restored, or
-- if the product isn't tracked (no-op success). Returns FALSE only on lookup
-- failures so the caller can log without aborting the undo.
CREATE OR REPLACE FUNCTION restore_product_stock(
  p_user_id UUID,
  p_product_name TEXT,
  p_qty INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_product_id UUID;
BEGIN
  SELECT id INTO v_product_id
  FROM products
  WHERE user_id = p_user_id
    AND name = p_product_name
    AND deleted_at IS NULL
    AND stock IS NOT NULL
  FOR UPDATE;

  IF v_product_id IS NULL THEN
    RETURN TRUE; -- product missing or untracked → soft success
  END IF;

  UPDATE products
  SET stock = COALESCE(stock, 0) + p_qty,
      is_available = TRUE
  WHERE id = v_product_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
