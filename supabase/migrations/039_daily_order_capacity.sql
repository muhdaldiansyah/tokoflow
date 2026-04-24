-- Add daily order capacity for preorder mode
-- NULL = unlimited (default, no friction for new users)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_order_capacity INTEGER DEFAULT NULL;
