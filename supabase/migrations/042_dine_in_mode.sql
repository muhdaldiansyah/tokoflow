-- profiles: dine-in toggle (default OFF, opt-in feature)
ALTER TABLE profiles ADD COLUMN dine_in_enabled BOOLEAN DEFAULT false;

-- orders: dine-in flag per order + optional table number
ALTER TABLE orders ADD COLUMN is_dine_in BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN table_number TEXT DEFAULT NULL;

-- Partial index for filtering dine-in orders
CREATE INDEX idx_orders_is_dine_in ON orders (user_id, is_dine_in) WHERE is_dine_in = true;
