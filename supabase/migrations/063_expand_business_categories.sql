-- Migration 063: Expand business categories from 8 to 16
-- Based on UMKM type research (75 types, 36 scored) — cover Tier 1+2 non-F&B

-- Update existing "Frozen Food" label
UPDATE business_categories SET label = 'Frozen Food & Makanan Olahan' WHERE id = 'frozen-food';

-- Update "Lainnya" sort order to always be last
UPDATE business_categories SET sort_order = 99 WHERE id = 'lainnya';
UPDATE business_categories SET label = 'Jasa & Lainnya' WHERE id = 'lainnya';

-- Insert 8 new non-F&B categories
INSERT INTO business_categories (id, label, sort_order) VALUES
  ('konveksi', 'Konveksi & Fashion Custom', 8),
  ('percetakan', 'Percetakan & Sablon', 9),
  ('kerajinan', 'Kerajinan & Souvenir', 10),
  ('furniture', 'Furniture & Interior', 11),
  ('fotografer', 'Fotografer & Videografer', 12),
  ('mua', 'MUA & Kecantikan', 13),
  ('wedding-eo', 'Wedding & Event Organizer', 14),
  ('grosir', 'Grosir & Supplier', 15)
ON CONFLICT (id) DO NOTHING;
