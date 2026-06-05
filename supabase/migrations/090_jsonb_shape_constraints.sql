-- Migration 090 — JSONB shape CHECK constraints.
--
-- Three jsonb columns receive untyped writes from API routes. Until proper
-- runtime validation lands at every write site, these CHECK constraints
-- catch the most common failure mode at the database boundary: writing a
-- non-array where the application reader expects to iterate over rows
-- (orders.items, invoices.items) or a non-object where the reader expects
-- key/value lookup (profiles.onboarding_drip).
--
-- The constraints are intentionally minimal — they reject obviously wrong
-- top-level shapes, not malformed inner items. The latter belongs in zod
-- validation in service layer, not at the DB.

ALTER TABLE orders
  ADD CONSTRAINT orders_items_is_array
  CHECK (jsonb_typeof(items) = 'array');

ALTER TABLE invoices
  ADD CONSTRAINT invoices_items_is_array
  CHECK (jsonb_typeof(items) = 'array');

-- onboarding_drip is nullable; only constrain non-null shapes.
ALTER TABLE profiles
  ADD CONSTRAINT profiles_onboarding_drip_is_object
  CHECK (onboarding_drip IS NULL OR jsonb_typeof(onboarding_drip) = 'object');
