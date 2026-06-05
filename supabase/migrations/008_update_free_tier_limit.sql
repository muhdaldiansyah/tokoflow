-- Update free tier order limit from 50 to 150
-- Rationale: 50 orders runs out in 5-10 days for a small warung (5-10 orders/day)
-- 150 gives users ~1 full month to get hooked before hitting limit

-- Update default for new profiles
ALTER TABLE wastruk.profiles ALTER COLUMN orders_limit SET DEFAULT 150;

-- Update default for plans table
ALTER TABLE wastruk.plans ALTER COLUMN orders_limit SET DEFAULT 150;

-- Update existing gratis plan
UPDATE wastruk.plans SET
  orders_limit = 150,
  features = '["150 pesanan/bulan", "10 struk/bulan", "Foto nota otomatis", "Kirim ke WhatsApp"]'
WHERE code = 'gratis';

-- Update existing gratis profiles that still have the old 50 limit
UPDATE wastruk.profiles SET orders_limit = 150 WHERE orders_limit = 50 AND plan = 'gratis';
