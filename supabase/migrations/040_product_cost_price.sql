-- Add cost price (HPP) to products for profit margin calculation
-- NULL = not set (default, no friction)
ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price INTEGER DEFAULT NULL;

-- Add target food cost percentage to profiles (default 30%)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS target_food_cost_percent INTEGER DEFAULT 30;
