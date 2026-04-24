-- Create activate_unlimited RPC for direct unlimited monthly purchase (Rp35K)
-- Sets unlimited_until to end of current month, activates all "menunggu" orders

CREATE OR REPLACE FUNCTION public.activate_unlimited(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile RECORD;
  v_activated INTEGER;
BEGIN
  -- Lock row
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Set unlimited_until to last second of current month
  UPDATE profiles
  SET unlimited_until = date_trunc('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 second'
  WHERE id = p_user_id;

  -- Activate all "menunggu" orders to "new"
  UPDATE orders
  SET status = 'new'
  WHERE user_id = p_user_id
    AND status = 'menunggu';

  GET DIAGNOSTICS v_activated = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'unlimited', true,
    'activated_orders', v_activated
  );
END;
$$;
