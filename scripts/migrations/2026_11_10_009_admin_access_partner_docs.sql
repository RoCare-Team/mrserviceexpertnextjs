-- =====================================================================
-- Admin access control + partner refund % + document requests.
--
--   admin_users.team      label shown in the console (hr, seo, sales, other)
--   admin_users.modules   comma-separated console modules the admin may open
--                         (NULL = every module — keeps existing admins as-is)
--   partner_settings      key/value settings for the partner system
--                         (lead_refund_percent = default % of coins refunded)
--   partner_leads.refund_*  what was actually refunded for a lead
--   partner_document_requests  admin asks an (approved) partner for a document
--
-- Additive only: no existing column or row is changed.
-- =====================================================================

ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS team    VARCHAR(20)  NULL,
  ADD COLUMN IF NOT EXISTS modules VARCHAR(500) NULL;

CREATE TABLE IF NOT EXISTS partner_settings (
  setting_key    VARCHAR(80)  NOT NULL,
  setting_value  TEXT         NULL,
  updated_by     INT          NULL,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO partner_settings (setting_key, setting_value) VALUES
  ('lead_refund_percent', '100');

ALTER TABLE partner_leads
  ADD COLUMN IF NOT EXISTS refund_coins   DECIMAL(10,2)    NULL AFTER refunded_by,
  ADD COLUMN IF NOT EXISTS refund_percent TINYINT UNSIGNED NULL AFTER refund_coins;

ALTER TABLE partner_documents
  MODIFY doc_type ENUM('aadhaar','gst_certificate','id_proof','business_proof','address_proof','bank_proof','shop_photo','other') NOT NULL;

CREATE TABLE IF NOT EXISTS partner_document_requests (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  partner_id    INT UNSIGNED NOT NULL,
  doc_type      VARCHAR(40)  NOT NULL,
  note          VARCHAR(500) NULL,
  due_date      DATE         NULL,
  -- open → submitted (partner uploaded) → completed (admin verified)
  --   a rejected upload sends it back to open; admin may cancel any time
  status        ENUM('open','submitted','completed','cancelled') NOT NULL DEFAULT 'open',
  document_id   INT UNSIGNED NULL,
  review_note   VARCHAR(500) NULL,
  requested_by  INT          NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  submitted_at  DATETIME     NULL,
  closed_at     DATETIME     NULL,
  PRIMARY KEY (id),
  KEY idx_pdr_partner (partner_id, status),
  KEY idx_pdr_status (status, created_at),
  CONSTRAINT fk_pdr_partner FOREIGN KEY (partner_id) REFERENCES partners (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
