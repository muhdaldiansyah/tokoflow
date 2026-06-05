-- 044: Medium Order Pack
-- Add RPC that accepts variable credit amount for medium pack (100 credits).
-- Original add_order_pack (50 credits) remains unchanged for backward compatibility.

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
      order_credits = COALESCE(order_credits, 0) + p_credits,
      packs_bought_this_month = v_packs,
      unlimited_until = date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second'
    WHERE id = p_user_id;
  ELSE
    UPDATE profiles SET
      order_credits = COALESCE(order_credits, 0) + p_credits,
      packs_bought_this_month = v_packs
    WHERE id = p_user_id;
  END IF;

  -- Activate all "menunggu" orders for this user
  UPDATE orders SET status = 'new'
  WHERE user_id = p_user_id AND status = 'menunggu';

  RETURN jsonb_build_object(
    'success', true,
    'credits_added', p_credits,
    'packs_this_month', v_packs,
    'unlimited', v_unlimited
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.add_order_pack_with_credits(UUID, INTEGER) TO authenticated;
