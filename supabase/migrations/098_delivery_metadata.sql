-- Migration 098 — Delivery metadata (address + tracking)
--
-- Closes the "where is it going and how do I track it" residue (Tier 3
-- mechanical residue per positioning bible v1.2). Honors migration 088's
-- "Tokoflow doesn't track the path, only the destination event"
-- philosophy: no courier-as-entity, no API integration. Just three
-- nullable TEXT columns that the merchant fills in and the customer
-- sees on the receipt + ack pages.
--
-- Before this migration the storefront's only address surface was the
-- free-form `notes` field with a placeholder hinting "home address...".
-- Customers were typing address mixed with other instructions; merchants
-- had to manually parse. Tracking numbers had no home at all.
--
-- All three columns are nullable. NULL `delivery_address` semantically
-- means "pickup at store" (display fallback handled at render time).
-- Dine-in orders (is_dine_in = true) skip the entire delivery surface.
--
-- Courier name is free-form text on purpose — the merchant's "courier"
-- is whoever they choose (suami, adik, Lalamove, Pos Laju, Ninja Van).
-- We do not constrain to a list. Tracking-number prefix matching
-- (Pos Laju EE.*MY, J&T 6.*, Ninja Van NVMY*, etc.) happens client-side
-- in lib/utils/courier.ts to auto-link tracking numbers to courier
-- portals — that's a display-time concern, not a storage concern.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS tracking_number TEXT,
  ADD COLUMN IF NOT EXISTS courier_name TEXT;

-- Partial index — most orders never carry a tracking number (pickup,
-- self-deliver, or in-progress). Index only the rows that actually
-- carry one so merchant "find by tracking" lookups stay cheap.
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number
  ON orders(tracking_number)
  WHERE tracking_number IS NOT NULL;

COMMENT ON COLUMN orders.delivery_address IS
  'Free-form delivery address captured at order time. NULL = pickup at store.';
COMMENT ON COLUMN orders.tracking_number IS
  'Optional courier tracking number. Free-form; courier-portal link inferred from prefix at render time.';
COMMENT ON COLUMN orders.courier_name IS
  'Free-form courier label (Pos Laju / J&T / Ninja Van / Lalamou / "adik"). Per migration 088 — we do not model courier as a first-class entity.';
