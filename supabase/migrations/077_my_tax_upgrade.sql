-- Migration 077: Malaysia tax & e-Invoice upgrade.
-- Adds MY-specific fields, keeps legacy ID columns nullable for backward compat
-- during the pivot. Drop legacy columns in a later migration once data migration
-- is complete.

-- ─── profiles: SST + MyInvois ────────────────────────────────────────────
-- Malaysian Business Registration Number (Sdn Bhd number, e.g. 202301012345)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brn TEXT;
-- LHDN Taxpayer Identification Number (e.g. IG00000000010)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tin TEXT;
-- Sales & Service Tax registration ID (only for RM500K+ merchants)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sst_registration_id TEXT;
-- MyInvois API credentials (encrypted at rest — populate via settings UI only)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS myinvois_client_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS myinvois_client_secret_enc TEXT;
-- Default SST rate for invoices (0 = exempt / zero-rated, 6 = standard service tax)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_sst_rate NUMERIC(4,2) DEFAULT 0
  CHECK (default_sst_rate IN (0, 6));

-- Shift quiet hours default from WIB (21:00–05:00) to Malaysia MYT (22:00–06:00).
-- Only affects NEW profiles; existing rows keep their configured values.
ALTER TABLE profiles ALTER COLUMN quiet_hours_start SET DEFAULT '22:00:00';
ALTER TABLE profiles ALTER COLUMN quiet_hours_end SET DEFAULT '06:00:00';

-- ─── customers: SST + buyer TIN ──────────────────────────────────────────
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tin TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS sst_registration_id TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS brn TEXT;

-- ─── invoices: SST + MyInvois linkage ────────────────────────────────────
-- Parallel the PPN fields — do NOT drop legacy ppn_rate/ppn_amount yet (compat).
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sst_rate NUMERIC(4,2) DEFAULT 0
  CHECK (sst_rate IN (0, 6));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS sst_amount NUMERIC(14,2) DEFAULT 0;
-- MyInvois submission tracking
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS myinvois_submission_uid TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS myinvois_uuid TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS myinvois_long_id TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS myinvois_status TEXT
  CHECK (myinvois_status IN ('pending', 'submitted', 'valid', 'invalid', 'cancelled', 'rejected'));
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS myinvois_submitted_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS myinvois_validated_at TIMESTAMPTZ;
-- Rejection / validation error payload from LHDN (for ops visibility)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS myinvois_errors JSONB;
-- Buyer-side tax identifiers captured at invoice-time (snapshot, not FK)
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_tin TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_brn TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS buyer_sst_id TEXT;

-- ─── RM 10,000 individual e-Invoice threshold flag ───────────────────────
-- When true, the invoice MUST be individually submitted (not consolidated).
-- LHDN rule effective 1 Jan 2026 for all B2C transactions > RM10,000.
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS requires_individual_einvoice BOOLEAN DEFAULT false;

-- Index for MyInvois polling / reconciliation
CREATE INDEX IF NOT EXISTS idx_invoices_myinvois_status
  ON invoices (user_id, myinvois_status)
  WHERE myinvois_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_invoices_myinvois_uuid
  ON invoices (myinvois_uuid)
  WHERE myinvois_uuid IS NOT NULL;

-- ─── billing / plan_code: Billplz-compatible ─────────────────────────────
-- Existing payment_orders table uses gateway-agnostic columns (plan_code, amount).
-- Add Billplz-specific columns without touching Midtrans fields yet (coexist).
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS billplz_bill_id TEXT;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS billplz_collection_id TEXT;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS billplz_url TEXT;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS billplz_paid_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_payment_orders_billplz_bill_id
  ON payment_orders (billplz_bill_id)
  WHERE billplz_bill_id IS NOT NULL;

-- ─── Flag legacy Indonesian columns for later removal ────────────────────
-- Columns to drop in migration 078+ once data is fully migrated:
--   profiles.npwp, profiles.nitku, profiles.wp_type, profiles.wp_registered_year
--   invoices.seller_npwp, invoices.seller_nitku, invoices.buyer_npwp, invoices.trx_code
--   customers.npwp
-- NOT dropped in this migration — app still reads them during parallel operation.

COMMENT ON COLUMN profiles.npwp IS
  'LEGACY (Indonesia). Use `tin` + `brn` instead. Drop in migration 078.';
COMMENT ON COLUMN profiles.nitku IS
  'LEGACY (Indonesia). Not applicable to Malaysia. Drop in migration 078.';
COMMENT ON COLUMN invoices.ppn_rate IS
  'LEGACY (Indonesia VAT). Use `sst_rate` instead. Drop in migration 078.';
COMMENT ON COLUMN invoices.ppn_amount IS
  'LEGACY (Indonesia VAT). Use `sst_amount` instead. Drop in migration 078.';
COMMENT ON COLUMN invoices.trx_code IS
  'LEGACY (Indonesia Coretax DJP). Not applicable to Malaysia. Drop in migration 078.';
