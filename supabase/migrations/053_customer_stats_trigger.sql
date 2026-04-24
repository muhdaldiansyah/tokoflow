-- ============================================================
-- 053: Auto-sync customer stats via database trigger
-- Recalculates total_orders, total_spent, last_order_at
-- on every orders INSERT, UPDATE, DELETE
-- ============================================================

-- Function to recalculate customer stats
CREATE OR REPLACE FUNCTION recalculate_customer_stats()
RETURNS TRIGGER AS $$
DECLARE
  target_customer_id UUID;
BEGIN
  -- Determine which customer_id to recalculate
  IF TG_OP = 'DELETE' THEN
    target_customer_id := OLD.customer_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If customer_id changed, recalculate both old and new
    IF OLD.customer_id IS DISTINCT FROM NEW.customer_id AND OLD.customer_id IS NOT NULL THEN
      UPDATE customers SET
        total_orders = COALESCE((
          SELECT COUNT(*) FROM orders WHERE customer_id = OLD.customer_id AND status != 'cancelled'
        ), 0),
        total_spent = COALESCE((
          SELECT SUM(paid_amount) FROM orders WHERE customer_id = OLD.customer_id AND status != 'cancelled'
        ), 0),
        last_order_at = (
          SELECT MAX(created_at) FROM orders WHERE customer_id = OLD.customer_id AND status != 'cancelled'
        )
      WHERE id = OLD.customer_id;
    END IF;
    target_customer_id := NEW.customer_id;
  ELSE
    target_customer_id := NEW.customer_id;
  END IF;

  -- Recalculate stats for target customer
  IF target_customer_id IS NOT NULL THEN
    UPDATE customers SET
      total_orders = COALESCE((
        SELECT COUNT(*) FROM orders WHERE customer_id = target_customer_id AND status != 'cancelled'
      ), 0),
      total_spent = COALESCE((
        SELECT SUM(paid_amount) FROM orders WHERE customer_id = target_customer_id AND status != 'cancelled'
      ), 0),
      last_order_at = (
        SELECT MAX(created_at) FROM orders WHERE customer_id = target_customer_id AND status != 'cancelled'
      )
    WHERE id = target_customer_id;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_recalculate_customer_stats ON orders;

-- Create trigger on orders table
CREATE TRIGGER trg_recalculate_customer_stats
  AFTER INSERT OR UPDATE OR DELETE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_customer_stats();

-- ============================================================
-- One-time data cleanup: recalculate ALL customer stats
-- ============================================================
UPDATE customers c SET
  total_orders = COALESCE(stats.order_count, 0),
  total_spent = COALESCE(stats.total_paid, 0),
  last_order_at = stats.last_order
FROM (
  SELECT
    customer_id,
    COUNT(*) AS order_count,
    SUM(paid_amount) AS total_paid,
    MAX(created_at) AS last_order
  FROM orders
  WHERE status != 'cancelled' AND customer_id IS NOT NULL
  GROUP BY customer_id
) stats
WHERE c.id = stats.customer_id;

-- Reset stats for customers with no orders
UPDATE customers SET
  total_orders = 0,
  total_spent = 0,
  last_order_at = NULL
WHERE id NOT IN (
  SELECT DISTINCT customer_id FROM orders WHERE customer_id IS NOT NULL AND status != 'cancelled'
);
