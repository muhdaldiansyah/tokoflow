-- 028: Order Quota Pricing
-- Replace AI credits model with order quota model.
-- 50 free orders/month + buy packs of 50 (Rp15K, never expire).
-- 3rd pack in a month = unlimited rest of month.
-- AI features become free for all users.

-- 1. Add new columns for order quota
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS order_credits INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unlimited_until TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS packs_bought_this_month INTEGER DEFAULT 0;

-- 2. Update handle_new_user — new signups get free plan with 50 orders/month
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan, orders_limit, receipts_limit, ai_credits_limit, ai_credits_used)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    'free',
    -1,
    -1,
    -1,  -- unlimited AI (free for all)
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Rewrite check_order_limit to use new quota model
CREATE OR REPLACE FUNCTION public.check_order_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_used INTEGER;
  v_credits INTEGER;
  v_unlimited TIMESTAMPTZ;
  v_reset_at TIMESTAMPTZ;
  v_packs INTEGER;
BEGIN
  SELECT orders_used, COALESCE(order_credits, 0), unlimited_until, counter_reset_at, COALESCE(packs_bought_this_month, 0)
  INTO v_used, v_credits, v_unlimited, v_reset_at, v_packs
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- Monthly reset: if month changed, reset free counter and packs_bought
  IF v_reset_at IS NULL
     OR to_char(v_reset_at, 'YYYY-MM') != to_char(NOW(), 'YYYY-MM') THEN
    UPDATE profiles SET
      orders_used = 0,
      receipts_used = 0,
      packs_bought_this_month = 0,
      counter_reset_at = NOW()
    WHERE id = p_user_id;
    v_used := 0;
    v_packs := 0;
  END IF;

  -- Unlimited (from 3rd pack reward)
  IF v_unlimited IS NOT NULL AND v_unlimited > NOW() THEN
    RETURN TRUE;
  END IF;

  -- Free quota: 50 orders/month
  IF v_used < 50 THEN
    RETURN TRUE;
  END IF;

  -- Purchased credits
  IF v_credits > 0 THEN
    RETURN TRUE;
  END IF;

  -- No quota left
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Rewrite increment_orders_used to consume quota correctly
CREATE OR REPLACE FUNCTION public.increment_orders_used(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_used INTEGER;
  v_credits INTEGER;
  v_unlimited TIMESTAMPTZ;
  v_reset_at TIMESTAMPTZ;
BEGIN
  SELECT orders_used, COALESCE(order_credits, 0), unlimited_until, counter_reset_at
  INTO v_used, v_credits, v_unlimited, v_reset_at
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN RETURN; END IF;

  -- Monthly reset check
  IF v_reset_at IS NULL
     OR to_char(v_reset_at, 'YYYY-MM') != to_char(NOW(), 'YYYY-MM') THEN
    UPDATE profiles SET
      orders_used = 0,
      receipts_used = 0,
      packs_bought_this_month = 0,
      counter_reset_at = NOW()
    WHERE id = p_user_id;
    v_used := 0;
  END IF;

  -- Unlimited: just increment counter (no cost)
  IF v_unlimited IS NOT NULL AND v_unlimited > NOW() THEN
    UPDATE profiles SET orders_used = orders_used + 1 WHERE id = p_user_id;
    RETURN;
  END IF;

  -- Free quota (first 50)
  IF v_used < 50 THEN
    UPDATE profiles SET orders_used = orders_used + 1 WHERE id = p_user_id;
    RETURN;
  END IF;

  -- Consume purchased credit
  IF v_credits > 0 THEN
    UPDATE profiles SET
      orders_used = orders_used + 1,
      order_credits = order_credits - 1
    WHERE id = p_user_id;
    RETURN;
  END IF;

  -- No quota: still increment (order goes to "menunggu" status)
  UPDATE profiles SET orders_used = orders_used + 1 WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: add order pack (called after payment)
-- Adds 50 credits. If 3rd pack this month, sets unlimited_until = end of month.
-- Also activates any "menunggu" orders.
CREATE OR REPLACE FUNCTION public.add_order_pack(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_packs INTEGER;
  v_unlimited BOOLEAN := FALSE;
  v_reset_at TIMESTAMPTZ;
BEGIN
  -- Reset check first
  SELECT counter_reset_at, COALESCE(packs_bought_this_month, 0)
  INTO v_reset_at, v_packs
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false);
  END IF;

  -- Monthly reset if needed
  IF v_reset_at IS NULL
     OR to_char(v_reset_at, 'YYYY-MM') != to_char(NOW(), 'YYYY-MM') THEN
    UPDATE profiles SET
      orders_used = 0,
      receipts_used = 0,
      packs_bought_this_month = 0,
      counter_reset_at = NOW()
    WHERE id = p_user_id;
    v_packs := 0;
  END IF;

  v_packs := v_packs + 1;

  -- 3rd pack = unlimited rest of month
  IF v_packs >= 3 THEN
    v_unlimited := TRUE;
    UPDATE profiles SET
      order_credits = COALESCE(order_credits, 0) + 50,
      packs_bought_this_month = v_packs,
      unlimited_until = date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second'
    WHERE id = p_user_id;
  ELSE
    UPDATE profiles SET
      order_credits = COALESCE(order_credits, 0) + 50,
      packs_bought_this_month = v_packs
    WHERE id = p_user_id;
  END IF;

  -- Activate all "menunggu" orders for this user
  UPDATE orders SET status = 'new'
  WHERE user_id = p_user_id AND status = 'menunggu';

  RETURN jsonb_build_object(
    'success', true,
    'packs_this_month', v_packs,
    'unlimited', v_unlimited
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Make AI credits unlimited for all existing users
UPDATE profiles SET ai_credits_limit = -1;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION public.add_order_pack(UUID) TO authenticated;
