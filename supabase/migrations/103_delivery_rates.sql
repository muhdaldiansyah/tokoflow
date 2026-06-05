-- Migration 103: Delivery rates by zone (Peninsular / Sabah+Sarawak)
-- Stored as JSONB on profiles for zero-join reads on the public order form.
-- Schema: { "peninsular": 8, "sabah_sarawak": 15 }
-- NULL = delivery rates not configured (delivery fee not shown to customer).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS delivery_rates JSONB DEFAULT NULL;

COMMENT ON COLUMN profiles.delivery_rates IS
  'Delivery fee config: {"peninsular": <RM>, "sabah_sarawak": <RM>}. NULL = not configured.';

-- Add delivery_zone to orders so we know which rate was applied
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_zone TEXT CHECK (delivery_zone IN ('peninsular', 'sabah_sarawak')) DEFAULT NULL;

COMMENT ON COLUMN orders.delivery_zone IS
  'Zone selected by customer at order time. NULL = pickup or delivery zone not set.';

-- delivery_fee stored in orders so it survives rate changes
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_fee NUMERIC(10,2) DEFAULT 0 NOT NULL;

COMMENT ON COLUMN orders.delivery_fee IS
  'Delivery fee charged at order time (snapshot, not recalculated on rate change).';
