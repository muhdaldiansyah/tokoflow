-- Migration 034: Soft delete for orders and receipts
-- Instead of hard-deleting, set deleted_at timestamp

-- Add deleted_at column to orders
ALTER TABLE orders ADD COLUMN deleted_at timestamptz DEFAULT NULL;

-- Add deleted_at column to receipts
ALTER TABLE receipts ADD COLUMN deleted_at timestamptz DEFAULT NULL;

-- Partial indexes for efficient queries (only non-deleted rows)
CREATE INDEX idx_orders_not_deleted ON orders (user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_receipts_not_deleted ON receipts (user_id, created_at DESC) WHERE deleted_at IS NULL;

-- Update RLS policies to exclude soft-deleted rows
-- Orders: drop old policy, create new one filtering deleted_at
DROP POLICY IF EXISTS "Users can CRUD own orders" ON orders;
CREATE POLICY "Users can CRUD own orders" ON orders
  FOR ALL USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Receipts: drop old policy, create new one filtering deleted_at
DROP POLICY IF EXISTS "Users can CRUD own receipts" ON receipts;
CREATE POLICY "Users can CRUD own receipts" ON receipts
  FOR ALL USING (auth.uid() = user_id AND deleted_at IS NULL);
