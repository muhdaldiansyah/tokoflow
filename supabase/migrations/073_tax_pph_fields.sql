-- Tax PPh Final fields for UMKM
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wp_type TEXT DEFAULT 'op'
  CHECK (wp_type IN ('op', 'badan', 'pt_perorangan'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS wp_registered_year INT;
