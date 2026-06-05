-- 057: Sequential receipt numbers (prevents collision)
-- Pattern matches invoice: WS-YYMMDD-000001

-- Counter table (same pattern as invoice_counters)
CREATE TABLE IF NOT EXISTS receipt_counters (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  last_number INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, year)
);

-- RLS
ALTER TABLE receipt_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own receipt counters" ON receipt_counters
  FOR ALL USING (auth.uid() = user_id);

-- Sequential receipt number generator (atomic — no collision possible)
CREATE OR REPLACE FUNCTION generate_receipt_number(p_user_id UUID)
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

  INSERT INTO receipt_counters (user_id, year, last_number)
  VALUES (p_user_id, v_year, 1)
  ON CONFLICT (user_id, year)
  DO UPDATE SET last_number = receipt_counters.last_number + 1
  RETURNING last_number INTO v_next;

  RETURN 'WS-' || v_date || '-' || LPAD(v_next::TEXT, 6, '0');
END;
$$;

-- Add unique constraint to prevent any remaining collision
-- (user_id scoped so different users can have same receipt numbers)
CREATE UNIQUE INDEX IF NOT EXISTS idx_receipts_unique_number
  ON receipts (user_id, receipt_number);
