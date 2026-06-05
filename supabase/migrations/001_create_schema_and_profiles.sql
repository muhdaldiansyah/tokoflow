-- WaStruk Schema and Profiles
-- Create schema and profiles table

CREATE SCHEMA IF NOT EXISTS wastruk;

-- Profiles table (extends auth.users)
CREATE TABLE wastruk.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255),
  email TEXT NOT NULL,
  avatar_url TEXT,
  role VARCHAR(20) DEFAULT 'user',
  business_name VARCHAR(255),
  business_address TEXT,
  business_phone VARCHAR(20),
  logo_url TEXT,
  receipts_used INTEGER DEFAULT 0,
  receipts_limit INTEGER DEFAULT 10,
  plan VARCHAR(20) DEFAULT 'gratis',
  plan_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE wastruk.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON wastruk.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON wastruk.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON wastruk.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION wastruk.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO wastruk.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Error creating wastruk profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE OR REPLACE TRIGGER on_auth_user_created_wastruk
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION wastruk.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION wastruk.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON wastruk.profiles
  FOR EACH ROW EXECUTE FUNCTION wastruk.update_updated_at();
