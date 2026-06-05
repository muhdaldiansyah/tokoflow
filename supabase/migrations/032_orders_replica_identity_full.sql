-- Enable full replica identity on orders table so realtime UPDATE events
-- include the old record (needed to detect payment_claimed_at changes)
ALTER TABLE orders REPLICA IDENTITY FULL;
