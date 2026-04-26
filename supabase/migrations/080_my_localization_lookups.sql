-- 080: Malaysia localization for lookup tables
-- Replaces leftover Indonesian labels in business_categories + product_units
-- (inherited from CatatOrder fork) with MY-native English labels, expands the
-- category picker to cover every ID `category-defaults.ts` already has defaults
-- for, and seeds the empty provinces + cities tables from `config/my-cities.ts`.
--
-- Idempotent: re-running this migration is a no-op.

------------------------------------------------------------------------
-- 1. business_categories — relabel ID rows + add MY service categories
------------------------------------------------------------------------

-- Relabel existing rows. IDs stay stable (read by 16 call sites).
UPDATE business_categories SET label = 'Catering & Nasi Box',         sort_order = 1  WHERE id = 'katering';
UPDATE business_categories SET label = 'Bakery & Bread',              sort_order = 2  WHERE id = 'bakery';
UPDATE business_categories SET label = 'Custom Cake & Kuih',          sort_order = 3  WHERE id = 'kue-custom';
UPDATE business_categories SET label = 'Snack Box & Hampers',         sort_order = 4  WHERE id = 'snack-box';
UPDATE business_categories SET label = 'Frozen Food',                 sort_order = 5  WHERE id = 'frozen-food';
UPDATE business_categories SET label = 'Kopitiam & Food Stall',       sort_order = 6  WHERE id = 'warung-makan';
UPDATE business_categories SET label = 'Drinks & Coffee',             sort_order = 7  WHERE id = 'minuman';
UPDATE business_categories SET label = 'Apparel & Custom Print',      sort_order = 8  WHERE id = 'konveksi';
UPDATE business_categories SET label = 'Printing & Signage',          sort_order = 10 WHERE id = 'percetakan';
UPDATE business_categories SET label = 'Crafts & Souvenir',           sort_order = 11 WHERE id = 'kerajinan';
UPDATE business_categories SET label = 'Furniture & Interior',        sort_order = 12 WHERE id = 'furniture';
UPDATE business_categories SET label = 'Photography & Videography',   sort_order = 14 WHERE id = 'fotografer';
UPDATE business_categories SET label = 'MUA & Beauty',                sort_order = 15 WHERE id = 'mua';
UPDATE business_categories SET label = 'Wedding & Event Planner',     sort_order = 16 WHERE id = 'wedding-eo';
UPDATE business_categories SET label = 'Wholesale & Supplier',        sort_order = 23 WHERE id = 'grosir';
UPDATE business_categories SET label = 'Other Services & Goods',      sort_order = 99 WHERE id = 'lainnya';

-- Add 8 MY service categories (all already have defaults in category-defaults.ts).
INSERT INTO business_categories (id, label, sort_order, is_active) VALUES
  ('tailor',       'Tailor & Alterations',      9,  true),
  ('kosmetik',     'Cosmetics & Skincare',      13, true),
  ('laundry',      'Laundry & Dry Clean',       17, true),
  ('rental',       'Equipment Rental',          18, true),
  ('elektronik',   'Electronics Repair',        19, true),
  ('otomotif',     'Automotive Service',        20, true),
  ('pendidikan',   'Tuition & Education',       21, true),
  ('desain',       'Design Services',           22, true)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

------------------------------------------------------------------------
-- 2. product_units — relabel ID units + add 7 MY-essential units
------------------------------------------------------------------------

-- Relabel existing rows. IDs stay stable in case any product row references them.
UPDATE product_units SET label = 'pax',    sort_order = 1  WHERE id = 'porsi';
UPDATE product_units SET label = 'box',    sort_order = 2  WHERE id = 'box';
UPDATE product_units SET label = 'pcs',    sort_order = 3  WHERE id = 'pcs';
UPDATE product_units SET label = 'tray',   sort_order = 4  WHERE id = 'loyang';
UPDATE product_units SET label = 'kg',     sort_order = 5  WHERE id = 'kg';
UPDATE product_units SET label = 'pack',   sort_order = 6  WHERE id = 'pack';
UPDATE product_units SET label = 'bottle', sort_order = 7  WHERE id = 'botol';
UPDATE product_units SET label = 'glass',  sort_order = 8  WHERE id = 'gelas';
UPDATE product_units SET label = 'sheet',  sort_order = 9  WHERE id = 'lembar';
UPDATE product_units SET label = 'stick',  sort_order = 10 WHERE id = 'batang';

INSERT INTO product_units (id, label, sort_order, is_active) VALUES
  ('set',     'set',     11, true),
  ('cup',     'cup',     12, true),
  ('carton',  'carton',  13, true),
  ('litre',   'litre',   14, true),
  ('package', 'package', 15, true),
  ('session', 'session', 16, true),
  ('hour',    'hour',    17, true)
ON CONFLICT (id) DO UPDATE SET
  label = EXCLUDED.label,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

