-- Migration 092: Phase 0 validation tracking tables
--
-- Adds three tables for Phase 0 8-week adversarial validation per
-- docs/SYNTHESIS-2026-05-05.md and scripts/phase-0/README.md:
--
-- 1. phase_0_interviews — 10 merchant interviews (5 friendly + 5 hostile)
--    with Three-Tier resonance, Sean Ellis test, brand resonance, WTP, etc.
-- 2. phase_0_distribution_metrics — weekly TikTok/komuniti checkpoints
--    (followers, comments, inbound DMs) for Track 0.9.
-- 3. phase_0_smoke_test_log — daily diary entries for Aldi during 2-week
--    manual twin smoke test (Track 0.5).
--
-- All tables RLS-locked to admin (user_id matches an explicit admin set).
-- These are internal validation artifacts, never customer-facing.

-- ============================================================================
-- 1. Interviews table
-- ============================================================================

CREATE TABLE IF NOT EXISTS phase_0_interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Identity (anonymized — initial only, no full name)
  interview_number INT NOT NULL CHECK (interview_number BETWEEN 1 AND 10),
  initial TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('friendly', 'hostile')),
  interview_date DATE NOT NULL,

  -- Context
  vertical TEXT,
  revenue_band TEXT CHECK (revenue_band IN ('<5k', '5-15k', '15-50k', '>50k')),

  -- Three-Tier signals (1-10 scale)
  three_tier_resonance INT CHECK (three_tier_resonance BETWEEN 1 AND 10),
  tier_1_love_mentioned BOOLEAN DEFAULT FALSE,
  tier_2_love_mentioned BOOLEAN DEFAULT FALSE,
  tier_3_top_pain_cited BOOLEAN DEFAULT FALSE,

  -- Top 3 pains (free text, comma-separated pain IDs from interview script §4)
  top_pains TEXT,

  -- Sean Ellis test
  sean_ellis_answer TEXT CHECK (sean_ellis_answer IN ('a_very_disappointed', 'b_somewhat_disappointed', 'c_not_disappointed')),

  -- Willingness to pay
  wtp_rm_per_month INT,

  -- Brand resonance test (added 2026-05-05 per SYNTHESIS §6.1)
  brand_friction INT CHECK (brand_friction BETWEEN 1 AND 10),
  brand_friction_notes TEXT,

  -- Wave 2 spillover
  wave_2_spillover_names TEXT,

  -- Trust concerns (hostile interviews only)
  trust_concerns TEXT,

  -- Beta willingness
  beta_willing BOOLEAN DEFAULT FALSE,

  -- Free-text notes
  notes TEXT,

  -- Owner reference
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  UNIQUE (interview_number)
);

CREATE INDEX idx_phase_0_interviews_type ON phase_0_interviews(type);
CREATE INDEX idx_phase_0_interviews_date ON phase_0_interviews(interview_date);

-- Trigger to update updated_at — reuses public.update_updated_at() from migration 000
CREATE TRIGGER trigger_phase_0_interviews_updated_at
  BEFORE UPDATE ON phase_0_interviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- 2. Distribution metrics table
-- ============================================================================

CREATE TABLE IF NOT EXISTS phase_0_distribution_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Snapshot timing
  snapshot_date DATE NOT NULL,
  week_number INT NOT NULL CHECK (week_number BETWEEN 1 AND 8),

  -- Cumulative counts
  followers_total INT NOT NULL DEFAULT 0,
  posts_published INT NOT NULL DEFAULT 0,

  -- Engagement
  substantive_comments INT NOT NULL DEFAULT 0,
  inbound_dm_total INT NOT NULL DEFAULT 0,
  inbound_dm_qualified INT NOT NULL DEFAULT 0,

  -- Per-platform breakdown (JSON for flexibility)
  per_platform JSONB,

  -- Notes
  notes TEXT,

  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  UNIQUE (snapshot_date, user_id)
);

CREATE INDEX idx_phase_0_dist_metrics_week ON phase_0_distribution_metrics(week_number);

-- ============================================================================
-- 3. Smoke test daily log
-- ============================================================================

CREATE TABLE IF NOT EXISTS phase_0_smoke_test_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Daily entry
  log_date DATE NOT NULL,
  smoke_test_day INT NOT NULL CHECK (smoke_test_day BETWEEN 1 AND 14),

  -- Activity counts
  wa_messages_handled INT NOT NULL DEFAULT 0,
  orders_processed INT NOT NULL DEFAULT 0,
  payments_matched INT NOT NULL DEFAULT 0,
  invoices_generated INT NOT NULL DEFAULT 0,

  -- Time investment
  hours_invested NUMERIC(4,2) NOT NULL DEFAULT 0,

  -- Quality signals
  customer_complaints INT NOT NULL DEFAULT 0,
  ai_tone_detection_incidents INT NOT NULL DEFAULT 0,
  trust_degradation_incidents INT NOT NULL DEFAULT 0,

  -- Free-text reflection
  what_worked TEXT,
  what_broke TEXT,
  merchant_feedback TEXT,

  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  UNIQUE (log_date, user_id)
);

CREATE INDEX idx_phase_0_smoke_log_day ON phase_0_smoke_test_log(smoke_test_day);

-- ============================================================================
-- RLS — admin only (Aldi runs Phase 0)
-- ============================================================================

ALTER TABLE phase_0_interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_0_distribution_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE phase_0_smoke_test_log ENABLE ROW LEVEL SECURITY;

-- Admin can see/edit own rows
CREATE POLICY "Admin can manage own interview data"
  ON phase_0_interviews
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage own distribution data"
  ON phase_0_distribution_metrics
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can manage own smoke test data"
  ON phase_0_smoke_test_log
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role full access (for admin dashboard aggregation)
CREATE POLICY "Service role full access interviews"
  ON phase_0_interviews
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Service role full access dist"
  ON phase_0_distribution_metrics
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

CREATE POLICY "Service role full access smoke test"
  ON phase_0_smoke_test_log
  FOR ALL
  TO service_role
  USING (TRUE)
  WITH CHECK (TRUE);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE phase_0_interviews IS 'Phase 0 merchant interview log (10 interviews, 5 friendly + 5 hostile). Per scripts/phase-0/merchant-interview.md v2.';
COMMENT ON TABLE phase_0_distribution_metrics IS 'Phase 0 weekly distribution tracking (TikTok + komuniti) per scripts/phase-0/distribution/README.md.';
COMMENT ON TABLE phase_0_smoke_test_log IS 'Phase 0 daily smoke test diary (Aldi as manual twin) per scripts/phase-0/smoke-test/README.md.';
