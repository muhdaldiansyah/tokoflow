-- 025: Hybrid Pricing — Sachet/Top-Up AI Credits
-- Adds top-up credit balance (never expires) alongside subscription credits.
-- Pro plan updated to 600 credits/month.
-- Credit consumption priority: topup first, then subscription/free pool.

-- Add topup credits column (separate from subscription credits)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ai_credits_topup INTEGER DEFAULT 0;

-- Update Pro plan limit to 600
UPDATE profiles SET ai_credits_limit = 600 WHERE plan = 'pro';

-- Update use_ai_credit to consume topup credits first, then subscription pool
CREATE OR REPLACE FUNCTION public.use_ai_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_used INTEGER;
  v_limit INTEGER;
  v_topup INTEGER;
BEGIN
  SELECT ai_credits_used, ai_credits_limit, COALESCE(ai_credits_topup, 0)
  INTO v_used, v_limit, v_topup
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- Try topup credits first (they never expire)
  IF v_topup > 0 THEN
    UPDATE profiles
    SET ai_credits_topup = ai_credits_topup - 1
    WHERE id = p_user_id;
    RETURN TRUE;
  END IF;

  -- Then try subscription/free pool
  IF v_limit = -1 THEN
    -- unlimited plan
    UPDATE profiles
    SET ai_credits_used = ai_credits_used + 1
    WHERE id = p_user_id;
    RETURN TRUE;
  END IF;

  IF v_used >= v_limit THEN RETURN FALSE; END IF;

  UPDATE profiles
  SET ai_credits_used = ai_credits_used + 1
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update check_ai_credit to also consider topup balance
CREATE OR REPLACE FUNCTION public.check_ai_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_used INTEGER;
  v_limit INTEGER;
  v_topup INTEGER;
BEGIN
  SELECT ai_credits_used, ai_credits_limit, COALESCE(ai_credits_topup, 0)
  INTO v_used, v_limit, v_topup
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF v_topup > 0 THEN RETURN TRUE; END IF;
  IF v_limit = -1 THEN RETURN TRUE; END IF;
  RETURN v_used < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: add topup credits to a user (called after successful payment)
CREATE OR REPLACE FUNCTION public.add_topup_credits(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE profiles
  SET ai_credits_topup = COALESCE(ai_credits_topup, 0) + p_amount
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
