-- 023: Freemium AI Credits Model
-- Switch from 14-day trial to freemium. Orders/receipts unlimited for all.
-- Paid tier (Pro) unlocks 500 AI credits/month. Free users get 20 lifetime starter credits.

-- Add AI credits columns
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ai_credits_used INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_credits_limit INTEGER DEFAULT 20;

-- Update handle_new_user to set free plan with unlimited orders/receipts
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan, orders_limit, receipts_limit, ai_credits_limit, ai_credits_used)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    'free',
    -1,  -- unlimited orders
    -1,  -- unlimited receipts
    20,  -- 20 free AI credits
    0
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: check if user has AI credits remaining
CREATE OR REPLACE FUNCTION public.check_ai_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_used INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT ai_credits_used, ai_credits_limit
  INTO v_used, v_limit
  FROM profiles
  WHERE id = p_user_id;

  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF v_limit = -1 THEN RETURN TRUE; END IF; -- unlimited
  RETURN v_used < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: consume 1 AI credit, returns true if successful
CREATE OR REPLACE FUNCTION public.use_ai_credit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_used INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT ai_credits_used, ai_credits_limit
  INTO v_used, v_limit
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF v_limit != -1 AND v_used >= v_limit THEN RETURN FALSE; END IF;

  UPDATE profiles
  SET ai_credits_used = ai_credits_used + 1
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make orders/receipts unlimited for all existing profiles
UPDATE profiles SET orders_limit = -1, receipts_limit = -1;

-- Migrate existing trial/gratis users to free plan
UPDATE profiles SET plan = 'free' WHERE plan IN ('trial', 'gratis');
