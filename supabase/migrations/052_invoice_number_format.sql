-- 052: Update invoice number format to match order number pattern
-- Old: INV-2026-0001
-- New: INV-260318-000001

CREATE OR REPLACE FUNCTION generate_invoice_number(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_date TEXT;
  v_next INT;
  v_year INT;
BEGIN
  -- Only allow generating for own user
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  v_year := EXTRACT(YEAR FROM now() AT TIME ZONE 'Asia/Jakarta');
  v_date := TO_CHAR(now() AT TIME ZONE 'Asia/Jakarta', 'YYMMDD');

  INSERT INTO invoice_counters (user_id, year, last_number)
  VALUES (p_user_id, v_year, 1)
  ON CONFLICT (user_id, year)
  DO UPDATE SET last_number = invoice_counters.last_number + 1
  RETURNING last_number INTO v_next;

  RETURN 'INV-' || v_date || '-' || LPAD(v_next::TEXT, 6, '0');
END;
$$;
