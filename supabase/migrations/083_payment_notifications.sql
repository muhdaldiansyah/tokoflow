-- Migration 083 — payment_notifications table for auto-reconciliation.
--
-- Purpose: capture raw inbound payment signals (FPX/DuitNow transfer SMS,
-- bank app screenshots, manual paste) and reconcile them to unpaid orders
-- without merchant input. Billplz-paid orders skip this entirely (the
-- webhook already links those at /api/billing/webhook).
--
-- This table is the storage layer ONLY. Ingestion paths (paste, screenshot
-- OCR, SMS share intent, bank email forwarding) are scoped per ingestion in
-- docs/positioning/P5-reconciliation-plan.md and ship in follow-up sessions.

CREATE TABLE IF NOT EXISTS payment_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- How this got in. "paste" = merchant pasted SMS/notification text.
  -- "screenshot" = uploaded image, OCR'd. "sms" = native share intent
  -- (mobile, deferred). "webhook" = bank API webhook (deferred). "manual" =
  -- merchant manually keyed in the amount.
  source VARCHAR(20) NOT NULL DEFAULT 'paste'
    CHECK (source IN ('paste', 'screenshot', 'sms', 'webhook', 'bank_email', 'manual')),

  raw_text TEXT,
  raw_payload JSONB,

  -- Parsed fields. Nullable until extraction has run.
  amount_myr NUMERIC(12, 2),
  sender_name TEXT,
  bank TEXT,                  -- "Maybank", "CIMB", "TNG", etc.
  reference TEXT,             -- transaction ref / FPX id / DuitNow ref
  occurred_at TIMESTAMPTZ,

  -- Reconciliation state.
  status VARCHAR(24) NOT NULL DEFAULT 'pending_match'
    CHECK (status IN ('pending_match', 'matched', 'rejected_not_mine', 'manual')),
  matched_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  match_confidence NUMERIC(3, 2)
    CHECK (match_confidence IS NULL OR (match_confidence >= 0 AND match_confidence <= 1)),
  matched_at TIMESTAMPTZ,
  match_method VARCHAR(20),   -- 'auto' | 'manual' | 'rule'

  -- Rejection ("this isn't a payment for me").
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pending-match scan is the hot path — covering index for the user_id +
-- status + created_at filter used by /api/reconcile.
CREATE INDEX IF NOT EXISTS idx_payment_notifications_pending
  ON payment_notifications(user_id, created_at DESC)
  WHERE status = 'pending_match';

CREATE INDEX IF NOT EXISTS idx_payment_notifications_user_status
  ON payment_notifications(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_notifications_matched_order
  ON payment_notifications(matched_order_id)
  WHERE matched_order_id IS NOT NULL;

ALTER TABLE payment_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own payment_notifications" ON payment_notifications
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER update_payment_notifications_updated_at
  BEFORE UPDATE ON payment_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
