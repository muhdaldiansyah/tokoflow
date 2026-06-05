-- Migration 106 — stock reservation ledger + hardened stock RPCs
--
-- Inventory must be adjusted exactly once per active order. The previous
-- name-based decrement/restore helpers were callable with arbitrary user IDs
-- and had no memory of what an order had already consumed, so retries and
-- concurrent edits could inflate or oversell stock.

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  movement_type TEXT NOT NULL,
  qty_delta INTEGER NOT NULL CHECK (qty_delta <> 0),
  qty_before INTEGER,
  qty_after INTEGER,
  unit_price_snapshot NUMERIC(14, 2),
  unit_cost_snapshot NUMERIC(14, 2),
  reason TEXT,
  actor_type TEXT NOT NULL DEFAULT 'system',
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source_table TEXT,
  source_id UUID,
  idempotency_key TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  delete_reason TEXT,
  reversed_by_movement_id UUID REFERENCES inventory_movements(id) ON DELETE SET NULL,
  reversal_of_movement_id UUID REFERENCES inventory_movements(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_user_time
  ON inventory_movements(user_id, occurred_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_time
  ON inventory_movements(product_id, occurred_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_movements_order
  ON inventory_movements(order_id)
  WHERE order_id IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_movements_idempotency
  ON inventory_movements(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own inventory movements" ON inventory_movements;
CREATE POLICY "Users can read own inventory movements"
  ON inventory_movements FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE TABLE IF NOT EXISTS financial_ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES order_payments(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL,
  amount_delta NUMERIC(14, 2) NOT NULL CHECK (amount_delta <> 0),
  revenue_delta NUMERIC(14, 2) NOT NULL DEFAULT 0,
  receivable_delta NUMERIC(14, 2) NOT NULL DEFAULT 0,
  cash_delta NUMERIC(14, 2) NOT NULL DEFAULT 0,
  refund_delta NUMERIC(14, 2) NOT NULL DEFAULT 0,
  fee_delta NUMERIC(14, 2) NOT NULL DEFAULT 0,
  cost_delta NUMERIC(14, 2) NOT NULL DEFAULT 0,
  gross_amount NUMERIC(14, 2),
  fee_amount NUMERIC(14, 2),
  net_amount NUMERIC(14, 2),
  currency TEXT NOT NULL DEFAULT 'MYR',
  provider TEXT,
  payment_method TEXT,
  external_reference TEXT,
  reason TEXT,
  actor_type TEXT NOT NULL DEFAULT 'system',
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source_table TEXT,
  source_id UUID,
  idempotency_key TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  delete_reason TEXT,
  reversed_by_entry_id UUID REFERENCES financial_ledger_entries(id) ON DELETE SET NULL,
  reversal_of_entry_id UUID REFERENCES financial_ledger_entries(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_financial_ledger_user_time
  ON financial_ledger_entries(user_id, occurred_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_financial_ledger_order
  ON financial_ledger_entries(order_id)
  WHERE order_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_financial_ledger_invoice
  ON financial_ledger_entries(invoice_id)
  WHERE invoice_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_financial_ledger_customer
  ON financial_ledger_entries(customer_id, occurred_at DESC)
  WHERE customer_id IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_ledger_idempotency
  ON financial_ledger_entries(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE financial_ledger_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own financial ledger entries" ON financial_ledger_entries;
CREATE POLICY "Users can read own financial ledger entries"
  ON financial_ledger_entries FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE TABLE IF NOT EXISTS catalog_change_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  change_type TEXT NOT NULL,
  changed_fields TEXT[] NOT NULL DEFAULT '{}'::text[],
  old_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  new_values JSONB NOT NULL DEFAULT '{}'::jsonb,
  price_before NUMERIC(14, 2),
  price_after NUMERIC(14, 2),
  cost_before NUMERIC(14, 2),
  cost_after NUMERIC(14, 2),
  stock_before INTEGER,
  stock_after INTEGER,
  reason TEXT,
  actor_type TEXT NOT NULL DEFAULT 'system',
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source_table TEXT,
  source_id UUID,
  idempotency_key TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  delete_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_catalog_change_events_user_time
  ON catalog_change_events(user_id, occurred_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_catalog_change_events_product_time
  ON catalog_change_events(product_id, occurred_at DESC)
  WHERE product_id IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_catalog_change_events_idempotency
  ON catalog_change_events(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE catalog_change_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own catalog change events" ON catalog_change_events;
CREATE POLICY "Users can read own catalog change events"
  ON catalog_change_events FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE TABLE IF NOT EXISTS fulfillment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  tracking_number TEXT,
  courier_name TEXT,
  reason TEXT,
  actor_type TEXT NOT NULL DEFAULT 'system',
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  source_table TEXT,
  source_id UUID,
  idempotency_key TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  delete_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_fulfillment_events_user_time
  ON fulfillment_events(user_id, occurred_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_fulfillment_events_order_time
  ON fulfillment_events(order_id, occurred_at DESC)
  WHERE order_id IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_fulfillment_events_idempotency
  ON fulfillment_events(idempotency_key)
  WHERE idempotency_key IS NOT NULL;

ALTER TABLE fulfillment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own fulfillment events" ON fulfillment_events;
CREATE POLICY "Users can read own fulfillment events"
  ON fulfillment_events FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE TABLE IF NOT EXISTS order_stock_reservations (
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  qty INTEGER NOT NULL CHECK (qty > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (order_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_order_stock_reservations_user
  ON order_stock_reservations(user_id, order_id);

ALTER TABLE order_stock_reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own order stock reservations" ON order_stock_reservations;
CREATE POLICY "Users can read own order stock reservations"
  ON order_stock_reservations FOR SELECT
  USING (auth.uid() = user_id);

-- Resolve an order's desired product reservations from JSON line items, then
-- apply only the delta from the existing reservations. Product IDs are preferred.
-- Name fallback is kept only for legacy/custom payload compatibility.
CREATE OR REPLACE FUNCTION public.sync_order_stock_reservations(
  p_user_id UUID,
  p_order_id UUID,
  p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_order_user_id UUID;
  v_delta INTEGER;
  v_stock INTEGER;
  v_price NUMERIC(14, 2);
  v_cost NUMERIC(14, 2);
  v_abs_delta INTEGER;
  v_consumed INTEGER := 0;
  v_restored INTEGER := 0;
  r RECORD;
BEGIN
  IF p_user_id IS NULL OR p_order_id IS NULL THEN
    RAISE EXCEPTION 'invalid_order_stock_request';
  END IF;

  IF p_items IS NULL THEN
    p_items := '[]'::jsonb;
  END IF;

  IF jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'invalid_order_items';
  END IF;

  -- Serializes create/edit/undo/delete stock work for this order.
  SELECT user_id INTO v_order_user_id
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_order_user_id IS NULL OR v_order_user_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  DROP TABLE IF EXISTS pg_temp._desired_order_stock;
  CREATE TEMP TABLE _desired_order_stock (
    product_id UUID PRIMARY KEY,
    qty INTEGER NOT NULL CHECK (qty > 0)
  ) ON COMMIT DROP;

  INSERT INTO _desired_order_stock(product_id, qty)
  SELECT resolved.product_id, SUM(resolved.qty)::integer
  FROM (
    SELECT
      p.id AS product_id,
      GREATEST(1, ROUND(COALESCE(item.qty, 1))::integer) AS qty
    FROM jsonb_to_recordset(p_items) AS item(
      product_id TEXT,
      "productId" TEXT,
      name TEXT,
      qty NUMERIC
    )
    LEFT JOIN LATERAL (
      SELECT
        COALESCE(
          CASE
            WHEN item.product_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              THEN item.product_id::uuid
          END,
          CASE
            WHEN item."productId" ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              THEN item."productId"::uuid
          END
        ) AS id
    ) explicit_id ON TRUE
    LEFT JOIN LATERAL (
      SELECT products.id
      FROM products
      WHERE products.user_id = p_user_id
        AND products.deleted_at IS NULL
        AND products.stock IS NOT NULL
        AND LOWER(TRIM(products.name)) = LOWER(TRIM(item.name))
      ORDER BY products.sort_order ASC NULLS LAST, products.created_at ASC, products.id ASC
      LIMIT 1
    ) name_match ON explicit_id.id IS NULL AND item.name IS NOT NULL AND TRIM(item.name) <> ''
    JOIN products p
      ON p.id = COALESCE(explicit_id.id, name_match.id)
     AND p.user_id = p_user_id
     AND p.deleted_at IS NULL
     AND p.stock IS NOT NULL
  ) resolved
  GROUP BY resolved.product_id;

  FOR r IN
    SELECT
      product_ids.product_id,
      COALESCE(desired.qty, 0)::integer AS desired_qty,
      COALESCE(existing.qty, 0)::integer AS existing_qty
    FROM (
      SELECT product_id FROM _desired_order_stock
      UNION
      SELECT product_id FROM order_stock_reservations WHERE order_id = p_order_id
    ) product_ids
    LEFT JOIN _desired_order_stock desired ON desired.product_id = product_ids.product_id
    LEFT JOIN order_stock_reservations existing
      ON existing.order_id = p_order_id
     AND existing.product_id = product_ids.product_id
    ORDER BY product_ids.product_id
  LOOP
    v_delta := r.desired_qty - r.existing_qty;

    IF v_delta > 0 THEN
      v_stock := NULL;
      v_price := NULL;
      v_cost := NULL;
      SELECT stock, price, cost_price INTO v_stock, v_price, v_cost
      FROM products
      WHERE id = r.product_id
        AND user_id = p_user_id
        AND deleted_at IS NULL
        AND stock IS NOT NULL
      FOR UPDATE;

      IF v_stock IS NULL THEN
        RAISE EXCEPTION 'product_not_tracked:%', r.product_id;
      END IF;

      IF v_stock < v_delta THEN
        RAISE EXCEPTION 'insufficient_stock:%:%:%', r.product_id, v_stock, v_delta;
      END IF;

      UPDATE products
      SET stock = stock - v_delta,
          is_available = CASE WHEN stock - v_delta <= 0 THEN FALSE ELSE is_available END
      WHERE id = r.product_id;

      INSERT INTO inventory_movements(
        user_id,
        product_id,
        order_id,
        movement_type,
        qty_delta,
        qty_before,
        qty_after,
        unit_price_snapshot,
        unit_cost_snapshot,
        reason,
        actor_type,
        source_table,
        source_id,
        metadata
      )
      VALUES (
        p_user_id,
        r.product_id,
        p_order_id,
        'order_reserved',
        -v_delta,
        v_stock,
        v_stock - v_delta,
        v_price,
        v_cost,
        'order_stock_sync',
        'system',
        'orders',
        p_order_id,
        jsonb_build_object(
          'desired_qty', r.desired_qty,
          'existing_qty', r.existing_qty
        )
      );

      v_consumed := v_consumed + v_delta;
    ELSIF v_delta < 0 THEN
      v_abs_delta := ABS(v_delta);
      v_stock := NULL;
      v_price := NULL;
      v_cost := NULL;
      SELECT stock, price, cost_price INTO v_stock, v_price, v_cost
      FROM products
      WHERE id = r.product_id
        AND user_id = p_user_id
        AND deleted_at IS NULL
        AND stock IS NOT NULL
      FOR UPDATE;

      UPDATE products
      SET stock = COALESCE(stock, 0) + v_abs_delta,
          is_available = TRUE
      WHERE id = r.product_id
        AND user_id = p_user_id
        AND deleted_at IS NULL
        AND stock IS NOT NULL;

      IF v_stock IS NOT NULL THEN
        INSERT INTO inventory_movements(
          user_id,
          product_id,
          order_id,
          movement_type,
          qty_delta,
          qty_before,
          qty_after,
          unit_price_snapshot,
          unit_cost_snapshot,
          reason,
          actor_type,
          source_table,
          source_id,
          metadata
        )
        VALUES (
          p_user_id,
          r.product_id,
          p_order_id,
          'order_released',
          v_abs_delta,
          v_stock,
          v_stock + v_abs_delta,
          v_price,
          v_cost,
          'order_stock_sync',
          'system',
          'orders',
          p_order_id,
          jsonb_build_object(
            'desired_qty', r.desired_qty,
            'existing_qty', r.existing_qty
          )
        );
      END IF;

      v_restored := v_restored + v_abs_delta;
    END IF;

    IF r.desired_qty > 0 THEN
      INSERT INTO order_stock_reservations(order_id, product_id, user_id, qty, updated_at)
      VALUES (p_order_id, r.product_id, p_user_id, r.desired_qty, NOW())
      ON CONFLICT (order_id, product_id)
      DO UPDATE SET qty = EXCLUDED.qty, updated_at = NOW();
    ELSE
      DELETE FROM order_stock_reservations
      WHERE order_id = p_order_id
        AND product_id = r.product_id;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', TRUE,
    'consumed', v_consumed,
    'restored', v_restored
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_order_items_and_sync_stock(
  p_user_id UUID,
  p_order_id UUID,
  p_items JSONB,
  p_subtotal NUMERIC,
  p_discount NUMERIC,
  p_delivery_fee NUMERIC,
  p_total NUMERIC,
  p_unique_code INTEGER DEFAULT NULL
)
RETURNS orders AS $$
DECLARE
  v_order orders%ROWTYPE;
BEGIN
  PERFORM public.sync_order_stock_reservations(p_user_id, p_order_id, p_items);

  UPDATE orders
  SET items = p_items,
      subtotal = p_subtotal,
      discount = p_discount,
      delivery_fee = p_delivery_fee,
      total = p_total,
      unique_code = p_unique_code,
      updated_at = NOW()
  WHERE id = p_order_id
    AND user_id = p_user_id
  RETURNING * INTO v_order;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  RETURN v_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.adjust_product_stock(
  p_user_id UUID,
  p_product_id UUID,
  p_delta INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  v_stock INTEGER;
  v_new_stock INTEGER;
  v_price NUMERIC(14, 2);
  v_cost NUMERIC(14, 2);
BEGIN
  IF p_delta = 0 THEN
    RAISE EXCEPTION 'invalid_stock_delta';
  END IF;

  SELECT stock, price, cost_price INTO v_stock, v_price, v_cost
  FROM products
  WHERE id = p_product_id
    AND user_id = p_user_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product_not_found';
  END IF;

  IF v_stock IS NULL THEN
    RETURN NULL;
  END IF;

  v_new_stock := GREATEST(0, v_stock + p_delta);

  UPDATE products
  SET stock = v_new_stock,
      is_available = CASE
        WHEN v_new_stock <= 0 THEN FALSE
        WHEN p_delta > 0 THEN TRUE
        ELSE is_available
      END
  WHERE id = p_product_id;

  INSERT INTO inventory_movements(
    user_id,
    product_id,
    movement_type,
    qty_delta,
    qty_before,
    qty_after,
    unit_price_snapshot,
    unit_cost_snapshot,
    reason,
    actor_type,
    actor_id,
    source_table,
    source_id,
    metadata
  )
  VALUES (
    p_user_id,
    p_product_id,
    'manual_adjustment',
    v_new_stock - v_stock,
    v_stock,
    v_new_stock,
    v_price,
    v_cost,
    'manual_stock_adjustment',
    'merchant',
    p_user_id,
    'products',
    p_product_id,
    jsonb_build_object('requested_delta', p_delta)
  );

  RETURN v_new_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Harden the legacy helpers too. They remain available to service-role API
-- code for old orders that predate the reservation ledger.
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  p_user_id UUID,
  p_product_name TEXT,
  p_qty INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_product_id UUID;
  v_current_stock INTEGER;
  v_price NUMERIC(14, 2);
  v_cost NUMERIC(14, 2);
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'invalid_stock_quantity';
  END IF;

  SELECT id, stock, price, cost_price INTO v_product_id, v_current_stock, v_price, v_cost
  FROM products
  WHERE user_id = p_user_id
    AND LOWER(TRIM(name)) = LOWER(TRIM(p_product_name))
    AND deleted_at IS NULL
    AND stock IS NOT NULL
  ORDER BY sort_order ASC NULLS LAST, created_at ASC, id ASC
  LIMIT 1
  FOR UPDATE;

  IF v_product_id IS NULL THEN
    RETURN TRUE;
  END IF;

  IF v_current_stock < p_qty THEN
    RETURN FALSE;
  END IF;

  UPDATE products
  SET stock = stock - p_qty,
      is_available = CASE WHEN stock - p_qty <= 0 THEN FALSE ELSE is_available END
  WHERE id = v_product_id;

  INSERT INTO inventory_movements(
    user_id,
    product_id,
    movement_type,
    qty_delta,
    qty_before,
    qty_after,
    unit_price_snapshot,
    unit_cost_snapshot,
    reason,
    actor_type,
    source_table,
    source_id,
    metadata
  )
  VALUES (
    p_user_id,
    v_product_id,
    'legacy_decrement',
    -p_qty,
    v_current_stock,
    v_current_stock - p_qty,
    v_price,
    v_cost,
    'legacy_stock_helper',
    'system',
    'products',
    v_product_id,
    jsonb_build_object('product_name', p_product_name)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.restore_product_stock(
  p_user_id UUID,
  p_product_name TEXT,
  p_qty INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  v_product_id UUID;
  v_current_stock INTEGER;
  v_price NUMERIC(14, 2);
  v_cost NUMERIC(14, 2);
BEGIN
  IF p_qty IS NULL OR p_qty <= 0 THEN
    RAISE EXCEPTION 'invalid_stock_quantity';
  END IF;

  SELECT id, stock, price, cost_price INTO v_product_id, v_current_stock, v_price, v_cost
  FROM products
  WHERE user_id = p_user_id
    AND LOWER(TRIM(name)) = LOWER(TRIM(p_product_name))
    AND deleted_at IS NULL
    AND stock IS NOT NULL
  ORDER BY sort_order ASC NULLS LAST, created_at ASC, id ASC
  LIMIT 1
  FOR UPDATE;

  IF v_product_id IS NULL THEN
    RETURN TRUE;
  END IF;

  UPDATE products
  SET stock = COALESCE(stock, 0) + p_qty,
      is_available = TRUE
  WHERE id = v_product_id;

  INSERT INTO inventory_movements(
    user_id,
    product_id,
    movement_type,
    qty_delta,
    qty_before,
    qty_after,
    unit_price_snapshot,
    unit_cost_snapshot,
    reason,
    actor_type,
    source_table,
    source_id,
    metadata
  )
  VALUES (
    p_user_id,
    v_product_id,
    'legacy_restore',
    p_qty,
    v_current_stock,
    COALESCE(v_current_stock, 0) + p_qty,
    v_price,
    v_cost,
    'legacy_stock_helper',
    'system',
    'products',
    v_product_id,
    jsonb_build_object('product_name', p_product_name)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.cancel_order_and_release_stock(
  p_user_id UUID,
  p_order_id UUID,
  p_undone_at TIMESTAMPTZ,
  p_reason TEXT DEFAULT NULL
)
RETURNS orders AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_updated orders%ROWTYPE;
  v_has_reservations BOOLEAN;
  item RECORD;
BEGIN
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
    AND user_id = p_user_id
  FOR UPDATE;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF v_order.undone_at IS NOT NULL THEN
    RETURN v_order;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM order_stock_reservations WHERE order_id = p_order_id
  ) INTO v_has_reservations;

  IF v_has_reservations THEN
    PERFORM public.sync_order_stock_reservations(p_user_id, p_order_id, '[]'::jsonb);
  ELSIF jsonb_typeof(COALESCE(v_order.items, '[]'::jsonb)) = 'array' THEN
    FOR item IN
      SELECT * FROM jsonb_to_recordset(v_order.items) AS x(name TEXT, qty NUMERIC)
    LOOP
      IF item.name IS NOT NULL AND COALESCE(item.qty, 0) > 0 THEN
        PERFORM public.restore_product_stock(
          p_user_id,
          item.name,
          GREATEST(1, ROUND(item.qty)::integer)
        );
      END IF;
    END LOOP;
  END IF;

  UPDATE orders
  SET status = 'cancelled',
      undone_at = p_undone_at,
      undo_reason = p_reason,
      updated_at = NOW()
  WHERE id = p_order_id
    AND user_id = p_user_id
  RETURNING * INTO v_updated;

  INSERT INTO fulfillment_events(
    user_id,
    order_id,
    event_type,
    from_status,
    to_status,
    reason,
    actor_type,
    actor_id,
    source_table,
    source_id,
    metadata
  )
  VALUES (
    p_user_id,
    p_order_id,
    'order_cancelled',
    v_order.status,
    'cancelled',
    p_reason,
    'merchant',
    p_user_id,
    'orders',
    p_order_id,
    jsonb_build_object('undone_at', p_undone_at)
  );

  PERFORM public.decrement_orders_used(p_user_id);

  RETURN v_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.soft_delete_order_and_release_stock(
  p_user_id UUID,
  p_order_id UUID,
  p_deleted_at TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_has_reservations BOOLEAN;
  item RECORD;
BEGIN
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
    AND user_id = p_user_id
  FOR UPDATE;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'order_not_found';
  END IF;

  IF v_order.deleted_at IS NOT NULL THEN
    RETURN TRUE;
  END IF;

  IF v_order.undone_at IS NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM order_stock_reservations WHERE order_id = p_order_id
    ) INTO v_has_reservations;

    IF v_has_reservations THEN
      PERFORM public.sync_order_stock_reservations(p_user_id, p_order_id, '[]'::jsonb);
    ELSIF jsonb_typeof(COALESCE(v_order.items, '[]'::jsonb)) = 'array' THEN
      FOR item IN
        SELECT * FROM jsonb_to_recordset(v_order.items) AS x(name TEXT, qty NUMERIC)
      LOOP
        IF item.name IS NOT NULL AND COALESCE(item.qty, 0) > 0 THEN
          PERFORM public.restore_product_stock(
            p_user_id,
            item.name,
            GREATEST(1, ROUND(item.qty)::integer)
          );
        END IF;
      END LOOP;
    END IF;

    PERFORM public.decrement_orders_used(p_user_id);
  END IF;

  UPDATE orders
  SET deleted_at = p_deleted_at,
      updated_at = NOW()
  WHERE id = p_order_id
    AND user_id = p_user_id;

  INSERT INTO fulfillment_events(
    user_id,
    order_id,
    event_type,
    from_status,
    to_status,
    reason,
    actor_type,
    actor_id,
    source_table,
    source_id,
    metadata
  )
  VALUES (
    p_user_id,
    p_order_id,
    'order_deleted',
    v_order.status,
    v_order.status,
    'soft_delete',
    'merchant',
    p_user_id,
    'orders',
    p_order_id,
    jsonb_build_object('deleted_at', p_deleted_at, 'was_undone', v_order.undone_at IS NOT NULL)
  );

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.mark_order_payment_paid(
  p_billplz_bill_id TEXT,
  p_paid_amount NUMERIC,
  p_payment_method TEXT,
  p_paid_at TIMESTAMPTZ,
  p_metadata JSONB
) RETURNS order_payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment order_payments;
  v_was_already_paid BOOLEAN;
  v_order orders%ROWTYPE;
BEGIN
  -- Lock the row so concurrent webhook deliveries serialize.
  SELECT * INTO v_payment
  FROM order_payments
  WHERE billplz_bill_id = p_billplz_bill_id
  FOR UPDATE;

  IF v_payment.id IS NULL THEN
    RAISE EXCEPTION 'order_payment not found for bill %', p_billplz_bill_id;
  END IF;

  v_was_already_paid := v_payment.status = 'paid';

  UPDATE order_payments
  SET status = 'paid',
      paid_at = p_paid_at,
      payment_method = p_payment_method,
      metadata = COALESCE(p_metadata, metadata)
  WHERE id = v_payment.id
  RETURNING * INTO v_payment;

  IF NOT v_was_already_paid THEN
    UPDATE orders
    SET paid_amount = COALESCE(paid_amount, 0) + p_paid_amount,
        payment_claimed_at = NULL
    WHERE id = v_payment.order_id
    RETURNING * INTO v_order;

    IF COALESCE(p_paid_amount, 0) <> 0 THEN
      INSERT INTO financial_ledger_entries(
        user_id,
        customer_id,
        order_id,
        payment_id,
        entry_type,
        amount_delta,
        cash_delta,
        gross_amount,
        net_amount,
        provider,
        payment_method,
        external_reference,
        reason,
        actor_type,
        source_table,
        source_id,
        idempotency_key,
        metadata,
        occurred_at
      )
      VALUES (
        v_payment.user_id,
        v_order.customer_id,
        v_payment.order_id,
        v_payment.id,
        'payment_received',
        p_paid_amount,
        p_paid_amount,
        p_paid_amount,
        p_paid_amount,
        v_payment.provider,
        p_payment_method,
        p_billplz_bill_id,
        'billplz_webhook_paid',
        'billplz',
        'order_payments',
        v_payment.id,
        'order_payment_paid:' || v_payment.id::text,
        COALESCE(p_metadata, '{}'::jsonb),
        COALESCE(p_paid_at, NOW())
      )
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  RETURN v_payment;
END;
$$;

-- mark_order_payment_failed: companion to mark_order_payment_paid.
-- Transitions a pending/due payment to failed or expired. Never downgrades paid.
CREATE OR REPLACE FUNCTION public.mark_order_payment_failed(
  p_billplz_bill_id TEXT,
  p_status TEXT,
  p_metadata JSONB DEFAULT NULL
) RETURNS order_payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment order_payments;
BEGIN
  SELECT * INTO v_payment
  FROM order_payments
  WHERE billplz_bill_id = p_billplz_bill_id
  FOR UPDATE;

  IF v_payment.id IS NULL THEN
    RAISE EXCEPTION 'order_payment not found for bill %', p_billplz_bill_id;
  END IF;

  IF v_payment.status = 'paid' THEN
    RETURN v_payment;
  END IF;

  UPDATE order_payments
  SET status = p_status,
      metadata = COALESCE(p_metadata, metadata)
  WHERE id = v_payment.id
  RETURNING * INTO v_payment;

  RETURN v_payment;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.sync_order_stock_reservations(UUID, UUID, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_order_items_and_sync_stock(UUID, UUID, JSONB, NUMERIC, NUMERIC, NUMERIC, NUMERIC, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.adjust_product_stock(UUID, UUID, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_product_stock(UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.restore_product_stock(UUID, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cancel_order_and_release_stock(UUID, UUID, TIMESTAMPTZ, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.soft_delete_order_and_release_stock(UUID, UUID, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_order_payment_paid(TEXT, NUMERIC, TEXT, TIMESTAMPTZ, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.mark_order_payment_failed(TEXT, TEXT, JSONB) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.sync_order_stock_reservations(UUID, UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_order_items_and_sync_stock(UUID, UUID, JSONB, NUMERIC, NUMERIC, NUMERIC, NUMERIC, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.adjust_product_stock(UUID, UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_product_stock(UUID, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.restore_product_stock(UUID, TEXT, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.cancel_order_and_release_stock(UUID, UUID, TIMESTAMPTZ, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.soft_delete_order_and_release_stock(UUID, UUID, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_order_payment_paid(TEXT, NUMERIC, TEXT, TIMESTAMPTZ, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_order_payment_failed(TEXT, TEXT, JSONB) TO service_role;
