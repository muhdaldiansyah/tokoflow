-- Migration 086 — per-merchant Billplz keys for in-flow customer payments.
--
-- Architecture: ADR 0001 (docs/decisions/0001-merchant-payments.md).
-- Each merchant connects their OWN Billplz account; Tokoflow uses their key
-- to create bills payable to them. Funds settle directly to merchant's bank
-- via Billplz; Tokoflow never touches the money.
--
-- All key material is stored encrypted at rest via lib/crypto/secret-box
-- (AES-256-GCM with MYINVOIS_SECRET_KEY-derived key — same envelope as the
-- existing myinvois_client_secret_enc column).
--
-- Default OFF for everyone. Each merchant flips on individually after
-- pasting + validating their keys via the /settings onboarding wizard.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS billplz_api_key_enc TEXT,
  ADD COLUMN IF NOT EXISTS billplz_x_signature_key_enc TEXT,
  ADD COLUMN IF NOT EXISTS billplz_collection_id TEXT,
  ADD COLUMN IF NOT EXISTS billplz_payment_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS billplz_kyb_status TEXT;

COMMENT ON COLUMN profiles.billplz_api_key_enc IS
  'Encrypted Billplz API key for THIS merchant (not Tokoflow). Used to create bills payable to merchant. Funds settle to merchant''s Billplz account, never Tokoflow.';
COMMENT ON COLUMN profiles.billplz_x_signature_key_enc IS
  'Encrypted X-Signature key for THIS merchant. Per-merchant webhook signature verification.';
COMMENT ON COLUMN profiles.billplz_collection_id IS
  'Merchant''s Billplz collection ID. All bills created for this merchant land in this collection.';
COMMENT ON COLUMN profiles.billplz_payment_enabled IS
  'Feature flag — when TRUE, /api/public/orders creates a Billplz bill on order submit and the storefront redirects customer to hosted checkout. Default FALSE.';
COMMENT ON COLUMN profiles.billplz_kyb_status IS
  'Merchant''s KYB status reflected from Billplz (pending / verified / rejected). Optional — we trust Billplz to gate payments at their end.';
