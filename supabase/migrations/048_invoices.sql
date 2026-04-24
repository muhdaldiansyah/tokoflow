-- 048: Invoices table + invoice_counters + generate_invoice_number RPC

-- Invoice counters for atomic sequential numbering
CREATE TABLE IF NOT EXISTS invoice_counters (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INT NOT NULL,
  last_number INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, year)
);

ALTER TABLE invoice_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own counters"
  ON invoice_counters FOR ALL
  USING (auth.uid() = user_id);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,

  -- Seller snapshot
  seller_name TEXT,
  seller_address TEXT,
  seller_phone TEXT,
  seller_npwp TEXT,
  seller_nitku TEXT,

  -- Buyer snapshot
  buyer_name TEXT,
  buyer_address TEXT,
  buyer_phone TEXT,
  buyer_npwp TEXT,

  -- Items & totals
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal INT NOT NULL DEFAULT 0,
  discount INT NOT NULL DEFAULT 0,
  ppn_rate INT NOT NULL DEFAULT 11,
  ppn_amount INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,

  -- Payment
  paid_amount INT NOT NULL DEFAULT 0,
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'partial', 'unpaid')),

  -- Terms & dates
  due_date TIMESTAMPTZ,
  payment_terms TEXT DEFAULT 'COD' CHECK (payment_terms IN ('NET7', 'NET14', 'NET30', 'COD', 'custom')),
  notes TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  sent_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own invoices"
  ON invoices FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_order_id ON invoices(order_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(user_id, status);
CREATE INDEX idx_invoices_due_date ON invoices(user_id, due_date);

-- RPC: Generate sequential invoice number (auth-gated + bisnis check)
CREATE OR REPLACE FUNCTION generate_invoice_number(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_year INT;
  v_next INT;
BEGIN
  -- Only allow generating for own user
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  v_year := EXTRACT(YEAR FROM now() AT TIME ZONE 'Asia/Jakarta');

  INSERT INTO invoice_counters (user_id, year, last_number)
  VALUES (p_user_id, v_year, 1)
  ON CONFLICT (user_id, year)
  DO UPDATE SET last_number = invoice_counters.last_number + 1
  RETURNING last_number INTO v_next;

  RETURN 'INV-' || v_year || '-' || LPAD(v_next::TEXT, 4, '0');
END;
$$;
