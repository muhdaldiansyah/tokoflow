-- Migration 076: Referral signup bonus tracking
-- Adds flag to prevent double-crediting Rp5.000 signup bonus

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_signup_bonus_credited BOOLEAN DEFAULT FALSE;
