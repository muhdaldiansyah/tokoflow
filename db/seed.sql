-- ============================================================================
-- Tokoflow seed data
-- Run after db/schema.sql. Idempotent (uses ON CONFLICT).
-- ============================================================================

-- Default marketplace channels with reasonable Indonesia 2026 fee % defaults.
-- Users will adjust these in /marketplace-fees.
insert into public.tf_marketplace_fees (channel, fee_percentage) values
  ('shopee',      8.50),
  ('tokopedia',   6.50),
  ('tiktok shop', 8.00),
  ('lazada',      6.00),
  ('blibli',      5.50),
  ('offline',     0.00),
  ('whatsapp',    0.00)
on conflict (channel) do nothing;

-- Default early-access membership plan so /plans renders something.
insert into public.kn_membership_plans
  (plan_code, name, description, price_idr, credits_amount, validity_days, features, billing_period, is_active)
values
  (
    'early-access',
    'Early Access',
    'Akses penuh selama program early access. Free untuk merchant pertama.',
    0,
    0,
    365,
    '["Inventory & sales engine", "Profit calculator otomatis", "Marketplace fee config", "Direct developer support via WhatsApp"]'::jsonb,
    'monthly',
    true
  )
on conflict (plan_code) do nothing;
