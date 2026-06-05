-- Migration 074: Add customizable overhead estimate percentage
-- Previously hardcoded at 40% in ProductForm, now per-user with smart defaults per business type
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS overhead_estimate_pct NUMERIC(4,1) DEFAULT 40.0;
COMMENT ON COLUMN profiles.overhead_estimate_pct IS 'Estimated overhead as % of sell price (transport, gudang, listrik, kemasan, dll). Default from business type config.';
