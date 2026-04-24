-- 059: RLS security fixes + performance indexes
-- Fixes: R3-01, R3-02, R3-03, R3-04, R3-05, R3-06, R3-08

-- ============================================================
-- R3-01: page_views & product_views need RLS
-- Currently NO RLS = anyone with anon key can read all analytics
-- ============================================================

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert page views" ON page_views;
DROP POLICY IF EXISTS "Owners can read own page views" ON page_views;
CREATE POLICY "Anyone can insert page views" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can read own page views" ON page_views FOR SELECT USING (auth.uid() = business_id);

ALTER TABLE product_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert product views" ON product_views;
DROP POLICY IF EXISTS "Owners can read own product views" ON product_views;
CREATE POLICY "Anyone can insert product views" ON product_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can read own product views" ON product_views FOR SELECT USING (auth.uid() = business_id);

-- ============================================================
-- R3-02: payment_orders, transactions, webhook_logs
-- Drop USING(true) policies that grant ALL roles full access
-- Service role bypasses RLS by default — no explicit policy needed
-- ============================================================

-- payment_orders: drop the permissive policy, keep user-scoped SELECT
DROP POLICY IF EXISTS "Service role can manage payment orders" ON payment_orders;
DROP POLICY IF EXISTS "Users can view own payment orders" ON payment_orders;
CREATE POLICY "Users can view own payment orders" ON payment_orders FOR SELECT USING (auth.uid() = user_id);

-- transactions: only service role should access (bypasses RLS)
DROP POLICY IF EXISTS "Service role can manage transactions" ON transactions;
-- No policy = no direct user access. Service role still works.

-- webhook_logs: only service role should access
DROP POLICY IF EXISTS "Service role can manage webhook logs" ON webhook_logs;
-- No policy = no direct user access. Service role still works.

-- ============================================================
-- R3-03: wa_connections, wa_sessions, wa_messages
-- USING(true) exposes WA API access_token to all authenticated users!
-- ============================================================

-- wa_connections: drop permissive, keep only user-scoped SELECT
DROP POLICY IF EXISTS "Service role full access" ON wa_connections;
DROP POLICY IF EXISTS "Users can view own connections" ON wa_connections;
CREATE POLICY "Users can view own connections" ON wa_connections FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own connections" ON wa_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own connections" ON wa_connections FOR UPDATE USING (auth.uid() = user_id);

-- wa_sessions: service-only (bot handles everything)
DROP POLICY IF EXISTS "Service role full access" ON wa_sessions;

-- wa_messages: service-only
DROP POLICY IF EXISTS "Service role full access" ON wa_messages;

-- ============================================================
-- R3-04: Soft-deleted orders can be "undeleted" via UPDATE
-- Add deleted_at IS NULL check to UPDATE policy
-- ============================================================

DROP POLICY IF EXISTS "Users can update own orders" ON orders;
CREATE POLICY "Users can update own orders" ON orders
  FOR UPDATE USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- R3-05: Products RLS missing soft-delete filter
-- ============================================================

DROP POLICY IF EXISTS "Users can CRUD own products" ON products;
CREATE POLICY "Users can read own products" ON products
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own products" ON products
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON products
  FOR UPDATE USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON products
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- R3-06: Missing composite index for payment_status queries
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_orders_user_payment_status ON orders (user_id, payment_status);

-- ============================================================
-- R3-08: Optimize trigger subqueries with composite index
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_orders_customer_stats
  ON orders (customer_id, status, deleted_at)
  INCLUDE (paid_amount, created_at);
