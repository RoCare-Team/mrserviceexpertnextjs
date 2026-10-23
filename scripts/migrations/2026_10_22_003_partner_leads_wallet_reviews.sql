-- =====================================================================
-- Partner leads ("Book now"), coin wallet + Easebuzz recharges, customer
-- sessions and partner reviews. Additive only — new tables, nothing
-- existing is altered.
-- =====================================================================

-- Customers who verified their mobile by OTP through our server (used for
-- booking and reviews). php_customer_id = c_id from the existing customer API.
CREATE TABLE IF NOT EXISTS site_customers (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  mobile           CHAR(10)     NOT NULL,
  name             VARCHAR(120) NOT NULL DEFAULT '',
  php_customer_id  VARCHAR(40)  NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_login_at    DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_site_customers_mobile (mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- A booking made from a partner's card / profile. Stays with the partner
-- for 30 minutes; if not accepted (or rejected) it is forwarded to the CRM.
CREATE TABLE IF NOT EXISTS partner_leads (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  partner_id         INT UNSIGNED NOT NULL,
  customer_id        INT UNSIGNED NOT NULL,
  customer_name      VARCHAR(120) NOT NULL,
  customer_mobile    CHAR(10)     NOT NULL,

  category_id        INT(11)      NOT NULL,
  brand_id           INT(11)      NULL,          -- brand_tb, when booked from a brand page / matched
  php_lead_type      INT          NOT NULL,      -- CRM lead_type
  php_brand_id       INT          NULL,          -- CRM brand id
  brand_name         VARCHAR(80)  NULL,
  php_service_id     INT          NOT NULL,
  service_name       VARCHAR(160) NOT NULL,
  service_price      DECIMAL(10,2) NOT NULL,
  coin_cost          DECIMAL(10,2) NOT NULL,     -- 50% of service_price
  appointment_date   DATE         NOT NULL,
  appointment_time   VARCHAR(40)  NOT NULL,

  house_no           VARCHAR(150) NOT NULL,
  area               VARCHAR(150) NOT NULL,
  landmark           VARCHAR(150) NOT NULL DEFAULT '',
  pincode            CHAR(6)      NOT NULL,
  address_city       VARCHAR(80)  NOT NULL,
  address_state      VARCHAR(80)  NOT NULL,
  php_city_id        INT          NULL,

  page_url           VARCHAR(500) NOT NULL,
  page_city_id       INT(11)      NULL,

  status             ENUM('new','accepted','rejected','expired','completed') NOT NULL DEFAULT 'new',
  expires_at         DATETIME     NOT NULL,
  accepted_at        DATETIME     NULL,
  rejected_at        DATETIME     NULL,
  reject_reason      VARCHAR(255) NULL,
  completed_at       DATETIME     NULL,

  crm_status         ENUM('none','pending','sent','duplicate','failed') NOT NULL DEFAULT 'none',
  crm_attempts       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  crm_sent_at        DATETIME     NULL,
  crm_response       VARCHAR(500) NULL,

  issue_note         VARCHAR(500) NULL,          -- partner "report a problem"
  issue_reported_at  DATETIME     NULL,
  refunded_at        DATETIME     NULL,
  refunded_by        INT          NULL,

  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pl_partner (partner_id, status, created_at),
  KEY idx_pl_expiry (status, expires_at),
  KEY idx_pl_crm (crm_status, crm_attempts),
  KEY idx_pl_dupe (customer_mobile, partner_id, category_id, created_at),
  CONSTRAINT fk_pl_partner  FOREIGN KEY (partner_id)  REFERENCES partners (id),
  CONSTRAINT fk_pl_customer FOREIGN KEY (customer_id) REFERENCES site_customers (id),
  CONSTRAINT fk_pl_category FOREIGN KEY (category_id) REFERENCES category_tb (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Coin wallet (1 coin = ₹1).
CREATE TABLE IF NOT EXISTS partner_wallets (
  partner_id  INT UNSIGNED  NOT NULL,
  balance     DECIMAL(12,2) NOT NULL DEFAULT 0,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (partner_id),
  CONSTRAINT fk_pw_partner FOREIGN KEY (partner_id) REFERENCES partners (id),
  CONSTRAINT chk_pw_balance CHECK (balance >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS partner_payments (
  id            INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  partner_id    INT UNSIGNED  NOT NULL,
  txnid         VARCHAR(40)   NOT NULL,
  amount        DECIMAL(12,2) NOT NULL,
  mode          ENUM('test','live') NOT NULL,
  status        ENUM('initiated','success','failed') NOT NULL DEFAULT 'initiated',
  easebuzz_id   VARCHAR(60)   NULL,
  gateway_msg   VARCHAR(255)  NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pp_txnid (txnid),
  KEY idx_pp_partner (partner_id, created_at),
  CONSTRAINT fk_pp_partner FOREIGN KEY (partner_id) REFERENCES partners (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Ledger. The unique keys make a recharge credit, a lead debit and a lead
-- refund each happen at most once, however often a request is retried.
CREATE TABLE IF NOT EXISTS partner_wallet_txns (
  id             INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  partner_id     INT UNSIGNED  NOT NULL,
  type           ENUM('recharge','lead_debit','refund','adjustment') NOT NULL,
  amount         DECIMAL(12,2) NOT NULL,          -- +credit / -debit
  balance_after  DECIMAL(12,2) NOT NULL,
  lead_id        INT UNSIGNED  NULL,
  payment_id     INT UNSIGNED  NULL,
  note           VARCHAR(255)  NULL,
  actor_type     ENUM('partner','admin','system') NOT NULL,
  actor_id       INT           NULL,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pwt_lead (lead_id, type),
  UNIQUE KEY uq_pwt_payment (payment_id),
  KEY idx_pwt_partner (partner_id, created_at),
  CONSTRAINT fk_pwt_partner FOREIGN KEY (partner_id) REFERENCES partners (id),
  CONSTRAINT fk_pwt_lead    FOREIGN KEY (lead_id)    REFERENCES partner_leads (id),
  CONSTRAINT fk_pwt_payment FOREIGN KEY (payment_id) REFERENCES partner_payments (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Reviews: any OTP-verified customer, one per partner (editable), shown
-- immediately; admin or the partner can remove.
CREATE TABLE IF NOT EXISTS partner_reviews (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  partner_id     INT UNSIGNED NOT NULL,
  customer_id    INT UNSIGNED NOT NULL,
  rating         TINYINT UNSIGNED NOT NULL,
  comment        VARCHAR(1000) NOT NULL DEFAULT '',
  status         ENUM('published','removed') NOT NULL DEFAULT 'published',
  removed_by     ENUM('admin','partner') NULL,
  removed_by_id  INT          NULL,
  removed_at     DATETIME     NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pr (partner_id, customer_id),
  KEY idx_pr_public (partner_id, status, created_at),
  CONSTRAINT fk_pr_partner  FOREIGN KEY (partner_id)  REFERENCES partners (id) ON DELETE CASCADE,
  CONSTRAINT fk_pr_customer FOREIGN KEY (customer_id) REFERENCES site_customers (id),
  CONSTRAINT chk_pr_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
