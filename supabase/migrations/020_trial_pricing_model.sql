-- =============================================================
-- 020: Trial Pricing Model
-- Converts from "masa awal" (free forever) to 14-day free trial.
-- New users: plan='trial', plan_expiry=NOW()+14d, unlimited.
-- Expired trial/paid: read-only (can view, can't create).
-- =============================================================

-- 1. Update handle_new_user() — new signups get trial plan
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan, plan_expiry, orders_limit, receipts_limit)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    'trial',
    NOW() + INTERVAL '14 days',
    -1,
    -1
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Replace check_order_limit — blocks expired trial AND expired paid
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

  -- Block if plan_expiry is set and in the past (covers both expired trial and expired paid)
  IF v_expiry IS NOT NULL AND v_expiry < NOW() THEN
    RETURN FALSE;
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

-- 3. Replace check_receipt_limit — same expiry logic
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

  -- Block if plan_expiry is set and in the past
  IF v_expiry IS NOT NULL AND v_expiry < NOW() THEN
    RETURN FALSE;
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

-- 4. Grant permissions
GRANT EXECUTE ON FUNCTION check_order_limit(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_receipt_limit(UUID) TO anon, authenticated;

-- 5. Migrate existing gratis users to trial with 14-day window
UPDATE profiles
SET plan = 'trial',
    plan_expiry = NOW() + INTERVAL '14 days',
    orders_limit = -1,
    receipts_limit = -1
WHERE plan = 'gratis';
