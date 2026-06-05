-- 104: Make the free order allowance a one-time starter quota.
-- `orders_used` must not reset monthly. Monthly reset still applies to
-- receipts_used and packs_bought_this_month.

CREATE OR REPLACE FUNCTION public.check_order_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_used INTEGER;
  v_credits INTEGER;
  v_unlimited TIMESTAMPTZ;
  v_reset_at TIMESTAMPTZ;
BEGIN
  SELECT COALESCE(orders_used, 0),
         COALESCE(order_credits, 0),
         unlimited_until,
         counter_reset_at
  INTO v_used, v_credits, v_unlimited, v_reset_at
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_reset_at IS NULL
     OR to_char(v_reset_at, 'YYYY-MM') != to_char(NOW(), 'YYYY-MM') THEN
    UPDATE public.profiles
    SET receipts_used = 0,
        packs_bought_this_month = 0,
        counter_reset_at = NOW()
    WHERE id = p_user_id;
  END IF;

  IF v_unlimited IS NOT NULL AND v_unlimited > NOW() THEN
    RETURN TRUE;
  END IF;

  IF v_used < 50 THEN
    RETURN TRUE;
  END IF;

  IF v_credits > 0 THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_orders_used(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_used INTEGER;
  v_credits INTEGER;
  v_unlimited TIMESTAMPTZ;
  v_reset_at TIMESTAMPTZ;
BEGIN
  SELECT COALESCE(orders_used, 0),
         COALESCE(order_credits, 0),
         unlimited_until,
         counter_reset_at
  INTO v_used, v_credits, v_unlimited, v_reset_at
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_reset_at IS NULL
     OR to_char(v_reset_at, 'YYYY-MM') != to_char(NOW(), 'YYYY-MM') THEN
    UPDATE public.profiles
    SET receipts_used = 0,
        packs_bought_this_month = 0,
        counter_reset_at = NOW()
    WHERE id = p_user_id;
  END IF;

  IF v_unlimited IS NOT NULL AND v_unlimited > NOW() THEN
    UPDATE public.profiles
    SET orders_used = COALESCE(orders_used, 0) + 1
    WHERE id = p_user_id;
    RETURN;
  END IF;

  IF v_used < 50 THEN
    UPDATE public.profiles
    SET orders_used = COALESCE(orders_used, 0) + 1
    WHERE id = p_user_id;
    RETURN;
  END IF;

  IF v_credits > 0 THEN
    UPDATE public.profiles
    SET orders_used = COALESCE(orders_used, 0) + 1,
        order_credits = GREATEST(0, COALESCE(order_credits, 0) - 1)
    WHERE id = p_user_id;
    RETURN;
  END IF;

  -- Preserve the existing public-order behavior: over-quota orders can be
  -- created as "menunggu", then activated after upgrade/top-up.
  UPDATE public.profiles
  SET orders_used = COALESCE(orders_used, 0) + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.add_order_pack(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_packs INTEGER;
  v_unlimited BOOLEAN := FALSE;
  v_reset_at TIMESTAMPTZ;
BEGIN
  SELECT counter_reset_at, COALESCE(packs_bought_this_month, 0)
  INTO v_reset_at, v_packs
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false);
  END IF;

  IF v_reset_at IS NULL
     OR to_char(v_reset_at, 'YYYY-MM') != to_char(NOW(), 'YYYY-MM') THEN
    UPDATE public.profiles
    SET receipts_used = 0,
        packs_bought_this_month = 0,
        counter_reset_at = NOW()
    WHERE id = p_user_id;
    v_packs := 0;
  END IF;

  v_packs := v_packs + 1;

  IF v_packs >= 3 THEN
    v_unlimited := TRUE;
    UPDATE public.profiles
    SET order_credits = COALESCE(order_credits, 0) + 50,
        packs_bought_this_month = v_packs,
        unlimited_until = date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second'
    WHERE id = p_user_id;
  ELSE
    UPDATE public.profiles
    SET order_credits = COALESCE(order_credits, 0) + 50,
        packs_bought_this_month = v_packs
    WHERE id = p_user_id;
  END IF;

  UPDATE public.orders
  SET status = 'new'
  WHERE user_id = p_user_id AND status = 'menunggu';

  RETURN jsonb_build_object(
    'success', true,
    'packs_this_month', v_packs,
    'unlimited', v_unlimited
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.add_order_pack_with_credits(
  p_user_id UUID,
  p_credits INTEGER DEFAULT 50
)
RETURNS JSONB AS $$
DECLARE
  v_packs INTEGER;
  v_unlimited BOOLEAN := FALSE;
  v_reset_at TIMESTAMPTZ;
BEGIN
  SELECT counter_reset_at, COALESCE(packs_bought_this_month, 0)
  INTO v_reset_at, v_packs
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false);
  END IF;

  IF v_reset_at IS NULL
     OR to_char(v_reset_at, 'YYYY-MM') != to_char(NOW(), 'YYYY-MM') THEN
    UPDATE public.profiles
    SET receipts_used = 0,
        packs_bought_this_month = 0,
        counter_reset_at = NOW()
    WHERE id = p_user_id;
    v_packs := 0;
  END IF;

  v_packs := v_packs + 1;

  IF v_packs >= 3 THEN
    v_unlimited := TRUE;
    UPDATE public.profiles
    SET order_credits = COALESCE(order_credits, 0) + p_credits,
        packs_bought_this_month = v_packs,
        unlimited_until = date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second'
    WHERE id = p_user_id;
  ELSE
    UPDATE public.profiles
    SET order_credits = COALESCE(order_credits, 0) + p_credits,
        packs_bought_this_month = v_packs
    WHERE id = p_user_id;
  END IF;

  UPDATE public.orders
  SET status = 'new'
  WHERE user_id = p_user_id AND status = 'menunggu';

  RETURN jsonb_build_object(
    'success', true,
    'credits_added', p_credits,
    'packs_this_month', v_packs,
    'unlimited', v_unlimited
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_receipt_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_used INTEGER;
  v_limit INTEGER;
  v_plan VARCHAR(20);
  v_expiry TIMESTAMPTZ;
  v_reset_at TIMESTAMPTZ;
BEGIN
  SELECT COALESCE(receipts_used, 0), receipts_limit, plan, plan_expiry, counter_reset_at
  INTO v_used, v_limit, v_plan, v_expiry, v_reset_at
  FROM public.profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF v_expiry IS NOT NULL AND v_expiry < NOW() THEN
    RETURN FALSE;
  END IF;

  IF v_reset_at IS NULL
     OR to_char(v_reset_at, 'YYYY-MM') != to_char(NOW(), 'YYYY-MM') THEN
    UPDATE public.profiles
    SET receipts_used = 0,
        packs_bought_this_month = 0,
        counter_reset_at = NOW()
    WHERE id = p_user_id;
    v_used := 0;
  END IF;

  IF v_limit = -1 THEN
    RETURN TRUE;
  END IF;

  RETURN v_used < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.check_order_limit(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_orders_used(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_order_pack(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_order_pack_with_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_receipt_limit(UUID) TO anon, authenticated;
