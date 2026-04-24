-- Migration 067: Add business_type column for smart defaults architecture
-- Part of Architecture Transformation (P0 Sprint 1)

-- Add business_type to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_type TEXT;

-- Index for analytics/filtering
CREATE INDEX IF NOT EXISTS idx_profiles_business_type ON profiles(business_type) WHERE business_type IS NOT NULL;

-- Comment
COMMENT ON COLUMN profiles.business_type IS 'Business type selected during onboarding setup. Used for smart defaults (mode, capacity, units, categories).';
