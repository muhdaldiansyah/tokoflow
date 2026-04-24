-- WaStruk Reminders Table

CREATE TABLE wastruk.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id UUID NOT NULL REFERENCES wastruk.receipts(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed, cancelled
  fonnte_response JSONB,
  message_text TEXT, -- The message that was/will be sent
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_reminders_status ON wastruk.reminders(status);
CREATE INDEX idx_reminders_scheduled ON wastruk.reminders(scheduled_at);
CREATE INDEX idx_reminders_receipt_id ON wastruk.reminders(receipt_id);

-- RLS
ALTER TABLE wastruk.reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders" ON wastruk.reminders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM wastruk.receipts
      WHERE receipts.id = reminders.receipt_id
      AND receipts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create reminders for own receipts" ON wastruk.reminders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM wastruk.receipts
      WHERE receipts.id = receipt_id
      AND receipts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own reminders" ON wastruk.reminders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM wastruk.receipts
      WHERE receipts.id = reminders.receipt_id
      AND receipts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own reminders" ON wastruk.reminders
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM wastruk.receipts
      WHERE receipts.id = reminders.receipt_id
      AND receipts.user_id = auth.uid()
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_reminders_updated_at
  BEFORE UPDATE ON wastruk.reminders
  FOR EACH ROW EXECUTE FUNCTION wastruk.update_updated_at();
