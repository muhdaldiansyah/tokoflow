-- WaStruk Customers Table

CREATE TABLE wastruk.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  notes TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  last_order_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_customers_user_id ON wastruk.customers(user_id);
CREATE INDEX idx_customers_phone ON wastruk.customers(user_id, phone);
CREATE UNIQUE INDEX idx_customers_user_phone ON wastruk.customers(user_id, phone) WHERE phone IS NOT NULL;

-- RLS
ALTER TABLE wastruk.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own customers" ON wastruk.customers
  FOR ALL USING (auth.uid() = user_id);

-- Updated_at trigger
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON wastruk.customers
  FOR EACH ROW EXECUTE FUNCTION wastruk.update_updated_at();
