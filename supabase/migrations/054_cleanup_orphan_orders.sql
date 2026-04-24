-- ============================================================
-- 054: One-time cleanup — link orphan orders to customers
-- and merge case-insensitive duplicate customers
-- ============================================================

-- Step 1: Link orders that have customer_name but no customer_id
-- Match by name (case-insensitive) to existing customers
UPDATE orders o SET
  customer_id = c.id
FROM customers c
WHERE o.customer_id IS NULL
  AND o.customer_name IS NOT NULL
  AND o.customer_name != ''
  AND o.user_id = c.user_id
  AND LOWER(TRIM(o.customer_name)) = LOWER(TRIM(c.name));

-- Step 2: For remaining orphan orders with names, create customer records
-- Use a temporary function to avoid complex DO blocks
INSERT INTO customers (user_id, name, phone, created_at)
SELECT DISTINCT ON (o.user_id, LOWER(TRIM(o.customer_name)))
  o.user_id,
  TRIM(o.customer_name),
  o.customer_phone,
  MIN(o.created_at)
FROM orders o
WHERE o.customer_id IS NULL
  AND o.customer_name IS NOT NULL
  AND o.customer_name != ''
  AND NOT EXISTS (
    SELECT 1 FROM customers c
    WHERE c.user_id = o.user_id
    AND LOWER(TRIM(c.name)) = LOWER(TRIM(o.customer_name))
  )
GROUP BY o.user_id, LOWER(TRIM(o.customer_name)), TRIM(o.customer_name), o.customer_phone
ON CONFLICT DO NOTHING;

-- Step 3: Link the newly created customers
UPDATE orders o SET
  customer_id = c.id
FROM customers c
WHERE o.customer_id IS NULL
  AND o.customer_name IS NOT NULL
  AND o.customer_name != ''
  AND o.user_id = c.user_id
  AND LOWER(TRIM(o.customer_name)) = LOWER(TRIM(c.name));

-- Step 4: Merge case-insensitive duplicate customers
-- For each user, keep the customer with the most orders (or oldest) and reassign orders
-- This handles "zorro" vs "Zorro", "Luffy" vs "luffy"
WITH duplicates AS (
  SELECT
    c.id,
    c.user_id,
    LOWER(TRIM(c.name)) AS normalized_name,
    c.phone,
    ROW_NUMBER() OVER (
      PARTITION BY c.user_id, LOWER(TRIM(c.name))
      ORDER BY
        CASE WHEN c.phone IS NOT NULL THEN 0 ELSE 1 END, -- prefer one with phone
        c.created_at ASC -- keep oldest
    ) AS rn
  FROM customers c
),
-- Find the "keeper" (rn=1) for each duplicate group
keepers AS (
  SELECT user_id, normalized_name, id AS keeper_id
  FROM duplicates WHERE rn = 1
),
-- Find the duplicates to remove (rn>1)
to_remove AS (
  SELECT d.id AS dup_id, k.keeper_id
  FROM duplicates d
  JOIN keepers k ON d.user_id = k.user_id AND d.normalized_name = k.normalized_name
  WHERE d.rn > 1
)
-- Reassign orders from duplicate customers to the keeper
UPDATE orders SET customer_id = tr.keeper_id
FROM to_remove tr
WHERE orders.customer_id = tr.dup_id;

-- Delete the duplicate customer records
DELETE FROM customers
WHERE id IN (
  WITH duplicates AS (
    SELECT
      c.id,
      c.user_id,
      LOWER(TRIM(c.name)) AS normalized_name,
      ROW_NUMBER() OVER (
        PARTITION BY c.user_id, LOWER(TRIM(c.name))
        ORDER BY
          CASE WHEN c.phone IS NOT NULL THEN 0 ELSE 1 END,
          c.created_at ASC
      ) AS rn
    FROM customers c
  )
  SELECT id FROM duplicates WHERE rn > 1
);

-- Step 5: Recalculate all customer stats (trigger will handle future, this fixes history)
UPDATE customers c SET
  total_orders = COALESCE(stats.order_count, 0),
  total_spent = COALESCE(stats.total_paid, 0),
  last_order_at = stats.last_order
FROM (
  SELECT
    customer_id,
    COUNT(*) AS order_count,
    SUM(paid_amount) AS total_paid,
    MAX(created_at) AS last_order
  FROM orders
  WHERE status != 'cancelled' AND customer_id IS NOT NULL
  GROUP BY customer_id
) stats
WHERE c.id = stats.customer_id;
