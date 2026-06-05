-- Add proof_url column for payment proof images
ALTER TABLE orders ADD COLUMN proof_url TEXT;

-- Create storage bucket for payment proofs (public — proof images aren't sensitive)
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true);

-- Users can upload to their own folder
CREATE POLICY "Users can upload payment proofs"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Anyone can view payment proofs (public bucket)
CREATE POLICY "Anyone can view payment proofs"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-proofs');

-- Users can update/overwrite their own proofs
CREATE POLICY "Users can update payment proofs"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'payment-proofs' AND (storage.foldername(name))[1] = auth.uid()::text);
