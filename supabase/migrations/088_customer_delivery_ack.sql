-- Migration 088 — Customer delivery acknowledgement
--
-- Closes the "did the customer get it?" loop residue (positioning bible
-- v1.2: Tier 3 mechanical residue, Background Twin role) without
-- modelling kurir as a first-class entity. The courier is whoever the
-- merchant chooses (suami, adik, Lalamove, anyone) — Tokoflow doesn't
-- track the path, only the destination event: customer confirms receipt.
--
-- Flow:
--   1. Merchant marks order as "shipped" (existing flow).
--   2. Merchant taps "Minta pengesahan customer" → API generates
--      customer_ack_token if absent and returns ack URL.
--   3. Merchant shares the URL via WA (existing copy-to-clipboard
--      pattern, no messaging gateway needed).
--   4. Customer taps URL → /a/[token] confirms receipt →
--      customer_ack_at is set atomically.
--
-- Single-use is enforced by the API's UPDATE ... WHERE customer_ack_at
-- IS NULL clause, not by deleting the token (we want the link to
-- continue rendering "already confirmed" if tapped again).
--
-- Token generation is lazy (API-only, never via trigger) so orders
-- that never request an ack carry no token surface. UUID v4 entropy
-- makes the URL unguessable.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS customer_ack_token UUID UNIQUE,
  ADD COLUMN IF NOT EXISTS customer_ack_at TIMESTAMPTZ;

-- Partial index — most orders never request an ack, so the index
-- only covers rows that actually carry a token. Used by the public
-- /a/[token] lookup.
CREATE INDEX IF NOT EXISTS idx_orders_customer_ack_token
  ON orders(customer_ack_token)
  WHERE customer_ack_token IS NOT NULL;
