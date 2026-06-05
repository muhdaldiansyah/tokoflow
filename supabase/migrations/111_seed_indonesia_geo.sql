-- Migration 111: Indonesia lookup data (Tokoflow deployment).
--
-- Migration 080 relabeled the CatatOrder Indonesian lookup rows to Malaysia
-- English and seeded 44 MY cities / 16 MY states. Tokoflow operates in
-- Indonesia, so this migration:
--   1. Relabels business_categories + product_units back to Bahasa Indonesia
--      (IDs are stable — read by ~16 call sites — only labels change).
--   2. Deactivates the MY provinces/cities (kept in-table for the dormant MY
--      path; lookup queries filter is_active = true so they disappear).
--   3. Seeds 38 Indonesian provinces + major cities, tagged country_code = 'ID'.
--
-- Idempotent: re-running is a no-op.

-- ============================================================================
-- 1. business_categories — Bahasa Indonesia labels
-- ============================================================================
UPDATE business_categories SET label = 'Katering & Nasi Box'       WHERE id = 'katering';
UPDATE business_categories SET label = 'Bakery & Roti'             WHERE id = 'bakery';
UPDATE business_categories SET label = 'Kue Custom & Tart'         WHERE id = 'kue-custom';
UPDATE business_categories SET label = 'Snack Box & Hampers'       WHERE id = 'snack-box';
UPDATE business_categories SET label = 'Frozen Food'               WHERE id = 'frozen-food';
UPDATE business_categories SET label = 'Warung Makan & Kedai'      WHERE id = 'warung-makan';
UPDATE business_categories SET label = 'Minuman & Kopi'            WHERE id = 'minuman';
UPDATE business_categories SET label = 'Konveksi & Sablon'         WHERE id = 'konveksi';
UPDATE business_categories SET label = 'Percetakan & Signage'      WHERE id = 'percetakan';
UPDATE business_categories SET label = 'Kerajinan & Suvenir'       WHERE id = 'kerajinan';
UPDATE business_categories SET label = 'Furniture & Interior'      WHERE id = 'furniture';
UPDATE business_categories SET label = 'Fotografi & Videografi'    WHERE id = 'fotografer';
UPDATE business_categories SET label = 'MUA & Kecantikan'          WHERE id = 'mua';
UPDATE business_categories SET label = 'Wedding & Event Organizer' WHERE id = 'wedding-eo';
UPDATE business_categories SET label = 'Grosir & Supplier'         WHERE id = 'grosir';
UPDATE business_categories SET label = 'Lainnya'                   WHERE id = 'lainnya';
-- Service categories added by migration 080
UPDATE business_categories SET label = 'Penjahit & Permak'   WHERE id = 'tailor';
UPDATE business_categories SET label = 'Kosmetik & Skincare' WHERE id = 'kosmetik';
UPDATE business_categories SET label = 'Laundry & Cuci'      WHERE id = 'laundry';
UPDATE business_categories SET label = 'Sewa Peralatan'      WHERE id = 'rental';
UPDATE business_categories SET label = 'Servis Elektronik'   WHERE id = 'elektronik';
UPDATE business_categories SET label = 'Servis Otomotif'     WHERE id = 'otomotif';
UPDATE business_categories SET label = 'Les & Pendidikan'    WHERE id = 'pendidikan';
UPDATE business_categories SET label = 'Jasa Desain'         WHERE id = 'desain';

