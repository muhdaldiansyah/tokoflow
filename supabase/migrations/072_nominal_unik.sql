-- Nominal Unik: add unique 3-digit code for transfer amount matching
-- Each order gets a random code (1-999) so transfer_amount = total + unique_code
-- This makes matching bank mutations to orders trivial (1 amount = 1 order)

-- Unique code per order (1-999, nullable for backward compat)
ALTER TABLE orders ADD COLUMN unique_code SMALLINT;

-- Generated stored column: the actual amount customer must transfer
-- Auto-computes from total + unique_code. Existing orders: transfer_amount = total.
ALTER TABLE orders ADD COLUMN transfer_amount INTEGER
  GENERATED ALWAYS AS (total + COALESCE(unique_code, 0)) STORED;

-- Partial index for fast lookup: seller searches by transfer amount on unpaid orders
CREATE INDEX idx_orders_transfer_amount
  ON orders(user_id, transfer_amount)
  WHERE deleted_at IS NULL AND payment_status != 'paid';
