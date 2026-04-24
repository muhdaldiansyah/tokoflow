-- WaStruk Orders Table

CREATE TABLE wastruk.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number VARCHAR(50) NOT NULL,
  customer_id UUID REFERENCES wastruk.customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal INTEGER NOT NULL DEFAULT 0,
  discount INTEGER DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  source VARCHAR(20) DEFAULT 'manual', -- manual, whatsapp
  status VARCHAR(20) DEFAULT 'new', -- new, processed, shipped, done, cancelled
  payment_status VARCHAR(20) DEFAULT 'unpaid', -- paid, unpaid
  shipped_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_orders_user_id ON wastruk.orders(user_id);
CREATE INDEX idx_orders_status ON wastruk.orders(status);
CREATE INDEX idx_orders_customer_id ON wastruk.orders(customer_id);
CREATE INDEX idx_orders_created_at ON wastruk.orders(created_at DESC);

-- RLS
ALTER TABLE wastruk.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own orders" ON wastruk.orders
  FOR ALL USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON wastruk.orders
  FOR EACH ROW EXECUTE FUNCTION wastruk.update_updated_at();

-- Function to increment order count
CREATE OR REPLACE FUNCTION wastruk.increment_orders_used(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE wastruk.profiles
  SET orders_used = orders_used + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check order limit
CREATE OR REPLACE FUNCTION wastruk.check_order_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_used INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT orders_used, orders_limit
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
