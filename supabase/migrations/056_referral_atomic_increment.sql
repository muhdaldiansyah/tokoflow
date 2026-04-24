-- 056: Atomic referral commission increment (prevents race condition)

CREATE OR REPLACE FUNCTION increment_referral_commission(
  p_referral_code TEXT,
  p_amount INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles SET
    referral_balance = COALESCE(referral_balance, 0) + p_amount,
    referral_total_earned = COALESCE(referral_total_earned, 0) + p_amount
  WHERE referral_code = p_referral_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
