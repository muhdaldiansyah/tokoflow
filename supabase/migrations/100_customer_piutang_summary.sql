-- 100: Server-side customer piutang aggregation
--
-- Customers page and piutang surfaces should not pull every candidate order
-- into the route handler just to aggregate by customer. Keep the response
-- shape small by aggregating outstanding balances in Postgres.

CREATE INDEX IF NOT EXISTS idx_orders_user_outstanding_balance
  ON orders (user_id, created_at DESC)
  WHERE deleted_at IS NULL
    AND status <> 'cancelled'
    AND total > 0;

CREATE OR REPLACE FUNCTION get_piutang_summary(p_user_id UUID)
RETURNS TABLE(
  customer_id TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  total_debt NUMERIC,
  order_count BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  WITH outstanding AS (
    SELECT
      COALESCE(o.customer_id::TEXT, o.customer_phone, o.customer_name, 'unknown') AS customer_key,
      COALESCE(o.customer_id::TEXT, '') AS customer_id,
      COALESCE(o.customer_name, o.customer_phone, 'Tanpa nama') AS customer_name,
      COALESCE(o.customer_phone, '') AS customer_phone,
      COALESCE(o.created_at, now()) AS created_at,
      (COALESCE(o.total, 0) - COALESCE(o.paid_amount, 0))::NUMERIC AS remaining
    FROM orders o
    WHERE o.user_id = p_user_id
      AND auth.uid() = p_user_id
      AND o.deleted_at IS NULL
      AND o.status <> 'cancelled'
      AND o.total > 0
  )
  SELECT
    (ARRAY_AGG(x.customer_id ORDER BY x.created_at DESC))[1] AS customer_id,
    (ARRAY_AGG(x.customer_name ORDER BY x.created_at DESC))[1] AS customer_name,
    (ARRAY_AGG(x.customer_phone ORDER BY x.created_at DESC))[1] AS customer_phone,
    SUM(x.remaining) AS total_debt,
    COUNT(*) AS order_count
  FROM outstanding x
  WHERE x.remaining > 0
  GROUP BY x.customer_key
  ORDER BY total_debt DESC;
$$;

GRANT EXECUTE ON FUNCTION get_piutang_summary(UUID) TO authenticated;
