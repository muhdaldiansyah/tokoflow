-- 051: Remove bisnis tier gate from invoice creation (free for all users)
-- XML export remains gated via application layer

CREATE OR REPLACE FUNCTION generate_invoice_number(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year INT;
  v_next INT;
BEGIN
  -- Only allow generating for own user
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  v_year := EXTRACT(YEAR FROM now() AT TIME ZONE 'Asia/Jakarta');

  INSERT INTO invoice_counters (user_id, year, last_number)
  VALUES (p_user_id, v_year, 1)
  ON CONFLICT (user_id, year)
  DO UPDATE SET last_number = invoice_counters.last_number + 1
  RETURNING last_number INTO v_next;

  RETURN 'INV-' || v_year || '-' || LPAD(v_next::TEXT, 4, '0');
END;
$$;
