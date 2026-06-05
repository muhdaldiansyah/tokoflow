-- =============================================================
-- CatatOrder: Combined Migration for PUBLIC schema
-- Run this in Supabase SQL Editor on the new dedicated instance
-- =============================================================

-- ==========================================
-- 001: Profiles
-- ==========================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  email TEXT NOT NULL,
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'user',
  business_name VARCHAR(255),
  business_address TEXT,
  business_phone VARCHAR(20),
  logo_url TEXT,
  receipts_used INTEGER DEFAULT 0,
  receipts_limit INTEGER DEFAULT 10,
  orders_used INTEGER DEFAULT 0,
  orders_limit INTEGER DEFAULT 150,
  plan VARCHAR(20) DEFAULT 'gratis',
  plan_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at trigger function (reused by all tables)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- 002: Receipts
-- ==========================================

CREATE TABLE receipts (
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
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_payment_status ON receipts(payment_status);
CREATE INDEX idx_receipts_created_at ON receipts(created_at DESC);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own receipts" ON receipts
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_receipts_updated_at
  BEFORE UPDATE ON receipts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to increment receipt count
CREATE OR REPLACE FUNCTION increment_receipts_used(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET receipts_used = receipts_used + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check receipt limit
CREATE OR REPLACE FUNCTION check_receipt_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_used INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT receipts_used, receipts_limit
  INTO v_used, v_limit
  FROM profiles
  WHERE id = p_user_id;

  IF v_limit = -1 THEN
    RETURN TRUE;
  END IF;

  RETURN v_used < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 003: Reminders
-- ==========================================

CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending',
  fonnte_response JSONB,
  message_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reminders_status ON reminders(status);
CREATE INDEX idx_reminders_scheduled ON reminders(scheduled_at);
CREATE INDEX idx_reminders_receipt_id ON reminders(receipt_id);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders" ON reminders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = reminders.receipt_id
      AND receipts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reminders for own receipts" ON reminders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = receipt_id
      AND receipts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own reminders" ON reminders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = reminders.receipt_id
      AND receipts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own reminders" ON reminders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM receipts
      WHERE receipts.id = reminders.receipt_id
      AND receipts.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- 004: Plans
-- ==========================================

CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  price_monthly INTEGER DEFAULT 0,
  price_yearly INTEGER DEFAULT 0,
  receipts_limit INTEGER DEFAULT 10,
  orders_limit INTEGER DEFAULT 150,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plans" ON plans
  FOR SELECT USING (is_active = TRUE);

INSERT INTO plans (code, name, description, price_monthly, price_yearly, receipts_limit, orders_limit, features) VALUES
  ('gratis', 'Gratis', 'Coba gratis untuk UMKM', 0, 0, 10, 150, '["150 pesanan/bulan", "10 struk/bulan", "Foto nota otomatis", "Kirim ke WhatsApp"]'),
  ('warung', 'Warung', 'Untuk warung dan usaha kecil', 49000, 470000, 100, 300, '["300 pesanan/bulan", "100 struk/bulan", "Kelola pelanggan", "Rekap harian", "Pengingat pembayaran", "Riwayat 30 hari"]'),
  ('toko', 'Toko', 'Untuk toko dan usaha menengah', 99000, 950000, -1, -1, '["Pesanan unlimited", "Struk unlimited", "Kelola pelanggan", "Rekap harian", "Pengingat pembayaran", "Riwayat unlimited", "Export CSV/Excel"]');

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- 005: Customers
-- ==========================================

CREATE TABLE customers (
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

CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_phone ON customers(user_id, phone);
CREATE UNIQUE INDEX idx_customers_user_phone ON customers(user_id, phone) WHERE phone IS NOT NULL;

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own customers" ON customers
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ==========================================
-- 006: Orders
-- ==========================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_number VARCHAR(50) NOT NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(20),
  items JSONB NOT NULL DEFAULT '[]',
  subtotal INTEGER NOT NULL DEFAULT 0,
  discount INTEGER DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  source VARCHAR(20) DEFAULT 'manual',
  status VARCHAR(20) DEFAULT 'new',
  payment_status VARCHAR(20) DEFAULT 'unpaid',
  shipped_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own orders" ON orders
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to increment order count
CREATE OR REPLACE FUNCTION increment_orders_used(p_user_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET orders_used = orders_used + 1
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check order limit
CREATE OR REPLACE FUNCTION check_order_limit(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_used INTEGER;
  v_limit INTEGER;
BEGIN
  SELECT orders_used, orders_limit
  INTO v_used, v_limit
  FROM profiles
  WHERE id = p_user_id;

  IF v_limit = -1 THEN
    RETURN TRUE;
  END IF;

  RETURN v_used < v_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- GRANT permissions to anon and authenticated
-- ==========================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Ensure future tables also get permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO anon, authenticated;
