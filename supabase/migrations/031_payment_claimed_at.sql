-- Add payment_claimed_at column to orders
-- Records when customer tapped "Sudah Bayar" (claim, not proof)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_claimed_at timestamptz DEFAULT NULL;
