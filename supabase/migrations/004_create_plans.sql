-- WaStruk Plans Table

CREATE TABLE wastruk.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  price_monthly INTEGER DEFAULT 0,
  price_yearly INTEGER DEFAULT 0,
  receipts_limit INTEGER DEFAULT 10, -- -1 for unlimited
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS (public read)
ALTER TABLE wastruk.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plans" ON wastruk.plans
  FOR SELECT USING (is_active = TRUE);

-- Seed default plans
INSERT INTO wastruk.plans (code, name, description, price_monthly, price_yearly, receipts_limit, features) VALUES
  ('gratis', 'Gratis', 'Coba gratis untuk 10 struk', 0, 0, 10, '["10 struk/bulan", "Foto nota otomatis", "Kirim ke WhatsApp"]'),
  ('warung', 'Warung', 'Untuk warung dan usaha kecil', 29000, 278000, 100, '["100 struk/bulan", "Foto nota otomatis", "Kirim ke WhatsApp", "Pengingat pembayaran", "Riwayat struk 30 hari"]'),
  ('toko', 'Toko', 'Untuk toko dan usaha menengah', 79000, 758000, -1, '["Struk unlimited", "Foto nota otomatis", "Kirim ke WhatsApp", "Pengingat pembayaran", "Riwayat struk unlimited", "Export CSV/Excel"]');

-- Updated_at trigger
CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON wastruk.plans
  FOR EACH ROW EXECUTE FUNCTION wastruk.update_updated_at();
