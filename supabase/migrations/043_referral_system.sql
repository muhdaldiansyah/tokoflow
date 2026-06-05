-- Migration 043: Referral System
-- Adds referral tracking columns to profiles + updates handle_new_user for auto-generated referral codes

-- 1. Add referral columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referred_by TEXT,
  ADD COLUMN IF NOT EXISTS referral_balance INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_total_earned INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_total_paid INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_expires_at TIMESTAMPTZ;

-- 2. Index for referral lookups
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON public.profiles(referral_code) WHERE referral_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON public.profiles(referred_by) WHERE referred_by IS NOT NULL;

-- 3. Helper function to generate unique 6-char referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-char uppercase alphanumeric code
    v_code := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    -- Check uniqueness
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = v_code) INTO v_exists;
    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Update handle_new_user to auto-generate referral_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan, orders_limit, receipts_limit, ai_credits_limit, ai_credits_used, referral_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    'free',
    -1,
    -1,
    -1,
    0,
    public.generate_referral_code()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Backfill existing profiles with referral codes
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM public.profiles WHERE referral_code IS NULL
  LOOP
    UPDATE public.profiles
    SET referral_code = public.generate_referral_code()
    WHERE id = r.id;
  END LOOP;
END;
$$;
