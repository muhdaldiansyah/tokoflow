-- Migration 091 — fill the gap in foreign-key indexing.
--
-- 079 created `orders.assigned_staff_id REFERENCES staff(id) ON DELETE SET
-- NULL` and indexed it only as part of a compound `(user_id,
-- assigned_staff_id)`. Postgres FK enforcement (cascade/SET NULL on staff
-- deletion) can only use indexes whose leading column is the FK itself, so
-- deleting a staff row currently triggers a sequential scan on orders.
--
-- The existing compound stays — it serves the "show me Pak Andi's queue"
-- query path. This migration adds the standalone index required by FK
-- enforcement.

CREATE INDEX IF NOT EXISTS idx_orders_assigned_staff_id_fk
  ON orders (assigned_staff_id)
  WHERE assigned_staff_id IS NOT NULL;
