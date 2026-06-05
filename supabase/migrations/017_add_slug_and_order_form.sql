-- Add slug and order form settings to profiles for public order links
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS order_form_enabled BOOLEAN DEFAULT true;

-- Index for fast slug lookups on public route
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles (slug) WHERE slug IS NOT NULL;
