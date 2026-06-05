-- Migration 094: Country axis on profiles + customers.
--
-- Tokoflow's tenant axis becomes country: 'MY' | 'ID'. Every country-coupled
-- decision (currency, payment gateway, e-invoice provider, locale, timezone,
-- phone format, tax rules) flows through the merchant's country in code.
--
-- This migration is fully additive and backward-compatible:
--   - `country` defaults to 'MY' for all existing rows
--   - existing routes that don't yet read `country` get MY behavior unchanged
--   - the constraint allows only 'MY' | 'ID' but more rows can be added later
--
-- Reference: lib/country/resolve.ts (the runtime source of truth for the axis).

-- ============================================================================
-- profiles.country
-- ============================================================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'MY';

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_country_check;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_country_check
  CHECK (country IN ('MY', 'ID'));

CREATE INDEX IF NOT EXISTS profiles_country_idx ON profiles(country);

COMMENT ON COLUMN profiles.country IS
  'Tenant axis: MY = Malaysia (Billplz, MyInvois, MYR, MYT). ID = Indonesia (Midtrans, e-Faktur Coretax, IDR, WIB). Defaults to MY for backward compat.';

-- ============================================================================
-- customers.country
-- ============================================================================
-- Customer rows are scoped to the merchant who created them, so country
-- usually mirrors the merchant. We still tag the customer row directly to
-- support the cross-border edge case (merchant in MY, customer in ID via
-- Shopee/marketplace) where phone format and tax-id field shape differ.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'MY';

ALTER TABLE customers
  DROP CONSTRAINT IF EXISTS customers_country_check;
ALTER TABLE customers
  ADD CONSTRAINT customers_country_check
  CHECK (country IN ('MY', 'ID'));

CREATE INDEX IF NOT EXISTS customers_country_idx ON customers(country);

COMMENT ON COLUMN customers.country IS
  'Country of the customer. Usually matches the merchant who owns this row but may differ for cross-border orders.';

-- ============================================================================
-- invoices.country (denormalized for tax engine routing)
-- ============================================================================
-- The invoice country is what determines whether MyInvois (MY, JSON) or
-- e-Faktur Coretax (ID, XML) handles the e-invoice flow. We denormalize from
-- profiles to make tax-summary queries fast and to lock the country at the
-- moment the invoice was issued (in case a merchant ever migrates).

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'MY';

ALTER TABLE invoices
  DROP CONSTRAINT IF EXISTS invoices_country_check;
ALTER TABLE invoices
  ADD CONSTRAINT invoices_country_check
  CHECK (country IN ('MY', 'ID'));

CREATE INDEX IF NOT EXISTS invoices_country_idx ON invoices(country);

COMMENT ON COLUMN invoices.country IS
  'Snapshot of the merchant country at issue time. Drives e-invoice provider routing (MyInvois vs e-Faktur Coretax).';

-- ============================================================================
-- Convenience: default the new columns on insert from the merchant's profile
-- ============================================================================
-- We don't add a trigger here on purpose — the application layer reads
-- `profile.country` and writes the explicit value. This keeps the SQL surface
-- small and makes country migration (rare) a single UPDATE.
