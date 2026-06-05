-- Track every status transition: who changed it and when.
-- Enables the timeline view on the edit-order page.
CREATE TABLE order_status_logs (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status     TEXT,
  to_status       TEXT NOT NULL,
  changed_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_name TEXT,
  changed_at      TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Most queries are "give me the log for this order, newest first"
CREATE INDEX order_status_logs_order_id_idx
  ON order_status_logs(order_id, changed_at DESC);

ALTER TABLE order_status_logs ENABLE ROW LEVEL SECURITY;

-- Owner can read logs for orders they own
CREATE POLICY "owner_select_order_status_logs"
  ON order_status_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_logs.order_id
        AND orders.user_id = auth.uid()
    )
  );

-- Only the authenticated user can insert, and only for their own orders
CREATE POLICY "owner_insert_order_status_logs"
  ON order_status_logs FOR INSERT
  WITH CHECK (
    changed_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_logs.order_id
        AND orders.user_id = auth.uid()
    )
  );
