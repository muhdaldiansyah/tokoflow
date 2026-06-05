-- Migration 095: Country tagging on cities, provinces, business_categories, product_units.
--
-- Existing rows (44 MY cities × 16 states + 24 business_categories + 17 product_units
-- per migration 080) are tagged 'MY'. ID rows (34 provinces × ~514 cities + ID-flavored
-- categories and units) will be seeded via Management API separately — that pattern
-- mirrors how CatatOrder originally bulk-seeded its ID data (see catatorder-web
-- migration 068 for the pattern).
--
-- This migration is fully additive: every existing MY query continues to return
-- MY-only rows once callers are updated to filter by country_code.

-- ============================================================================
-- cities.country_code
-- ============================================================================

ALTER TABLE cities
  ADD COLUMN IF NOT EXISTS country_code TEXT NOT NULL DEFAULT 'MY';

ALTER TABLE cities
  DROP CONSTRAINT IF EXISTS cities_country_code_check;
ALTER TABLE cities
  ADD CONSTRAINT cities_country_code_check
  CHECK (country_code IN ('MY', 'ID'));

CREATE INDEX IF NOT EXISTS cities_country_code_idx ON cities(country_code);

COMMENT ON COLUMN cities.country_code IS
  'ISO 3166-1 alpha-2 country code. Filters city lookup queries by tenant country.';

-- ============================================================================
-- provinces.country_code
-- ============================================================================

ALTER TABLE provinces
  ADD COLUMN IF NOT EXISTS country_code TEXT NOT NULL DEFAULT 'MY';

ALTER TABLE provinces
  DROP CONSTRAINT IF EXISTS provinces_country_code_check;
ALTER TABLE provinces
  ADD CONSTRAINT provinces_country_code_check
  CHECK (country_code IN ('MY', 'ID'));

CREATE INDEX IF NOT EXISTS provinces_country_code_idx ON provinces(country_code);

COMMENT ON COLUMN provinces.country_code IS
  'ISO 3166-1 alpha-2 country code. MY = states/federal territories. ID = provinsi.';

-- ============================================================================
-- business_categories.country_code (nullable — null means available globally)
-- ============================================================================
-- Categories like "F&B" / "Kosmetik" / "Fashion" translate semantically across
-- countries. We tag a row only if the slug is country-specific (e.g. "kopitiam"
-- is MY-flavored; "warung-makan" is ID-flavored). Nullable allows shared rows.

ALTER TABLE business_categories
  ADD COLUMN IF NOT EXISTS country_code TEXT;

ALTER TABLE business_categories
  DROP CONSTRAINT IF EXISTS business_categories_country_code_check;
ALTER TABLE business_categories
  ADD CONSTRAINT business_categories_country_code_check
  CHECK (country_code IS NULL OR country_code IN ('MY', 'ID'));

CREATE INDEX IF NOT EXISTS business_categories_country_code_idx
  ON business_categories(country_code);

COMMENT ON COLUMN business_categories.country_code IS
  'NULL = available globally. MY/ID = restricted to that country. Most rows are NULL.';

-- ============================================================================
-- product_units.country_code (nullable — same pattern as business_categories)
-- ============================================================================

ALTER TABLE product_units
  ADD COLUMN IF NOT EXISTS country_code TEXT;

ALTER TABLE product_units
  DROP CONSTRAINT IF EXISTS product_units_country_code_check;
ALTER TABLE product_units
  ADD CONSTRAINT product_units_country_code_check
  CHECK (country_code IS NULL OR country_code IN ('MY', 'ID'));

CREATE INDEX IF NOT EXISTS product_units_country_code_idx
  ON product_units(country_code);

COMMENT ON COLUMN product_units.country_code IS
  'NULL = available globally (kg, gram, pcs, etc.). MY/ID = country-flavored synonyms.';

-- ============================================================================
-- Tag MY-flavored category synonyms explicitly
-- ============================================================================
-- Migration 080 relabelled `warung-makan` -> "Kopitiam & Food Stall" and
-- `katering` -> "Catering & Nasi Box". These are the MY-specific naming
-- rows. ID merchants will get equivalent rows seeded separately with
-- country_code='ID'. `business_categories` PK column is `id` (text),
-- not `slug`. `product_units` MY-flavor labels live in the `label` column;
-- the `id` stays as the original ID-language token (porsi/loyang/...).

UPDATE business_categories SET country_code = 'MY'
  WHERE id IN ('warung-makan', 'katering');

UPDATE product_units SET country_code = 'MY'
  WHERE label IN ('pax', 'tray', 'glass', 'sheet', 'stick');
