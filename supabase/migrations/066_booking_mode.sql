-- Migration 066: Booking mode support
-- For event-based services (MUA, fotografer, WO, dekorator, rental)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_booking BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS booking_time TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS booking_enabled BOOLEAN DEFAULT false;
