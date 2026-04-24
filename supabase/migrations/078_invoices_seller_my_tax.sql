-- Migration 078: Add seller-side MY tax snapshot columns to invoices.
-- Migration 077 added buyer_tin / buyer_brn / buyer_sst_id but the seller
-- identity was still being snapshotted through the legacy seller_npwp /
-- seller_nitku columns. This captures the TIN / BRN / SST registration id
-- of the merchant at the moment the invoice was issued, mirroring the
-- buyer-side columns.
--
-- The legacy seller_npwp / seller_nitku columns are kept during the
-- migration window for compat with PDF / WA / InvoiceDetail code paths.
-- A later migration (079+) will drop them together with the other ID
-- legacy columns.

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS seller_tin TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS seller_brn TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS seller_sst_registration_id TEXT;

COMMENT ON COLUMN invoices.seller_tin IS
  'LHDN Taxpayer Identification Number at time of issue. Snapshot, not FK.';
COMMENT ON COLUMN invoices.seller_brn IS
  'Malaysian Business Registration Number at time of issue. Snapshot, not FK.';
COMMENT ON COLUMN invoices.seller_sst_registration_id IS
  'Sales & Service Tax registration id at time of issue. NULL if merchant is below SST threshold.';
