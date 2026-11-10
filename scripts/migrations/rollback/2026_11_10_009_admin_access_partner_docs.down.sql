-- Reverts 2026_11_10_009. Run only if no partner document uses the new
-- types (address_proof, bank_proof, shop_photo) — the ENUM change fails otherwise.
DROP TABLE IF EXISTS partner_document_requests;
ALTER TABLE partner_documents
  MODIFY doc_type ENUM('aadhaar','gst_certificate','id_proof','business_proof','other') NOT NULL;
ALTER TABLE partner_leads DROP COLUMN IF EXISTS refund_percent, DROP COLUMN IF EXISTS refund_coins;
DROP TABLE IF EXISTS partner_settings;
ALTER TABLE admin_users DROP COLUMN IF EXISTS modules, DROP COLUMN IF EXISTS team;
DELETE FROM schema_migrations_mse WHERE name = '2026_11_10_009_admin_access_partner_docs.sql';
