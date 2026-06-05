-- Migration 060: Marketplace Foundation
-- Adds city, category, description fields to profiles for directory/SEO preparation.
-- Also adds referral_source to orders for future commission tracking.

-- Profile marketplace fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city_slug TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_category TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS business_description TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_listed BOOLEAN DEFAULT true;

-- Indexes for directory queries
CREATE INDEX IF NOT EXISTS idx_profiles_city_slug ON profiles(city_slug) WHERE is_listed = true AND order_form_enabled = true;
CREATE INDEX IF NOT EXISTS idx_profiles_business_category ON profiles(business_category) WHERE is_listed = true AND order_form_enabled = true;
CREATE INDEX IF NOT EXISTS idx_profiles_listed ON profiles(is_listed) WHERE is_listed = true AND order_form_enabled = true;

-- Order referral source for future commission tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_source TEXT;
CREATE INDEX IF NOT EXISTS idx_orders_referral_source ON orders(user_id, referral_source, created_at DESC) WHERE referral_source IS NOT NULL;
