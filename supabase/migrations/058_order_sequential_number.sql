-- 058: Sequential order numbers (prevents collision)
-- Changes CO-YYMMDD-XXXXXX from random to per-user sequential
-- No auth.uid() check — called by service client (public orders, WA bot)

-- Counter table
CREATE TABLE IF NOT EXISTS order_counters (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, year)
);

-- RLS (not strictly needed since function is SECURITY DEFINER, but good practice)
ALTER TABLE order_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own order counters" ON order_counters
  FOR ALL USING (auth.uid() = user_id);

-- Sequential order number generator
-- No auth.uid() check because public orders and WA bot use service client
CREATE OR REPLACE FUNCTION generate_order_number(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date TEXT;
  v_next INT;
  v_year INT;
BEGIN
  v_year := EXTRACT(YEAR FROM now() AT TIME ZONE 'Asia/Jakarta');
  v_date := TO_CHAR(now() AT TIME ZONE 'Asia/Jakarta', 'YYMMDD');

  INSERT INTO order_counters (user_id, year, last_number)
  VALUES (p_user_id, v_year, 1)
  ON CONFLICT (user_id, year)
  DO UPDATE SET last_number = order_counters.last_number + 1
  RETURNING last_number INTO v_next;

  RETURN 'CO-' || v_date || '-' || LPAD(v_next::TEXT, 6, '0');
END;
$$;

-- Seed counters from existing orders so new numbers don't collide
INSERT INTO order_counters (user_id, year, last_number)
SELECT
  user_id,
  EXTRACT(YEAR FROM now() AT TIME ZONE 'Asia/Jakarta')::INTEGER,
  COUNT(*)
FROM orders
WHERE deleted_at IS NULL
GROUP BY user_id
ON CONFLICT (user_id, year) DO UPDATE
SET last_number = GREATEST(order_counters.last_number, EXCLUDED.last_number);

-- Add unique constraint (no existing duplicates — verified)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_unique_number
  ON orders (user_id, order_number);
