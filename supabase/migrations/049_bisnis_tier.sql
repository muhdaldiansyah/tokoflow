-- 049: Profile + customer tax fields + bisnis tier

-- Profile tax & bisnis fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS npwp TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nitku TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bisnis_until TIMESTAMPTZ;

-- Customer address & tax fields
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS npwp TEXT;

-- RPC: Activate bisnis tier (same pattern as activate_unlimited)
CREATE OR REPLACE FUNCTION activate_bisnis(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_end TIMESTAMPTZ;
BEGIN
  -- End of current month in WIB
  v_end := date_trunc('month', (now() AT TIME ZONE 'Asia/Jakarta') + interval '1 month')
            AT TIME ZONE 'Asia/Jakarta';

  UPDATE profiles
  SET bisnis_until = v_end,
      updated_at = now()
  WHERE id = p_user_id;

  -- Also activate unlimited (bisnis includes unlimited orders)
  PERFORM activate_unlimited(p_user_id);
END;
$$;
