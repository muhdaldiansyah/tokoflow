-- Add marketplace-standard catalog fields to products
ALTER TABLE products ADD COLUMN description TEXT;
ALTER TABLE products ADD COLUMN category TEXT;
ALTER TABLE products ADD COLUMN is_available BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE products ADD COLUMN stock INTEGER;
ALTER TABLE products ADD COLUMN unit TEXT;
ALTER TABLE products ADD COLUMN min_order_qty INTEGER NOT NULL DEFAULT 1;

-- Index for category grouping queries
CREATE INDEX idx_products_category ON products(user_id, category);
