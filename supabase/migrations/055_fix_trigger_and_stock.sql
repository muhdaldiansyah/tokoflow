-- ============================================================
-- 055: Fix customer stats trigger + atomic stock decrement
-- H1: Trigger now excludes soft-deleted orders (deleted_at IS NULL)
-- H3: Atomic stock decrement RPC for public orders
-- ============================================================

-- H1: Fix trigger to exclude soft-deleted orders
CREATE OR REPLACE FUNCTION recalculate_customer_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_customer_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_customer_id := OLD.customer_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.customer_id IS DISTINCT FROM NEW.customer_id AND OLD.customer_id IS NOT NULL THEN
      UPDATE customers SET
        total_orders = COALESCE((
          SELECT COUNT(*) FROM orders WHERE customer_id = OLD.customer_id AND status != 'cancelled' AND deleted_at IS NULL
        ), 0),
        total_spent = COALESCE((
          SELECT SUM(paid_amount) FROM orders WHERE customer_id = OLD.customer_id AND status != 'cancelled' AND deleted_at IS NULL
        ), 0),
        last_order_at = (
          SELECT MAX(created_at) FROM orders WHERE customer_id = OLD.customer_id AND status != 'cancelled' AND deleted_at IS NULL
        )
      WHERE id = OLD.customer_id;
    END IF;
    target_customer_id := NEW.customer_id;
  ELSE
    target_customer_id := NEW.customer_id;
  END IF;

  IF target_customer_id IS NOT NULL THEN
    UPDATE customers SET
      total_orders = COALESCE((
        SELECT COUNT(*) FROM orders WHERE customer_id = target_customer_id AND status != 'cancelled' AND deleted_at IS NULL
      ), 0),
      total_spent = COALESCE((
        SELECT SUM(paid_amount) FROM orders WHERE customer_id = target_customer_id AND status != 'cancelled' AND deleted_at IS NULL
      ), 0),
      last_order_at = (
        SELECT MAX(created_at) FROM orders WHERE customer_id = target_customer_id AND status != 'cancelled' AND deleted_at IS NULL
      )
    WHERE id = target_customer_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- H2: Decrement orders_used RPC (for order deletion)
CREATE OR REPLACE FUNCTION decrement_orders_used(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET orders_used = GREATEST(0, COALESCE(orders_used, 0) - 1)
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- H3: Atomic stock decrement — check and decrement in one transaction
CREATE OR REPLACE FUNCTION decrement_product_stock(
  p_user_id UUID,
  p_product_name TEXT,
  p_qty INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_product_id UUID;
  v_current_stock INTEGER;
BEGIN
  -- Lock the row and check stock
  SELECT id, stock INTO v_product_id, v_current_stock
  FROM products
  WHERE user_id = p_user_id
    AND name = p_product_name
    AND deleted_at IS NULL
    AND stock IS NOT NULL
  FOR UPDATE;

  IF v_product_id IS NULL THEN
    RETURN TRUE; -- No tracked inventory, allow
  END IF;

  IF v_current_stock < p_qty THEN
    RETURN FALSE; -- Not enough stock
  END IF;

  UPDATE products
  SET stock = stock - p_qty,
      is_available = CASE WHEN stock - p_qty <= 0 THEN FALSE ELSE is_available END
  WHERE id = v_product_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