------------------------------------------------------------------------
-- 3. provinces — seed 16 Malaysian states + federal territories
------------------------------------------------------------------------
-- KL/Selangor surfaced first since the bulk of merchants are in the Klang Valley.

INSERT INTO provinces (name, slug, sort_order, is_active) VALUES
  ('Kuala Lumpur',    'kuala-lumpur',    1,  true),
  ('Selangor',        'selangor',        2,  true),
  ('Penang',          'penang',          3,  true),
  ('Johor',           'johor',           4,  true),
  ('Perak',           'perak',           5,  true),
  ('Sabah',           'sabah',           6,  true),
  ('Sarawak',         'sarawak',         7,  true),
  ('Kedah',           'kedah',           8,  true),
  ('Kelantan',        'kelantan',        9,  true),
  ('Terengganu',      'terengganu',      10, true),
  ('Pahang',          'pahang',          11, true),
  ('Melaka',          'melaka',          12, true),
  ('Negeri Sembilan', 'negeri-sembilan', 13, true),
  ('Perlis',          'perlis',          14, true),
  ('Putrajaya',       'putrajaya',       15, true),
  ('Labuan',          'labuan',          16, true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

------------------------------------------------------------------------
-- 4. cities — seed 43 MY cities mirroring config/my-cities.ts
------------------------------------------------------------------------
-- Sort by name happens at query time; sort_order kept at default 0.
-- province_id resolved via subquery so this works even after IDs shift.

INSERT INTO cities (name, slug, province_id, is_active)
SELECT v.name, v.slug, p.id, true
FROM (VALUES
  -- Kuala Lumpur
  ('Kuala Lumpur',     'kuala-lumpur',     'kuala-lumpur'),
  -- Selangor
  ('Shah Alam',        'shah-alam',        'selangor'),
  ('Petaling Jaya',    'petaling-jaya',    'selangor'),
  ('Subang Jaya',      'subang-jaya',      'selangor'),
  ('Klang',            'klang',            'selangor'),
  ('Kajang',           'kajang',           'selangor'),
  ('Ampang',           'ampang',           'selangor'),
  ('Cheras',           'cheras',           'selangor'),
  ('Puchong',          'puchong',          'selangor'),
  ('Cyberjaya',        'cyberjaya',        'selangor'),
  -- Penang
  ('George Town',      'george-town',      'penang'),
  ('Butterworth',      'butterworth',      'penang'),
  ('Bukit Mertajam',   'bukit-mertajam',   'penang'),
  -- Johor
  ('Johor Bahru',      'johor-bahru',      'johor'),
  ('Muar',             'muar',             'johor'),
  ('Batu Pahat',       'batu-pahat',       'johor'),
  ('Kluang',           'kluang',           'johor'),
  -- Perak
  ('Ipoh',             'ipoh',             'perak'),
  ('Taiping',          'taiping',          'perak'),
  ('Teluk Intan',      'teluk-intan',      'perak'),
  -- Kedah
  ('Alor Setar',       'alor-setar',       'kedah'),
  ('Sungai Petani',    'sungai-petani',    'kedah'),
  ('Langkawi',         'langkawi',         'kedah'),
  ('Kulim',            'kulim',            'kedah'),
  -- Kelantan
  ('Kota Bharu',       'kota-bharu',       'kelantan'),
  -- Terengganu
  ('Kuala Terengganu', 'kuala-terengganu', 'terengganu'),
  ('Kemaman',          'kemaman',          'terengganu'),
  -- Pahang
  ('Kuantan',          'kuantan',          'pahang'),
  ('Temerloh',         'temerloh',         'pahang'),
  ('Bentong',          'bentong',          'pahang'),
  -- Melaka
  ('Melaka',           'melaka',           'melaka'),
  ('Alor Gajah',       'alor-gajah',       'melaka'),
  -- Negeri Sembilan
  ('Seremban',         'seremban',         'negeri-sembilan'),
  ('Port Dickson',     'port-dickson',     'negeri-sembilan'),
  -- Perlis
  ('Kangar',           'kangar',           'perlis'),
  -- Sabah
  ('Kota Kinabalu',    'kota-kinabalu',    'sabah'),
  ('Sandakan',         'sandakan',         'sabah'),
  ('Tawau',            'tawau',            'sabah'),
  -- Sarawak
  ('Kuching',          'kuching',          'sarawak'),
  ('Miri',             'miri',             'sarawak'),
  ('Sibu',             'sibu',             'sarawak'),
  ('Bintulu',          'bintulu',          'sarawak'),
  -- Federal Territories
  ('Labuan',           'labuan',           'labuan'),
  ('Putrajaya',        'putrajaya',        'putrajaya')
) AS v(name, slug, province_slug)
JOIN provinces p ON p.slug = v.province_slug
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  province_id = EXCLUDED.province_id,
  is_active = EXCLUDED.is_active;