-- ============================================================================
-- 2. product_units — Bahasa Indonesia labels
-- ============================================================================
UPDATE product_units SET label = 'porsi'  WHERE id = 'porsi';
UPDATE product_units SET label = 'box'    WHERE id = 'box';
UPDATE product_units SET label = 'pcs'    WHERE id = 'pcs';
UPDATE product_units SET label = 'loyang' WHERE id = 'loyang';
UPDATE product_units SET label = 'kg'     WHERE id = 'kg';
UPDATE product_units SET label = 'pak'    WHERE id = 'pack';
UPDATE product_units SET label = 'botol'  WHERE id = 'botol';
UPDATE product_units SET label = 'gelas'  WHERE id = 'gelas';
UPDATE product_units SET label = 'lembar' WHERE id = 'lembar';
UPDATE product_units SET label = 'batang' WHERE id = 'batang';
UPDATE product_units SET label = 'set'    WHERE id = 'set';
UPDATE product_units SET label = 'cup'    WHERE id = 'cup';
UPDATE product_units SET label = 'dus'    WHERE id = 'carton';
UPDATE product_units SET label = 'liter'  WHERE id = 'litre';
UPDATE product_units SET label = 'paket'  WHERE id = 'package';
UPDATE product_units SET label = 'sesi'   WHERE id = 'session';
UPDATE product_units SET label = 'jam'    WHERE id = 'hour';

-- ============================================================================
-- 3. Deactivate the Malaysia geo rows (dormant MY path)
-- ============================================================================
UPDATE cities    SET is_active = false WHERE country_code = 'MY';
UPDATE provinces SET is_active = false WHERE country_code = 'MY';

-- ============================================================================
-- 4. Seed Indonesian provinces (Java first — bulk of UMKM)
-- ============================================================================
INSERT INTO provinces (name, slug, sort_order, is_active, country_code) VALUES
  ('DKI Jakarta',            'dki-jakarta',            1,  true, 'ID'),
  ('Jawa Barat',             'jawa-barat',             2,  true, 'ID'),
  ('Jawa Tengah',            'jawa-tengah',            3,  true, 'ID'),
  ('Jawa Timur',             'jawa-timur',             4,  true, 'ID'),
  ('Banten',                 'banten',                 5,  true, 'ID'),
  ('DI Yogyakarta',          'di-yogyakarta',          6,  true, 'ID'),
  ('Bali',                   'bali',                   7,  true, 'ID'),
  ('Aceh',                   'aceh',                   8,  true, 'ID'),
  ('Sumatera Utara',         'sumatera-utara',         9,  true, 'ID'),
  ('Sumatera Barat',         'sumatera-barat',         10, true, 'ID'),
  ('Riau',                   'riau',                   11, true, 'ID'),
  ('Kepulauan Riau',         'kepulauan-riau',         12, true, 'ID'),
  ('Jambi',                  'jambi',                  13, true, 'ID'),
  ('Sumatera Selatan',       'sumatera-selatan',       14, true, 'ID'),
  ('Bangka Belitung',        'bangka-belitung',        15, true, 'ID'),
  ('Bengkulu',               'bengkulu',               16, true, 'ID'),
  ('Lampung',                'lampung',                17, true, 'ID'),
  ('Kalimantan Barat',       'kalimantan-barat',       18, true, 'ID'),
  ('Kalimantan Tengah',      'kalimantan-tengah',      19, true, 'ID'),
  ('Kalimantan Selatan',     'kalimantan-selatan',     20, true, 'ID'),
  ('Kalimantan Timur',       'kalimantan-timur',       21, true, 'ID'),
  ('Kalimantan Utara',       'kalimantan-utara',       22, true, 'ID'),
  ('Sulawesi Utara',         'sulawesi-utara',         23, true, 'ID'),
  ('Sulawesi Tengah',        'sulawesi-tengah',        24, true, 'ID'),
  ('Sulawesi Selatan',       'sulawesi-selatan',       25, true, 'ID'),
  ('Sulawesi Tenggara',      'sulawesi-tenggara',      26, true, 'ID'),
  ('Gorontalo',              'gorontalo',              27, true, 'ID'),
  ('Sulawesi Barat',         'sulawesi-barat',         28, true, 'ID'),
  ('Nusa Tenggara Barat',    'nusa-tenggara-barat',    29, true, 'ID'),
  ('Nusa Tenggara Timur',    'nusa-tenggara-timur',    30, true, 'ID'),
  ('Maluku',                 'maluku',                 31, true, 'ID'),
  ('Maluku Utara',           'maluku-utara',           32, true, 'ID'),
  ('Papua',                  'papua',                  33, true, 'ID'),
  ('Papua Barat',            'papua-barat',            34, true, 'ID'),
  ('Papua Selatan',          'papua-selatan',          35, true, 'ID'),
  ('Papua Tengah',           'papua-tengah',           36, true, 'ID'),
  ('Papua Pegunungan',       'papua-pegunungan',       37, true, 'ID'),
  ('Papua Barat Daya',       'papua-barat-daya',       38, true, 'ID')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  country_code = EXCLUDED.country_code;

