-- Add image attachment support to orders (design reference, greeting card, etc.)
-- Array of Supabase Storage URLs, max 3 images
ALTER TABLE orders ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Create storage bucket for order images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('order-images', 'order-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: authenticated users can upload to their own folder
CREATE POLICY "Users upload own order images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'order-images' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policy: anyone can read (public bucket for image display)
CREATE POLICY "Public read order images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'order-images');

-- Storage policy: users can delete own images
CREATE POLICY "Users delete own order images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'order-images' AND (storage.foldername(name))[1] = auth.uid()::text);
