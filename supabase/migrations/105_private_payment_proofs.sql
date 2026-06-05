-- Migration 105: Make payment-proofs bucket private
--
-- Context: payment screenshots uploaded by customers contain their full bank
-- app screen (balance, account number, transaction history). Migration 012
-- originally created this bucket as public because "proof images aren't
-- sensitive" — that assumption was wrong. The upload endpoint now generates
-- long-lived signed URLs (10-year expiry) instead of public URLs, so existing
-- dashboard references continue to work. New uploads after this migration are
-- only accessible via signed URL, not by guessing the storage path.

UPDATE storage.buckets
SET public = false
WHERE id = 'payment-proofs';

-- Drop the permissive "anyone can view" SELECT policy.
DROP POLICY IF EXISTS "Anyone can view payment proofs" ON storage.objects;

-- Merchants can read proofs for their own orders (service role bypasses RLS
-- anyway, so this covers the merchant dashboard via authenticated session).
CREATE POLICY "Merchants can view their order payment proofs"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'payment-proofs'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.orders
      WHERE id::text = (storage.foldername(name))[1]
        AND user_id = auth.uid()
    )
  );
