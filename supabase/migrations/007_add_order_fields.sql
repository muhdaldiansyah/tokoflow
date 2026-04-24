-- Add order tracking fields to profiles and plans

-- Add orders_used and orders_limit to profiles
ALTER TABLE wastruk.profiles
  ADD COLUMN orders_used INTEGER DEFAULT 0,
  ADD COLUMN orders_limit INTEGER DEFAULT 50;

-- Add orders_limit to plans
ALTER TABLE wastruk.plans
  ADD COLUMN orders_limit INTEGER DEFAULT 50;

-- Update plan limits and prices
UPDATE wastruk.plans SET
  orders_limit = 50,
  features = '["50 pesanan/bulan", "10 struk/bulan", "Foto nota otomatis", "Kirim ke WhatsApp"]'
WHERE code = 'gratis';

UPDATE wastruk.plans SET
  orders_limit = 300,
  price_monthly = 49000,
  price_yearly = 470000,
  features = '["300 pesanan/bulan", "100 struk/bulan", "Kelola pelanggan", "Rekap harian", "Pengingat pembayaran", "Riwayat 30 hari"]'
WHERE code = 'warung';

UPDATE wastruk.plans SET
  orders_limit = -1,
  price_monthly = 99000,
  price_yearly = 950000,
  features = '["Pesanan unlimited", "Struk unlimited", "Kelola pelanggan", "Rekap harian", "Pengingat pembayaran", "Riwayat unlimited", "Export CSV/Excel"]'
WHERE code = 'toko';
