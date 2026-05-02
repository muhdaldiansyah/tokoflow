-- Migration 085 — opt-out column for new-order email notifications.
--
-- Ariff feedback 2026-05-02: merchants need to know when a new order lands
-- without keeping the dashboard tab open. Email is the universal fallback
-- (works on any device, any OS, no PWA / push setup needed).
--
-- Default: ON for everyone. Merchants who don't want emails toggle off in
-- /settings. The actual email send lives in app/api/public/orders/route.ts
-- and respects this flag.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notify_new_order_email BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN profiles.notify_new_order_email IS
  'Send merchant an email when a customer orders via store link. Default TRUE. Toggleable in /settings.';
