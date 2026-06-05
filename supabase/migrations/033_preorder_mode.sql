-- profiles: preorder toggle (default ON for main market)
ALTER TABLE profiles ADD COLUMN preorder_enabled BOOLEAN DEFAULT true;

-- orders: preorder flag per order
ALTER TABLE orders ADD COLUMN is_preorder BOOLEAN DEFAULT false;

-- Partial index for filtering preorder orders
CREATE INDEX idx_orders_is_preorder ON orders (user_id, is_preorder) WHERE is_preorder = true;
