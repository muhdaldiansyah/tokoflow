-- Community announcements: organizer → members info sharing
-- Phase 1 of cooperation infrastructure

CREATE TABLE IF NOT EXISTS community_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id),
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'supplier_alert', 'price_change', 'deal'
  title TEXT NOT NULL,
  body TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_community ON community_announcements(community_id, created_at DESC);

-- RLS
ALTER TABLE community_announcements ENABLE ROW LEVEL SECURITY;

-- Members can view announcements for their communities
CREATE POLICY "Members can view community announcements"
  ON community_announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = community_announcements.community_id
      AND community_members.user_id = auth.uid()
    )
  );

-- Only organizers can post announcements
CREATE POLICY "Organizers can post announcements"
  ON community_announcements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_announcements.community_id
      AND communities.organizer_id = auth.uid()
    )
  );

COMMENT ON TABLE community_announcements IS 'Organizer-to-member announcements. Supplier alerts, price changes, deals. Phase 1 of cooperation.';
