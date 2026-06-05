-- Migration 110: Default the country axis to Indonesia (Tokoflow deployment).
--
-- Tokoflow is the Indonesia deployment of the Kedaiflow (MY) codebase. The
-- runtime source of truth is lib/country/resolve.ts, which now defaults to ID.
-- This migration aligns the database so trigger-created rows (handle_new_user
-- only sets id/email/full_name; country comes from the column DEFAULT) and any
-- direct inserts inherit ID instead of MY.
--
-- Fully additive + idempotent. The 'MY' value stays valid (dormant Malaysia
-- path) so nothing about the multi-country architecture is removed.

-- ============================================================================
-- Country axis defaults → 'ID'
-- ============================================================================
ALTER TABLE profiles  ALTER COLUMN country      SET DEFAULT 'ID';
ALTER TABLE customers ALTER COLUMN country      SET DEFAULT 'ID';
ALTER TABLE invoices  ALTER COLUMN country      SET DEFAULT 'ID';
ALTER TABLE cities    ALTER COLUMN country_code SET DEFAULT 'ID';
ALTER TABLE provinces ALTER COLUMN country_code SET DEFAULT 'ID';

-- ============================================================================
-- Quiet hours default → WIB (Asia/Jakarta) 21:00–05:00
-- (Migration 077 set these to MYT 22:00–06:00 for Malaysia.)
-- ============================================================================
ALTER TABLE profiles ALTER COLUMN quiet_hours_start SET DEFAULT '21:00:00';
ALTER TABLE profiles ALTER COLUMN quiet_hours_end   SET DEFAULT '05:00:00';

-- ============================================================================
-- Tax-rate CHECKs: allow Indonesia PPN rates (0 / 11 / 12) alongside MY SST (6).
-- Migration 077 created inline CHECKs restricting these to (0, 6), which would
-- reject every Indonesian PPN invoice. Widen the allowed set; keep 6 so the
-- dormant MY path stays valid.
-- ============================================================================
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_default_sst_rate_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_default_sst_rate_check
  CHECK (default_sst_rate IN (0, 6, 11, 12));

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_sst_rate_check;
ALTER TABLE invoices
  ADD CONSTRAINT invoices_sst_rate_check
  CHECK (sst_rate IN (0, 6, 11, 12));

COMMENT ON COLUMN profiles.country IS
  'Tenant axis. Defaults to ID (Tokoflow = Indonesia: Midtrans, e-Faktur, IDR, WIB). MY remains valid for the dormant Malaysia path.';
