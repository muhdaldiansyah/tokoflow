-- Soft delete for products
ALTER TABLE products ADD COLUMN deleted_at timestamptz DEFAULT NULL;

-- Index for efficient filtering of non-deleted products
CREATE INDEX idx_products_deleted_at ON products (user_id) WHERE deleted_at IS NULL;
