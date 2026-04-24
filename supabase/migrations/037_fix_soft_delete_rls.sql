-- Migration 037: Add deleted_at columns + fix RLS policies for soft delete
-- Migration 034 was recorded but never executed, so we add columns here

-- Add deleted_at columns (IF NOT EXISTS for safety)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;
ALTER TABLE receipts ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Partial indexes (drop first in case they exist)
DROP INDEX IF EXISTS idx_orders_not_deleted;
DROP INDEX IF EXISTS idx_receipts_not_deleted;
CREATE INDEX idx_orders_not_deleted ON orders (user_id, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_receipts_not_deleted ON receipts (user_id, created_at DESC) WHERE deleted_at IS NULL;

-- ── Orders: split into separate policies so UPDATE can set deleted_at ──
DROP POLICY IF EXISTS "Users can CRUD own orders" ON orders;
DROP POLICY IF EXISTS "Users can select own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Users can update own orders" ON orders;
DROP POLICY IF EXISTS "Users can delete own orders" ON orders;

CREATE POLICY "Users can select own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own orders" ON orders
  FOR DELETE USING (auth.uid() = user_id);

-- ── Receipts: same split ──
DROP POLICY IF EXISTS "Users can CRUD own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can select own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can insert own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can update own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can delete own receipts" ON receipts;

CREATE POLICY "Users can select own receipts" ON receipts
  FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can insert own receipts" ON receipts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own receipts" ON receipts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own receipts" ON receipts
  FOR DELETE USING (auth.uid() = user_id);
