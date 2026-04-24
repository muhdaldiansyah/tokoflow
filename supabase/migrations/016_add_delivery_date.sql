-- Add delivery_date to orders for katering/bakery scheduling
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date timestamptz;

-- Index for "Hari Ini" filter queries
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders (user_id, delivery_date)
  WHERE delivery_date IS NOT NULL;
