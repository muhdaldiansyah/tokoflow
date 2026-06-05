-- Page views tracking for public store pages (no auth required)
CREATE TABLE page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  referrer TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fast queries by business + date
CREATE INDEX idx_page_views_business_date ON page_views (business_id, created_at DESC);

-- Product views tracking
CREATE TABLE product_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT NOT NULL,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Fast queries by business + product
CREATE INDEX idx_product_views_business ON product_views (business_id, created_at DESC);

-- Total views counter on profiles for quick access
ALTER TABLE profiles ADD COLUMN total_views INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN views_today INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN views_today_date DATE;
