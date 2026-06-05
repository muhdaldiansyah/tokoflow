-- 099: Performance-oriented indexes + server-side product sales aggregation
--
-- These indexes mirror the hottest dashboard reads:
-- - active orders list: user + non-deleted + not done/cancelled + newest first
-- - status-filtered orders list: user + status + newest first
-- - prep/delivery summaries: user + delivery_date + active rows
-- - product/customer/invoice list ordering

CREATE INDEX IF NOT EXISTS idx_orders_active_user_created_at
  ON orders (user_id, created_at DESC)
  WHERE deleted_at IS NULL
    AND status NOT IN ('done', 'cancelled');

CREATE INDEX IF NOT EXISTS idx_orders_user_status_created_at
  ON orders (user_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_delivery_active
  ON orders (user_id, delivery_date, created_at DESC)
  WHERE deleted_at IS NULL
    AND delivery_date IS NOT NULL
    AND status <> 'cancelled';

CREATE INDEX IF NOT EXISTS idx_products_user_sort_not_deleted
  ON products (user_id, sort_order, created_at)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_customers_user_last_order
  ON customers (user_id, last_order_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_invoices_user_created_at
  ON invoices (user_id, created_at DESC);

-- Products page needs "qty sold by product", but the previous API pulled
-- every historical order's JSON items into the route handler and aggregated
-- in Node. Keep the same response shape while letting Postgres aggregate and
-- return only the small result set.
CREATE OR REPLACE FUNCTION get_product_sales(p_user_id UUID)
RETURNS TABLE(name TEXT, qty BIGINT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    lower(trim(item.value->>'name')) AS name,
    sum(
      CASE
        WHEN item.value->>'qty' ~ '^[0-9]+(\.[0-9]+)?$'
          THEN (item.value->>'qty')::numeric
        ELSE 0
      END
    )::BIGINT AS qty
  FROM orders
  CROSS JOIN LATERAL jsonb_array_elements(COALESCE(orders.items, '[]'::jsonb)) AS item(value)
  WHERE orders.user_id = p_user_id
    AND auth.uid() = p_user_id
    AND orders.deleted_at IS NULL
    AND orders.status <> 'cancelled'
    AND item.value ? 'name'
    AND trim(item.value->>'name') <> ''
  GROUP BY lower(trim(item.value->>'name'));
$$;

GRANT EXECUTE ON FUNCTION get_product_sales(UUID) TO authenticated;
