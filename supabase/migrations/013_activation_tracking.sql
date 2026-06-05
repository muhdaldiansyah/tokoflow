-- 013_activation_tracking.sql
-- Track activation metrics for onboarding and WA drip

-- Track when user first opened a WA share link (activation measurement)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_wa_sent_at TIMESTAMPTZ;

-- Track which onboarding drip messages have been sent (e.g. {"day0": "2026-02-13T...", "day1": "2026-02-14T..."})
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_drip JSONB DEFAULT '{}'::jsonb;
