-- =====================================================================
-- Partner dashboard upgrade: availability, session revocation, low-balance
-- alert, lead notes / completion details, full payment records, review
-- replies, photo gallery, profile change requests, notifications and web
-- push subscriptions. Touches only partner tables created by 001–003.
-- =====================================================================

ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS is_available       TINYINT(1)   NOT NULL DEFAULT 1 AFTER is_listed,
  ADD COLUMN IF NOT EXISTS low_balance_alert  INT UNSIGNED NOT NULL DEFAULT 200,
  ADD COLUMN IF NOT EXISTS session_version    INT UNSIGNED NOT NULL DEFAULT 1;

ALTER TABLE partner_leads
  ADD COLUMN IF NOT EXISTS partner_note   VARCHAR(1000) NULL,
  ADD COLUMN IF NOT EXISTS final_amount   DECIMAL(10,2) NULL,
  ADD COLUMN IF NOT EXISTS work_done      VARCHAR(500)  NULL;

-- Everything Easebuzz tells us, for success AND failure.
ALTER TABLE partner_payments
  ADD COLUMN IF NOT EXISTS email          VARCHAR(190)  NULL AFTER amount,
  ADD COLUMN IF NOT EXISTS payment_mode   VARCHAR(40)   NULL,
  ADD COLUMN IF NOT EXISTS bank_ref_num   VARCHAR(80)   NULL,
  ADD COLUMN IF NOT EXISTS card_or_vpa    VARCHAR(80)   NULL,     -- masked card / UPI id as sent by gateway
  ADD COLUMN IF NOT EXISTS bank_name      VARCHAR(80)   NULL,
  ADD COLUMN IF NOT EXISTS error_message  VARCHAR(255)  NULL,
  ADD COLUMN IF NOT EXISTS gateway_status VARCHAR(40)   NULL,
  ADD COLUMN IF NOT EXISTS raw_response   TEXT          NULL,     -- gateway POST minus hash
  ADD COLUMN IF NOT EXISTS completed_at   DATETIME      NULL,
  ADD INDEX IF NOT EXISTS idx_pp_status (status, created_at);

ALTER TABLE partner_reviews
  ADD COLUMN IF NOT EXISTS reply       VARCHAR(1000) NULL,
  ADD COLUMN IF NOT EXISTS replied_at  DATETIME      NULL;

CREATE TABLE IF NOT EXISTS partner_photos (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  partner_id  INT UNSIGNED NOT NULL,
  s3_key      VARCHAR(300) NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pph_partner (partner_id, sort_order),
  CONSTRAINT fk_pph_partner FOREIGN KEY (partner_id) REFERENCES partners (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Identity / catalogue changes by an approved partner wait here; the live
-- profile keeps its current data until an admin approves.
CREATE TABLE IF NOT EXISTS partner_change_requests (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  partner_id   INT UNSIGNED NOT NULL,
  payload      TEXT         NOT NULL,     -- JSON
  status       ENUM('pending','approved','rejected','superseded') NOT NULL DEFAULT 'pending',
  reason       VARCHAR(1000) NULL,
  reviewed_by  INT          NULL,
  reviewed_at  DATETIME     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pcr_partner (partner_id, status),
  KEY idx_pcr_status (status, created_at),
  CONSTRAINT fk_pcr_partner FOREIGN KEY (partner_id) REFERENCES partners (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS partner_notifications (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  partner_id  INT UNSIGNED NOT NULL,
  type        VARCHAR(40)  NOT NULL,
  title       VARCHAR(160) NOT NULL,
  body        VARCHAR(500) NOT NULL DEFAULT '',
  link        VARCHAR(255) NULL,
  read_at     DATETIME     NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pn_partner (partner_id, read_at, id),
  CONSTRAINT fk_pn_partner FOREIGN KEY (partner_id) REFERENCES partners (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS partner_push_subscriptions (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  partner_id  INT UNSIGNED NOT NULL,
  endpoint    VARCHAR(600) NOT NULL,
  endpoint_hash CHAR(64)   NOT NULL,
  p256dh      VARCHAR(200) NOT NULL,
  auth        VARCHAR(100) NOT NULL,
  user_agent  VARCHAR(255) NOT NULL DEFAULT '',
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_ok_at  DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pps_endpoint (endpoint_hash),
  KEY idx_pps_partner (partner_id),
  CONSTRAINT fk_pps_partner FOREIGN KEY (partner_id) REFERENCES partners (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
