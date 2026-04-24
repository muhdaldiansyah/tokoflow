-- Add qris_url column for operator's static QRIS image
ALTER TABLE profiles ADD COLUMN qris_url TEXT;

-- Create storage bucket for QRIS codes (public — displayed on receipts and order pages)
INSERT INTO storage.buckets (id, name, public) VALUES ('qris-codes', 'qris-codes', true);

-- Users can upload to their own folder
CREATE POLICY "Users can upload QRIS codes"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'qris-codes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Anyone can view QRIS codes (public bucket)
CREATE POLICY "Anyone can view QRIS codes"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'qris-codes');

-- Users can update/overwrite their own QRIS
CREATE POLICY "Users can update QRIS codes"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'qris-codes' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Users can delete their own QRIS
CREATE POLICY "Users can delete QRIS codes"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'qris-codes' AND (storage.foldername(name))[1] = auth.uid()::text);
