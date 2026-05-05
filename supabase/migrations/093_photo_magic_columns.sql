-- Migration 093: Photo Magic v1 schema additions
--
-- Adds two columns to support Photo Magic v1 onboarding per
-- docs/positioning/P4-photo-magic-plan.md:
--
-- 1. profiles.bio TEXT — 2-3 sentence first-person shop story written by AI
--    from photo, editable by merchant. Surfaces on /[slug] storefront.
-- 2. products.source TEXT — provenance flag. Values: 'manual' (default),
--    'photo_magic', 'voice', 'paste'. Allows safe re-bootstrap (delete only
--    photo_magic-sourced rows; preserve manual entries).
--
-- Both nullable / defaulted for backwards compat with 92 existing migrations.

-- ============================================================================
-- profiles.bio
-- ============================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;

COMMENT ON COLUMN profiles.bio IS 'First-person shop story (2-3 sentences). Bootstrap from Photo Magic, editable by merchant. Surfaces on /[slug] storefront.';

-- ============================================================================
-- products.source
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

-- Constraint: must be one of known provenance values
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_source_check;

ALTER TABLE products
  ADD CONSTRAINT products_source_check
  CHECK (source IN ('manual', 'photo_magic', 'voice', 'paste', 'imported'));

COMMENT ON COLUMN products.source IS 'Provenance flag. ''manual'' = merchant typed; ''photo_magic'' = AI-extracted from setup photo; ''voice''/''paste'' = AI-parsed from order intake; ''imported'' = bulk migration. Re-bootstrap deletes ''photo_magic'' source only, preserving manual.';

CREATE INDEX IF NOT EXISTS idx_products_source ON products (source) WHERE source <> 'manual';
