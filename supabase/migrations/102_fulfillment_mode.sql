-- Separate fulfillment method from timing (was conflated in preorder_enabled/dine_in_enabled).
-- delivery_enabled: merchant delivers to customer's address (address field required on order form)
-- pickup_enabled:   customer collects at merchant's location
-- dine_in_enabled already exists and maps to On-demand + Dine-in.
-- Valid combinations:
--   Scheduled  (preorder_enabled=true):  delivery and/or pickup  (NOT dine-in)
--   On-demand  (preorder_enabled=false): pickup and/or dine-in   (NOT delivery)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS delivery_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pickup_enabled   BOOLEAN NOT NULL DEFAULT true;

-- Migrate existing rows:
-- Scheduled (preorder) merchants → delivery + pickup both enabled (they were implicitly offering delivery)
-- On-demand (dine_in or walk-in) merchants → pickup only (delivery doesn't make sense for on-demand)
UPDATE profiles SET delivery_enabled = true, pickup_enabled = true WHERE preorder_enabled = true;
UPDATE profiles SET delivery_enabled = false, pickup_enabled = true WHERE preorder_enabled = false OR preorder_enabled IS NULL;
