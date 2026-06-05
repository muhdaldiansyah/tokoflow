-- Migration 062: Lookup tables for categories, units, and cities
-- Replaces hardcoded constants with DB-driven data.
-- Both web and mobile fetch from these tables via API.

-- Business Categories
CREATE TABLE IF NOT EXISTS business_categories (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  icon TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO business_categories (id, label, sort_order) VALUES
  ('katering', 'Katering & Nasi Box', 1),
  ('bakery', 'Bakery & Roti', 2),
  ('kue-custom', 'Kue Custom & Tart', 3),
  ('warung-makan', 'Warung Makan & Kedai', 4),
  ('snack-box', 'Snack Box & Hampers', 5),
  ('minuman', 'Minuman & Kopi', 6),
  ('frozen-food', 'Frozen Food', 7),
  ('lainnya', 'Lainnya', 99)
ON CONFLICT (id) DO NOTHING;

-- Product Units
CREATE TABLE IF NOT EXISTS product_units (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO product_units (id, label, sort_order) VALUES
  ('porsi', 'porsi', 1),
  ('box', 'box', 2),
  ('pcs', 'pcs', 3),
  ('loyang', 'loyang', 4),
  ('kg', 'kg', 5),
  ('pack', 'pack', 6),
  ('botol', 'botol', 7),
  ('gelas', 'gelas', 8),
  ('lembar', 'lembar', 9),
  ('batang', 'batang', 10)
ON CONFLICT (id) DO NOTHING;

-- Cities (starts empty, filled organically as merchants register)
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  province TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug) WHERE is_active = true;

-- RLS: public read on all lookup tables
ALTER TABLE business_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories" ON business_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can read units" ON product_units FOR SELECT USING (true);
CREATE POLICY "Anyone can read cities" ON cities FOR SELECT USING (true);

-- Admin write policies (role = admin in profiles)
CREATE POLICY "Admin can manage categories" ON business_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can manage units" ON product_units FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can manage cities" ON cities FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
