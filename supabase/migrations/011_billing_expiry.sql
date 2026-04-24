-- =============================================================
-- 011: Billing Expiry & Counter Reset
-- Adds counter_reset_at column, updates check_order_limit and
-- check_receipt_limit RPCs to handle plan expiry and monthly reset
-- =============================================================

-- Add counter_reset_at column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS counter_reset_at TIMESTAMPTZ DEFAULT NOW();

-- Backfill existing rows
UPDATE profiles SET counter_reset_at = NOW() WHERE counter_reset_at IS NULL;

-- Replace check_order_limit with expiry-aware version
CREATE OR REPLACE FUNCTION check_order_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_used INTEGER;
  v_limit INTEGER;
  v_plan VARCHAR(20);
  v_expiry TIMESTAMPTZ;
  v_reset_at TIMESTAMPTZ;
BEGIN
  SELECT orders_used, orders_limit, plan, plan_expiry, counter_reset_at
  INTO v_used, v_limit, v_plan, v_expiry, v_reset_at
  FROM profiles
  WHERE id = p_user_id;

  -- If paid plan expired, downgrade to gratis
  IF v_plan != 'gratis' AND v_expiry IS NOT NULL AND v_expiry < NOW() THEN
    UPDATE profiles SET
      plan = 'gratis',
      plan_expiry = NULL,
      orders_limit = 150,
      receipts_limit = 10
    WHERE id = p_user_id;
    v_limit := 150;
  END IF;

  -- If month changed since last reset, reset counters
  IF v_reset_at IS NULL
     OR to_char(v_reset_at, 'YYYY-MM') != to_char(NOW(), 'YYYY-MM') THEN
    UPDATE profiles SET
      orders_used = 0,
      receipts_used = 0,
      counter_reset_at = NOW()
    WHERE id = p_user_id;
    v_used := 0;
  END IF;

  -- Unlimited
  IF v_limit = -1 THEN
    RETURN TRUE;
  END IF;

  RETURN v_used < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace check_receipt_limit with expiry-aware version
CREATE OR REPLACE FUNCTION check_receipt_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_used INTEGER;
  v_limit INTEGER;
  v_plan VARCHAR(20);
  v_expiry TIMESTAMPTZ;
  v_reset_at TIMESTAMPTZ;
BEGIN
  SELECT receipts_used, receipts_limit, plan, plan_expiry, counter_reset_at
  INTO v_used, v_limit, v_plan, v_expiry, v_reset_at
  FROM profiles
  WHERE id = p_user_id;

  -- If paid plan expired, downgrade to gratis
  IF v_plan != 'gratis' AND v_expiry IS NOT NULL AND v_expiry < NOW() THEN
    UPDATE profiles SET
      plan = 'gratis',
      plan_expiry = NULL,
      orders_limit = 150,
      receipts_limit = 10
    WHERE id = p_user_id;
    v_limit := 10;
  END IF;

  -- If month changed since last reset, reset counters
  IF v_reset_at IS NULL
     OR to_char(v_reset_at, 'YYYY-MM') != to_char(NOW(), 'YYYY-MM') THEN
    UPDATE profiles SET
      orders_used = 0,
      receipts_used = 0,
      counter_reset_at = NOW()
    WHERE id = p_user_id;
    v_used := 0;
  END IF;

  -- Unlimited
  IF v_limit = -1 THEN
    RETURN TRUE;
  END IF;

  RETURN v_used < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_order_limit(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_receipt_limit(UUID) TO anon, authenticated;
