-- Migration 075: Add overhead_estimate_pct to business_categories
-- So each category has its own default overhead, auto-applied when user picks a category
ALTER TABLE business_categories ADD COLUMN IF NOT EXISTS overhead_estimate_pct NUMERIC(4,1) DEFAULT 30.0;

UPDATE business_categories SET overhead_estimate_pct = CASE id
  WHEN 'katering' THEN 45
  WHEN 'bakery' THEN 40
  WHEN 'kue-custom' THEN 40
  WHEN 'warung-makan' THEN 50
  WHEN 'snack-box' THEN 35
  WHEN 'minuman' THEN 40
  WHEN 'frozen-food' THEN 35
  WHEN 'konveksi' THEN 25
  WHEN 'percetakan' THEN 25
  WHEN 'furniture' THEN 30
  WHEN 'kerajinan' THEN 30
  WHEN 'mua' THEN 30
  WHEN 'fotografer' THEN 25
  WHEN 'wedding-eo' THEN 30
  WHEN 'desain' THEN 20
  WHEN 'laundry' THEN 35
  WHEN 'tailor' THEN 25
  WHEN 'kosmetik' THEN 25
  WHEN 'grosir' THEN 20
  WHEN 'toko-bangunan' THEN 15
  WHEN 'sembako' THEN 15
  WHEN 'pulsa' THEN 10
  WHEN 'tanaman' THEN 20
  WHEN 'elektronik' THEN 20
  WHEN 'otomotif' THEN 25
  WHEN 'rental' THEN 20
  WHEN 'pendidikan' THEN 20
  WHEN 'lainnya' THEN 30
  ELSE 30
END;
