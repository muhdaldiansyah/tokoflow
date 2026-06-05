-- Migration 096: Country-aware pricing tiers + gateway-agnostic payment_orders.
--
-- 1. `pricing_tiers` table — per-country pricing rows (Free / Pro / Business).
--    Replaces the hardcoded RM 49 / RM 99 constants in config/plans.ts so the
--    same plan code resolves to RM 49 for MY and Rp 99,000 for ID.
--
-- 2. `payment_orders.gateway_provider` — explicit gateway tag so a single
--    table can hold both Billplz and Midtrans rows. Existing `billplz_*`
--    columns stay (data isn't moved). New `gateway_*` columns mirror them
--    in a gateway-agnostic shape; future writes populate both during the
--    deprecation period.

-- ============================================================================
-- pricing_tiers — country-aware pricing
-- ============================================================================

CREATE TABLE IF NOT EXISTS pricing_tiers (
  id BIGSERIAL PRIMARY KEY,
  country_code TEXT NOT NULL CHECK (country_code IN ('MY', 'ID')),
  plan_code TEXT NOT NULL,
  display_name TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL CHECK (currency IN ('MYR', 'IDR')),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly', 'one_time')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pricing_tiers_country_plan_cycle_uniq
    UNIQUE (country_code, plan_code, billing_cycle)
);

CREATE INDEX IF NOT EXISTS pricing_tiers_country_active_idx
  ON pricing_tiers(country_code, active) WHERE active = TRUE;

COMMENT ON TABLE pricing_tiers IS
  'Country-keyed pricing. Same plan_code (e.g. "bisnis") resolves to different amount/currency per country.';

-- Seed MY rows (mirrors existing config/plans.ts constants)
INSERT INTO pricing_tiers (country_code, plan_code, display_name, amount, currency, billing_cycle, sort_order)
VALUES
  ('MY', 'free',     'Free',     0,  'MYR', 'monthly', 0),
  ('MY', 'bisnis',   'Pro',      49, 'MYR', 'monthly', 1),
  ('MY', 'business', 'Business', 99, 'MYR', 'monthly', 2)
ON CONFLICT (country_code, plan_code, billing_cycle) DO NOTHING;

-- Seed ID rows (PPP-adjusted; matches CatatOrder existing IDR scale)
INSERT INTO pricing_tiers (country_code, plan_code, display_name, amount, currency, billing_cycle, sort_order)
VALUES
  ('ID', 'free',     'Gratis',   0,      'IDR', 'monthly', 0),
  ('ID', 'bisnis',   'Pro',      99000,  'IDR', 'monthly', 1),
  ('ID', 'business', 'Business', 199000, 'IDR', 'monthly', 2)
ON CONFLICT (country_code, plan_code, billing_cycle) DO NOTHING;

-- RLS: pricing tiers are public read, no writes from clients
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'pricing_tiers' AND policyname = 'Public read pricing_tiers'
  ) THEN
    CREATE POLICY "Public read pricing_tiers" ON pricing_tiers
      FOR SELECT USING (TRUE);
  END IF;
END $$;

-- ============================================================================
-- payment_orders: gateway-agnostic columns
-- ============================================================================
-- Add gateway_* mirrors of the billplz_* columns. Going forward, every payment
-- creation populates BOTH the gateway_* fields and (for Billplz) the legacy
-- billplz_* fields, so the existing webhook + reconciliation logic keeps
-- working unchanged. The legacy billplz_* columns can be dropped in a future
-- migration once all read paths are migrated.

ALTER TABLE payment_orders
  ADD COLUMN IF NOT EXISTS gateway_provider TEXT;

ALTER TABLE payment_orders
  DROP CONSTRAINT IF EXISTS payment_orders_gateway_provider_check;
ALTER TABLE payment_orders
  ADD CONSTRAINT payment_orders_gateway_provider_check
  CHECK (gateway_provider IS NULL OR gateway_provider IN ('billplz', 'midtrans'));

ALTER TABLE payment_orders
  ADD COLUMN IF NOT EXISTS gateway_bill_id TEXT;
ALTER TABLE payment_orders
  ADD COLUMN IF NOT EXISTS gateway_url TEXT;
ALTER TABLE payment_orders
  ADD COLUMN IF NOT EXISTS gateway_paid_at TIMESTAMPTZ;
ALTER TABLE payment_orders
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'MY';

ALTER TABLE payment_orders
  DROP CONSTRAINT IF EXISTS payment_orders_country_check;
ALTER TABLE payment_orders
  ADD CONSTRAINT payment_orders_country_check
  CHECK (country IN ('MY', 'ID'));

CREATE INDEX IF NOT EXISTS payment_orders_gateway_bill_id_idx
  ON payment_orders(gateway_bill_id);
CREATE INDEX IF NOT EXISTS payment_orders_country_idx
  ON payment_orders(country);

-- Backfill: all existing rows are MY + Billplz
UPDATE payment_orders
  SET gateway_provider = 'billplz',
      gateway_bill_id = COALESCE(gateway_bill_id, billplz_bill_id),
      gateway_url = COALESCE(gateway_url, billplz_url),
      gateway_paid_at = COALESCE(gateway_paid_at, billplz_paid_at),
      country = COALESCE(country, 'MY')
  WHERE gateway_provider IS NULL;

COMMENT ON COLUMN payment_orders.gateway_provider IS
  'Which payment gateway processed this order: billplz (MY) or midtrans (ID).';
COMMENT ON COLUMN payment_orders.country IS
  'Country snapshot at billing time. Same merchant always pays in their country currency.';

-- ============================================================================
-- invoices: e-invoice provider tag (for the dispatcher to know which to use)
-- ============================================================================
-- Existing `myinvois_*` columns stay populated for MY rows. New `einvoice_*`
-- columns are added as the gateway-agnostic surface so an ID invoice can
-- record the e-Faktur submission alongside.

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS einvoice_provider TEXT;

ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_einvoice_provider_check;
ALTER TABLE invoices
  ADD CONSTRAINT invoices_einvoice_provider_check
  CHECK (einvoice_provider IS NULL OR einvoice_provider IN ('myinvois', 'efaktur'));

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS einvoice_external_id TEXT;
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS einvoice_external_uuid TEXT;
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS einvoice_long_id TEXT;
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS einvoice_status TEXT;
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS einvoice_payload JSONB;

ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_einvoice_status_check;
ALTER TABLE invoices
  ADD CONSTRAINT invoices_einvoice_status_check
  CHECK (einvoice_status IS NULL OR einvoice_status IN
    ('draft', 'pending', 'valid', 'invalid', 'cancelled', 'rejected'));

CREATE INDEX IF NOT EXISTS invoices_einvoice_external_id_idx
  ON invoices(einvoice_external_id);

-- Backfill MY invoices: copy myinvois_* into einvoice_*
UPDATE invoices
  SET einvoice_provider = COALESCE(einvoice_provider, 'myinvois'),
      einvoice_external_id = COALESCE(einvoice_external_id, myinvois_submission_uid),
      einvoice_external_uuid = COALESCE(einvoice_external_uuid, myinvois_uuid),
      einvoice_long_id = COALESCE(einvoice_long_id, myinvois_long_id),
      einvoice_status = COALESCE(einvoice_status, myinvois_status)
  WHERE myinvois_submission_uid IS NOT NULL OR myinvois_uuid IS NOT NULL;

COMMENT ON COLUMN invoices.einvoice_provider IS
  'Which e-invoice provider issued this document: myinvois (MY) or efaktur (ID).';
