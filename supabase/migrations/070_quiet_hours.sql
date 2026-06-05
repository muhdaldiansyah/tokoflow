-- Quiet hours / rest mode: suppress push notifications during these hours
-- Default: 21:00 - 05:00 WIB (user can customize)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS quiet_hours_start TEXT DEFAULT '21:00',
  ADD COLUMN IF NOT EXISTS quiet_hours_end TEXT DEFAULT '05:00';

COMMENT ON COLUMN profiles.quiet_hours_start IS 'Start of quiet hours (HH:MM WIB). Notifications suppressed during this window.';
COMMENT ON COLUMN profiles.quiet_hours_end IS 'End of quiet hours (HH:MM WIB). Morning brief sent after this time.';
