-- WaStruk Receipts Table

CREATE TABLE wastruk.receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receipt_number VARCHAR(50) NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal INTEGER NOT NULL DEFAULT 0,
  tax INTEGER DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  notes TEXT,
  payment_status VARCHAR(20) DEFAULT 'paid', -- paid, unpaid
  image_url TEXT, -- Generated receipt image URL
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_receipts_user_id ON wastruk.receipts(user_id);
CREATE INDEX idx_receipts_payment_status ON wastruk.receipts(payment_status);
CREATE INDEX idx_receipts_created_at ON wastruk.receipts(created_at DESC);

-- RLS
ALTER TABLE wastruk.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own receipts" ON wastruk.receipts
  FOR ALL USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON wastruk.receipts
  FOR EACH ROW EXECUTE FUNCTION wastruk.update_updated_at();

-- Function to increment receipt count
CREATE OR REPLACE FUNCTION wastruk.increment_receipts_used(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE wastruk.profiles
  SET receipts_used = receipts_used + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check receipt limit
CREATE OR REPLACE FUNCTION wastruk.check_receipt_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_used INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT receipts_used, receipts_limit
  INTO v_used, v_limit
  FROM wastruk.profiles
  WHERE id = p_user_id;

  -- -1 means unlimited
  IF v_limit = -1 THEN
    RETURN TRUE;
  END IF;

  RETURN v_used < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
