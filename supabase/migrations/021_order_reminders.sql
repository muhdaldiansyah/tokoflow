-- 021: Extend reminders table to support order-based reminders
-- Adds order_id, reminder_type, day_offset; makes receipt_id nullable

-- Add new columns
ALTER TABLE reminders
  ADD COLUMN order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  ADD COLUMN reminder_type VARCHAR(20) DEFAULT 'receipt',
  ADD COLUMN day_offset INTEGER;

-- Make receipt_id nullable (order reminders won't have one)
ALTER TABLE reminders ALTER COLUMN receipt_id DROP NOT NULL;

-- At least one of receipt_id or order_id must be set
ALTER TABLE reminders ADD CONSTRAINT reminders_source_check
  CHECK (receipt_id IS NOT NULL OR order_id IS NOT NULL);

-- Index for order lookups
CREATE INDEX idx_reminders_order_id ON reminders(order_id);

-- Drop existing RLS policies (they only check receipts)
DROP POLICY IF EXISTS "Users can view own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can create reminders for own receipts" ON reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON reminders;

-- Recreate RLS policies checking ownership through EITHER receipts OR orders
CREATE POLICY "Users can view own reminders" ON reminders
  FOR SELECT USING (
    (receipt_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM receipts WHERE receipts.id = reminders.receipt_id AND receipts.user_id = auth.uid()
    ))
    OR
    (order_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM orders WHERE orders.id = reminders.order_id AND orders.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create own reminders" ON reminders
  FOR INSERT WITH CHECK (
    (receipt_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM receipts WHERE receipts.id = receipt_id AND receipts.user_id = auth.uid()
    ))
    OR
    (order_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can update own reminders" ON reminders
  FOR UPDATE USING (
    (receipt_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM receipts WHERE receipts.id = reminders.receipt_id AND receipts.user_id = auth.uid()
    ))
    OR
    (order_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM orders WHERE orders.id = reminders.order_id AND orders.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can delete own reminders" ON reminders
  FOR DELETE USING (
    (receipt_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM receipts WHERE receipts.id = reminders.receipt_id AND receipts.user_id = auth.uid()
    ))
    OR
    (order_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM orders WHERE orders.id = reminders.order_id AND orders.user_id = auth.uid()
    ))
  );
