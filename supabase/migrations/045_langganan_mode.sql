-- profiles: langganan toggle for supplier/grosir (default OFF, opt-in)
ALTER TABLE profiles ADD COLUMN langganan_enabled BOOLEAN DEFAULT false;

-- orders: langganan flag per order
ALTER TABLE orders ADD COLUMN is_langganan BOOLEAN DEFAULT false;

-- Partial index for filtering langganan orders
CREATE INDEX idx_orders_is_langganan ON orders (user_id, is_langganan) WHERE is_langganan = true;
