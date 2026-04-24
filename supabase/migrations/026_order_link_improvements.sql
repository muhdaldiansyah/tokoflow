-- 026: Order link improvements — product images
-- Add image_url to products table
ALTER TABLE products ADD COLUMN image_url TEXT;

-- Create product-images storage bucket (public, 1MB limit, image types only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 1048576, ARRAY['image/jpeg','image/png','image/webp']);

-- RLS policies for product-images bucket
CREATE POLICY "Users can upload product images" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view product images" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Users can update product images" ON storage.objects FOR UPDATE
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete product images" ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
