-- 015_wa_embedded_signup.sql
-- WhatsApp Embedded Signup — add columns for multi-tenant WA Bot

ALTER TABLE wa_connections
  ADD COLUMN IF NOT EXISTS display_phone_number TEXT,
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_wa_connections_token_expires
  ON wa_connections(token_expires_at) WHERE is_active = true;
