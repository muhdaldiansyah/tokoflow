-- Migration 069: Communities / Pasar mode
-- Enables community-based distribution (KAKIS 6/25 → 19/25)

-- Generate random invite code (same pattern as referral_code)
CREATE OR REPLACE FUNCTION generate_community_invite_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  LOOP
    result := '';
    FOR i IN 1..6 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM communities WHERE invite_code = result) THEN
      RETURN result;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Communities table
CREATE TABLE IF NOT EXISTS communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  organizer_id UUID NOT NULL REFERENCES auth.users(id),
  invite_code TEXT UNIQUE NOT NULL DEFAULT generate_community_invite_code(),
  city TEXT,
  city_slug TEXT,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  event_date_start DATE,
  event_date_end DATE,
  member_count INTEGER DEFAULT 1,
  total_orders INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_communities_slug ON communities(slug) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_communities_organizer ON communities(organizer_id);
CREATE INDEX IF NOT EXISTS idx_communities_city ON communities(city_slug) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_communities_invite_code ON communities(invite_code);

-- Community members
CREATE TABLE IF NOT EXISTS community_members (
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (community_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_members_user ON community_members(user_id);

-- Add community_id to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS community_id UUID REFERENCES communities(id);
CREATE INDEX IF NOT EXISTS idx_profiles_community ON profiles(community_id) WHERE community_id IS NOT NULL;

-- RLS: communities
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active communities"
  ON communities FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create communities"
  ON communities FOR INSERT WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their communities"
  ON communities FOR UPDATE USING (auth.uid() = organizer_id);

-- RLS: community_members
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view community members"
  ON community_members FOR SELECT USING (true);

CREATE POLICY "Users can join communities"
  ON community_members FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities"
  ON community_members FOR DELETE USING (auth.uid() = user_id);

-- Trigger: update member_count on join/leave
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities SET member_count = (
      SELECT COUNT(*) FROM community_members WHERE community_id = NEW.community_id
    ), updated_at = now() WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities SET member_count = (
      SELECT COUNT(*) FROM community_members WHERE community_id = OLD.community_id
    ), updated_at = now() WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_community_member_count
  AFTER INSERT OR DELETE ON community_members
  FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- Comments
COMMENT ON TABLE communities IS 'UMKM communities (pasar, bazaar, WA groups). Core distribution mechanism.';
COMMENT ON TABLE community_members IS 'Community membership tracking.';
COMMENT ON COLUMN profiles.community_id IS 'Primary community for store page badge and attribution.';
