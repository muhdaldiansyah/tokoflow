-- 050: e-Faktur XML export fields + quota tracking

-- Add e-Faktur fields to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS trx_code TEXT DEFAULT '04' CHECK (trx_code IN ('01','02','03','04','05','06','07','08','09','10'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS efaktur_exported_at TIMESTAMPTZ;

-- Add e-Faktur quota tracking to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS efaktur_exports_used INT NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS efaktur_counter_reset_at TIMESTAMPTZ;

-- RPC: Check and increment e-Faktur export quota
-- 50 free/month, then Rp1K/faktur (paid via existing billing)
CREATE OR REPLACE FUNCTION check_efaktur_quota(p_user_id UUID, p_count INT DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_used INT;
  v_reset_at TIMESTAMPTZ;
  v_now TIMESTAMPTZ;
  v_month_start TIMESTAMPTZ;
BEGIN
  -- Auth check
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN FALSE;
  END IF;

  v_now := now();
  v_month_start := date_trunc('month', v_now AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta';

  SELECT efaktur_exports_used, efaktur_counter_reset_at
  INTO v_used, v_reset_at
  FROM profiles WHERE id = p_user_id;

  -- Monthly reset
  IF v_reset_at IS NULL OR v_reset_at < v_month_start THEN
    UPDATE profiles
    SET efaktur_exports_used = 0, efaktur_counter_reset_at = v_now
    WHERE id = p_user_id;
    v_used := 0;
  END IF;

  RETURN TRUE; -- Always allow, quota check is for billing display
END;
$$;

-- RPC: Increment e-Faktur export count
CREATE OR REPLACE FUNCTION increment_efaktur_exports(p_user_id UUID, p_count INT DEFAULT 1)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_count INT;
  v_month_start TIMESTAMPTZ;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  v_month_start := date_trunc('month', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta';

  -- Reset if new month
  UPDATE profiles
  SET efaktur_exports_used = 0, efaktur_counter_reset_at = now()
  WHERE id = p_user_id
    AND (efaktur_counter_reset_at IS NULL OR efaktur_counter_reset_at < v_month_start);

  -- Increment
  UPDATE profiles
  SET efaktur_exports_used = efaktur_exports_used + p_count
  WHERE id = p_user_id
  RETURNING efaktur_exports_used INTO v_new_count;

  RETURN v_new_count;
END;
$$;