-- ============================================================================
-- 5. Seed major Indonesian cities (joined to provinces by slug)
-- ============================================================================
INSERT INTO cities (name, slug, province_id, is_active, country_code)
SELECT v.name, v.slug, p.id, true, 'ID'
FROM (VALUES
  -- DKI Jakarta
  ('Jakarta Pusat',     'jakarta-pusat',     'dki-jakarta'),
  ('Jakarta Selatan',   'jakarta-selatan',   'dki-jakarta'),
  ('Jakarta Barat',     'jakarta-barat',     'dki-jakarta'),
  ('Jakarta Timur',     'jakarta-timur',     'dki-jakarta'),
  ('Jakarta Utara',     'jakarta-utara',     'dki-jakarta'),
  -- Jawa Barat
  ('Bandung',           'bandung',           'jawa-barat'),
  ('Bekasi',            'bekasi',            'jawa-barat'),
  ('Depok',             'depok',             'jawa-barat'),
  ('Bogor',             'bogor',             'jawa-barat'),
  ('Cimahi',            'cimahi',            'jawa-barat'),
  ('Cirebon',           'cirebon',           'jawa-barat'),
  ('Sukabumi',          'sukabumi',          'jawa-barat'),
  ('Tasikmalaya',       'tasikmalaya',       'jawa-barat'),
  ('Garut',             'garut',             'jawa-barat'),
  ('Karawang',          'karawang',          'jawa-barat'),
  -- Jawa Tengah
  ('Semarang',          'semarang',          'jawa-tengah'),
  ('Surakarta (Solo)',  'surakarta',         'jawa-tengah'),
  ('Magelang',          'magelang',          'jawa-tengah'),
  ('Salatiga',          'salatiga',          'jawa-tengah'),
  ('Pekalongan',        'pekalongan',        'jawa-tengah'),
  ('Tegal',             'tegal',             'jawa-tengah'),
  ('Purwokerto',        'purwokerto',        'jawa-tengah'),
  ('Kudus',             'kudus',             'jawa-tengah'),
  -- Jawa Timur
  ('Surabaya',          'surabaya',          'jawa-timur'),
  ('Malang',            'malang',            'jawa-timur'),
  ('Sidoarjo',          'sidoarjo',          'jawa-timur'),
  ('Gresik',            'gresik',            'jawa-timur'),
  ('Kediri',            'kediri',            'jawa-timur'),
  ('Madiun',            'madiun',            'jawa-timur'),
  ('Blitar',            'blitar',            'jawa-timur'),
  ('Mojokerto',         'mojokerto',         'jawa-timur'),
  ('Probolinggo',       'probolinggo',       'jawa-timur'),
  ('Jember',            'jember',            'jawa-timur'),
  ('Banyuwangi',        'banyuwangi',        'jawa-timur'),
  -- Banten
  ('Tangerang',         'tangerang',         'banten'),
  ('Tangerang Selatan', 'tangerang-selatan', 'banten'),
  ('Serang',            'serang',            'banten'),
  ('Cilegon',           'cilegon',           'banten'),
  -- DI Yogyakarta
  ('Yogyakarta',        'yogyakarta',        'di-yogyakarta'),
  ('Sleman',            'sleman',            'di-yogyakarta'),
  ('Bantul',            'bantul',            'di-yogyakarta'),
  -- Bali
  ('Denpasar',          'denpasar',          'bali'),
  ('Badung (Kuta)',     'badung',            'bali'),
  ('Gianyar (Ubud)',    'gianyar',           'bali'),
  ('Singaraja',         'singaraja',         'bali'),
  -- Aceh
  ('Banda Aceh',        'banda-aceh',        'aceh'),
  ('Lhokseumawe',       'lhokseumawe',       'aceh'),
  -- Sumatera Utara
  ('Medan',             'medan',             'sumatera-utara'),
  ('Binjai',            'binjai',            'sumatera-utara'),
  ('Pematangsiantar',   'pematangsiantar',   'sumatera-utara'),
  -- Sumatera Barat
  ('Padang',            'padang',            'sumatera-barat'),
  ('Bukittinggi',       'bukittinggi',       'sumatera-barat'),
  -- Riau
  ('Pekanbaru',         'pekanbaru',         'riau'),
  ('Dumai',             'dumai',             'riau'),
  -- Kepulauan Riau
  ('Batam',             'batam',             'kepulauan-riau'),
  ('Tanjung Pinang',    'tanjung-pinang',    'kepulauan-riau'),
  -- Jambi
  ('Jambi',             'jambi-kota',        'jambi'),
  -- Sumatera Selatan
  ('Palembang',         'palembang',         'sumatera-selatan'),
  ('Lubuklinggau',      'lubuklinggau',      'sumatera-selatan'),
  -- Bangka Belitung
  ('Pangkal Pinang',    'pangkal-pinang',    'bangka-belitung'),
  -- Bengkulu
  ('Bengkulu',          'bengkulu-kota',     'bengkulu'),
  -- Lampung
  ('Bandar Lampung',    'bandar-lampung',    'lampung'),
  ('Metro',             'metro',             'lampung'),
  -- Kalimantan Barat
  ('Pontianak',         'pontianak',         'kalimantan-barat'),
  ('Singkawang',        'singkawang',        'kalimantan-barat'),
  -- Kalimantan Tengah
  ('Palangka Raya',     'palangka-raya',     'kalimantan-tengah'),
  -- Kalimantan Selatan
  ('Banjarmasin',       'banjarmasin',       'kalimantan-selatan'),
  ('Banjarbaru',        'banjarbaru',        'kalimantan-selatan'),
  -- Kalimantan Timur
  ('Samarinda',         'samarinda',         'kalimantan-timur'),
  ('Balikpapan',        'balikpapan',        'kalimantan-timur'),
  ('Bontang',           'bontang',           'kalimantan-timur'),
  -- Kalimantan Utara
  ('Tarakan',           'tarakan',           'kalimantan-utara'),
  -- Sulawesi Utara
  ('Manado',            'manado',            'sulawesi-utara'),
  ('Bitung',            'bitung',            'sulawesi-utara'),
  -- Sulawesi Tengah
  ('Palu',              'palu',              'sulawesi-tengah'),
  -- Sulawesi Selatan
  ('Makassar',          'makassar',          'sulawesi-selatan'),
  ('Parepare',          'parepare',          'sulawesi-selatan'),
  -- Sulawesi Tenggara
  ('Kendari',           'kendari',           'sulawesi-tenggara'),
  -- Gorontalo
  ('Gorontalo',         'gorontalo-kota',    'gorontalo'),
  -- Sulawesi Barat
  ('Mamuju',            'mamuju',            'sulawesi-barat'),
  -- Nusa Tenggara Barat
  ('Mataram',           'mataram',           'nusa-tenggara-barat'),
  ('Bima',              'bima',              'nusa-tenggara-barat'),
  -- Nusa Tenggara Timur
  ('Kupang',            'kupang',            'nusa-tenggara-timur'),
  -- Maluku
  ('Ambon',             'ambon',             'maluku'),
  -- Maluku Utara
  ('Ternate',           'ternate',           'maluku-utara'),
  -- Papua
  ('Jayapura',          'jayapura',          'papua'),
  -- Papua Barat
  ('Manokwari',         'manokwari',         'papua-barat'),
  -- Papua Barat Daya
  ('Sorong',            'sorong',            'papua-barat-daya')
) AS v(name, slug, prov_slug)
JOIN provinces p ON p.slug = v.prov_slug
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  province_id = EXCLUDED.province_id,
  is_active = EXCLUDED.is_active,
  country_code = EXCLUDED.country_code;
