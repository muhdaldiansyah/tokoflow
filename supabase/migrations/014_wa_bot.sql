-- 014_wa_bot.sql
-- WhatsApp Cloud API Bot — connections, sessions, and message audit log

-- 1. wa_connections — links a WA Business phone number to a CatatOrder user
CREATE TABLE IF NOT EXISTS wa_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  wa_phone_number_id TEXT NOT NULL,
  wa_business_id TEXT,
  access_token TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS wa_connections_phone_number_id_idx
  ON wa_connections(wa_phone_number_id);

-- 2. wa_sessions — active order-collection sessions per customer phone
CREATE TABLE IF NOT EXISTS wa_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES wa_connections(id) ON DELETE CASCADE,
  customer_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'collecting'
    CHECK (status IN ('collecting', 'confirming', 'completed', 'cancelled')),
  raw_messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  parsed_items JSONB,
  customer_name TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '3 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wa_sessions_active_idx
  ON wa_sessions(connection_id, customer_phone, status)
  WHERE status IN ('collecting', 'confirming');

-- 3. wa_messages — audit log of all inbound/outbound messages
CREATE TABLE IF NOT EXISTS wa_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID NOT NULL REFERENCES wa_connections(id) ON DELETE CASCADE,
  wa_message_id TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_phone TEXT,
  to_phone TEXT,
  message_type TEXT,
  content JSONB,
  session_id UUID REFERENCES wa_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS wa_messages_wa_message_id_idx
  ON wa_messages(wa_message_id);

-- updated_at triggers
CREATE TRIGGER set_wa_connections_updated_at
  BEFORE UPDATE ON wa_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_wa_sessions_updated_at
  BEFORE UPDATE ON wa_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE wa_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE wa_messages ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (bot operates server-side)
CREATE POLICY "Service role full access on wa_connections"
  ON wa_connections FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on wa_sessions"
  ON wa_sessions FOR ALL
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role full access on wa_messages"
  ON wa_messages FOR ALL
  USING (true) WITH CHECK (true);

-- Authenticated users can read their own connections
CREATE POLICY "Users can view own connections"
  ON wa_connections FOR SELECT
  USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON wa_connections TO authenticated;
GRANT ALL ON wa_connections TO service_role;
GRANT ALL ON wa_sessions TO authenticated;
GRANT ALL ON wa_sessions TO service_role;
GRANT ALL ON wa_messages TO authenticated;
GRANT ALL ON wa_messages TO service_role;
