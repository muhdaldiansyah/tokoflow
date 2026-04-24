-- Migration: Normalize phone numbers to international format (628xxx)
-- 1. Create a normalize function
-- 2. Normalize all customer phones
-- 3. Merge duplicate customers (keep oldest, update references)
-- 4. Normalize all order phones
-- 5. Link orphan orders to customers

-- Step 1: Create a helper function for normalization
CREATE OR REPLACE FUNCTION normalize_phone(phone TEXT) RETURNS TEXT AS $$
DECLARE
  digits TEXT;
BEGIN
  IF phone IS NULL OR phone = '' THEN
    RETURN phone;
  END IF;

  -- Strip all non-digit characters
  digits := regexp_replace(phone, '\D', '', 'g');

  IF digits = '' THEN
    RETURN phone;
  END IF;

  -- Convert local format (0xxx) to international (62xxx)
  IF digits LIKE '0%' THEN
    digits := '62' || substring(digits from 2);
  -- If doesn't start with 62, prepend it (assume local)
  ELSIF digits NOT LIKE '62%' THEN
    digits := '62' || digits;
  END IF;

  RETURN digits;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Step 2: Normalize customer phones
UPDATE customers
SET phone = normalize_phone(phone)
WHERE phone IS NOT NULL
  AND phone != ''
  AND phone != normalize_phone(phone);

-- Step 3: Merge duplicate customers (same user_id + same normalized phone)
-- Keep the oldest record (earliest created_at), merge stats into it
WITH duplicates AS (
  SELECT
    id,
    user_id,
    phone,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY user_id, phone ORDER BY created_at ASC) AS rn
  FROM customers
  WHERE phone IS NOT NULL AND phone != ''
),
-- The "keeper" is rn=1 (oldest)
keepers AS (
  SELECT id, user_id, phone FROM duplicates WHERE rn = 1
),
-- The "dupes" are rn>1 (to be removed)
dupes AS (
  SELECT d.id AS dupe_id, d.user_id, d.phone, k.id AS keeper_id
  FROM duplicates d
  JOIN keepers k ON k.user_id = d.user_id AND k.phone = d.phone
  WHERE d.rn > 1
)
-- Reassign orders from duplicate customers to the keeper
UPDATE orders
SET customer_id = dupes.keeper_id
FROM dupes
WHERE orders.customer_id = dupes.dupe_id;

-- Delete the duplicate customer records
DELETE FROM customers
WHERE id IN (
  SELECT id FROM (
    SELECT
      id,
      ROW_NUMBER() OVER (PARTITION BY user_id, phone ORDER BY created_at ASC) AS rn
    FROM customers
    WHERE phone IS NOT NULL AND phone != ''
  ) ranked
  WHERE rn > 1
);

-- Step 4: Normalize order phones
UPDATE orders
SET customer_phone = normalize_phone(customer_phone)
WHERE customer_phone IS NOT NULL
  AND customer_phone != ''
  AND customer_phone != normalize_phone(customer_phone);

-- Also normalize receipt phones
UPDATE receipts
SET customer_phone = normalize_phone(customer_phone)
WHERE customer_phone IS NOT NULL
  AND customer_phone != ''
  AND customer_phone != normalize_phone(customer_phone);

-- Step 5: Link orphan orders (customer_id is null but has phone) to existing customers
UPDATE orders o
SET customer_id = c.id
FROM customers c
WHERE o.customer_id IS NULL
  AND o.customer_phone IS NOT NULL
  AND o.customer_phone != ''
  AND c.phone = o.customer_phone
  AND c.user_id = o.user_id;

-- Step 6: Recalculate customer stats after merge
UPDATE customers c
SET
  total_orders = COALESCE(stats.order_count, 0),
  total_spent = COALESCE(stats.total_paid, 0),
  last_order_at = stats.last_order
FROM (
  SELECT
    customer_id,
    COUNT(*) AS order_count,
    SUM(COALESCE(paid_amount, 0)) AS total_paid,
    MAX(created_at) AS last_order
  FROM orders
  WHERE customer_id IS NOT NULL
    AND status != 'cancelled'
  GROUP BY customer_id
) stats
WHERE c.id = stats.customer_id;

-- Step 7: Clean up — drop the helper function (normalization now handled in app code)
DROP FUNCTION IF EXISTS normalize_phone(TEXT);
