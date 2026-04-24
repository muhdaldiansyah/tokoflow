-- Migration 079: Staff accounts + order assignment.
-- Addresses "who's handling this order?" — Orderla complaint #1.
--
-- Scope (v1): staff records are named slots owned by the merchant. Each
-- staff member has a name and optional phone number but does NOT own a
-- Supabase auth identity yet. Independent phone+PIN login is deferred
-- to a later migration; for v1 the owner assigns from their own device.

CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'assistant' CHECK (role IN ('owner', 'assistant')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff (user_id);
CREATE INDEX IF NOT EXISTS idx_staff_user_active ON staff (user_id, active) WHERE active = true;
CREATE UNIQUE INDEX IF NOT EXISTS uq_staff_user_phone
  ON staff (user_id, phone) WHERE phone IS NOT NULL;

-- Order assignment column.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_staff_id UUID
  REFERENCES staff(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_assigned_staff
  ON orders (user_id, assigned_staff_id)
  WHERE assigned_staff_id IS NOT NULL;

-- Track the assignment timestamp so ops can see "handled in N minutes".
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- Row-level security — owner-only.
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS staff_owner_select ON staff;
CREATE POLICY staff_owner_select ON staff
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS staff_owner_insert ON staff;
CREATE POLICY staff_owner_insert ON staff
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS staff_owner_update ON staff;
CREATE POLICY staff_owner_update ON staff
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS staff_owner_delete ON staff;
CREATE POLICY staff_owner_delete ON staff
  FOR DELETE USING (user_id = auth.uid());

-- Keep updated_at current.
CREATE OR REPLACE FUNCTION staff_set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_staff_updated_at ON staff;
CREATE TRIGGER trg_staff_updated_at
  BEFORE UPDATE ON staff
  FOR EACH ROW EXECUTE FUNCTION staff_set_updated_at();
