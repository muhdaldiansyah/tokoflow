-- 068: Provinces & Cities normalization
-- Creates provinces table, adds province_id FK to cities, adds city_id FK to profiles
-- Data already seeded via Management API (34 provinces, 514 cities)

-- 1. Create provinces lookup table
CREATE TABLE IF NOT EXISTS provinces (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_provinces_slug ON provinces(slug);

-- 2. Add province_id FK to cities (replacing text province column)
ALTER TABLE cities ADD COLUMN IF NOT EXISTS province_id integer REFERENCES provinces(id);
CREATE INDEX IF NOT EXISTS idx_cities_province_id ON cities(province_id);
ALTER TABLE cities DROP COLUMN IF EXISTS province;

-- 3. Add city_id FK to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city_id integer REFERENCES cities(id);
CREATE INDEX IF NOT EXISTS idx_profiles_city_id ON profiles(city_id);

-- 4. RLS policies
ALTER TABLE provinces ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'provinces' AND policyname = 'Public read provinces') THEN
    CREATE POLICY "Public read provinces" ON provinces FOR SELECT USING (true);
  END IF;
END $$;
