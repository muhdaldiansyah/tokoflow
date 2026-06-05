-- Add paid_amount to orders for DP/partial payment tracking
ALTER TABLE orders ADD COLUMN paid_amount INTEGER NOT NULL DEFAULT 0;

-- Backfill: paid orders should have paid_amount = total
UPDATE orders SET paid_amount = total WHERE payment_status = 'paid';
