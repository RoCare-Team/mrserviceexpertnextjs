-- =====================================================================
-- Mr. Service Expert — Join as a Partner (migration 001)
--
-- Target: MariaDB 10.11 (cPanel). Additive only — creates new tables,
-- never alters/drops existing ones. Safe to re-run (IF NOT EXISTS /
-- INSERT IGNORE).
--
-- Reuses existing masters:
--   category_tb  → appliance categories
--   brand_tb     → brands (each brand row belongs to one category)
--   city_tb      → cities AND localities (a locality is a city_tb row that
--                  has a parent in city_parent_map)
--   states       → state dropdown for the business address
--   admin_users  → reviewing administrators
-- =====================================================================

-- 1) Locality hierarchy. A city_tb row listed here as `city_id` is a
--    locality of `parent_city_id`. Seeded from the legacy MyISAM
--    `related_city` table (which the site no longer reads).
CREATE TABLE IF NOT EXISTS city_parent_map (
  city_id         INT(11)   NOT NULL,
  parent_city_id  INT(11)   NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (city_id),
  KEY idx_cpm_parent (parent_city_id),
  CONSTRAINT fk_cpm_city   FOREIGN KEY (city_id)        REFERENCES city_tb (id) ON DELETE CASCADE,
  CONSTRAINT fk_cpm_parent FOREIGN KEY (parent_city_id) REFERENCES city_tb (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO city_parent_map (city_id, parent_city_id)
SELECT r.city_id, CAST(r.parent_city AS UNSIGNED)
  FROM related_city r
  JOIN city_tb c ON c.id = r.city_id
  JOIN city_tb p ON p.id = CAST(r.parent_city AS UNSIGNED)
 WHERE r.city_id <> CAST(r.parent_city AS UNSIGNED);

-- 2) Partner-facing service types per category (admin-managed).
CREATE TABLE IF NOT EXISTS partner_service_types (
  id           INT(11)      NOT NULL AUTO_INCREMENT,
  category_id  INT(11)      NOT NULL,
  name         VARCHAR(120) NOT NULL,
  slug         VARCHAR(140) NOT NULL,
  sort_order   INT          NOT NULL DEFAULT 0,
  status       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pst_cat_slug (category_id, slug),
  KEY idx_pst_cat_status (category_id, status, sort_order),
  CONSTRAINT fk_pst_category FOREIGN KEY (category_id) REFERENCES category_tb (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 3) Partners (one row per normalised 10-digit mobile).
CREATE TABLE IF NOT EXISTS partners (
  id                     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  mobile                 CHAR(10)     NOT NULL,
  full_name              VARCHAR(120) NOT NULL DEFAULT '',
  mobile_verified_at     DATETIME     NULL,
  status                 ENUM('draft','pending','info_requested','approved','rejected','suspended') NOT NULL DEFAULT 'draft',
  is_listed              TINYINT(1)   NOT NULL DEFAULT 0,
  slug                   VARCHAR(160) NULL,
  current_step           TINYINT      NOT NULL DEFAULT 1,
  version                INT UNSIGNED NOT NULL DEFAULT 1,

  business_type          ENUM('individual','shop','service_center','company') NULL,
  business_name          VARCHAR(150) NULL,
  description            TEXT         NULL,
  experience_years       TINYINT UNSIGNED NULL,
  gstin                  CHAR(15)     NULL,
  business_email         VARCHAR(190) NULL,
  operating_hours        VARCHAR(160) NULL,
  contact_preference     ENUM('call','whatsapp','both') NULL,
  show_phone_publicly    TINYINT(1)   NOT NULL DEFAULT 0,
  logo_key               VARCHAR(300) NULL,
  shop_image_key         VARCHAR(300) NULL,

  address_line           VARCHAR(255) NULL,
  address_state_id       INT(11)      NULL,
  address_city_id        INT(11)      NULL,
  address_locality       VARCHAR(150) NULL,
  address_pincode        CHAR(6)      NULL,

  -- Admin verification is tracked separately from approval.
  identity_verified_at   DATETIME     NULL,
  business_verified_at   DATETIME     NULL,
  gst_verified_at        DATETIME     NULL,

  review_reason          TEXT         NULL,   -- latest reject / info-request / suspend reason shown to partner
  admin_note             TEXT         NULL,   -- internal only
  submitted_at           DATETIME     NULL,
  approved_at            DATETIME     NULL,
  reviewed_at            DATETIME     NULL,
  reviewed_by            INT          NULL,
  last_login_at          DATETIME     NULL,
  created_at             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at             DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_partners_mobile (mobile),
  UNIQUE KEY uq_partners_slug (slug),
  KEY idx_partners_public (status, is_listed, deleted_at),
  KEY idx_partners_status_submitted (status, submitted_at),
  KEY idx_partners_business (business_name),
  CONSTRAINT fk_partners_state FOREIGN KEY (address_state_id) REFERENCES states (id),
  CONSTRAINT fk_partners_city  FOREIGN KEY (address_city_id)  REFERENCES city_tb (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 4) OTP send/verify ledger. The OTP itself is generated and checked by the
--    existing SMS API; this table enforces cooldown, hourly caps and
--    attempt limits on our side.
CREATE TABLE IF NOT EXISTS partner_otp_challenges (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  mobile       CHAR(10)     NOT NULL,
  ip           VARCHAR(45)  NOT NULL DEFAULT '',
  attempts     TINYINT UNSIGNED NOT NULL DEFAULT 0,
  status       ENUM('sent','verified','failed','expired') NOT NULL DEFAULT 'sent',
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at   DATETIME     NOT NULL,
  verified_at  DATETIME     NULL,
  PRIMARY KEY (id),
  KEY idx_otp_mobile_created (mobile, created_at),
  KEY idx_otp_ip_created (ip, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 5) Selections.
CREATE TABLE IF NOT EXISTS partner_categories (
  partner_id   INT UNSIGNED NOT NULL,
  category_id  INT(11)      NOT NULL,
  PRIMARY KEY (partner_id, category_id),
  KEY idx_pc_category (category_id, partner_id),
  CONSTRAINT fk_pc_partner  FOREIGN KEY (partner_id)  REFERENCES partners (id) ON DELETE CASCADE,
  CONSTRAINT fk_pc_category FOREIGN KEY (category_id) REFERENCES category_tb (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS partner_services (
  partner_id       INT UNSIGNED NOT NULL,
  service_type_id  INT(11)      NOT NULL,
  category_id      INT(11)      NOT NULL,
  PRIMARY KEY (partner_id, service_type_id),
  KEY idx_ps_service (service_type_id, partner_id),
  CONSTRAINT fk_ps_partner FOREIGN KEY (partner_id)      REFERENCES partners (id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_service FOREIGN KEY (service_type_id) REFERENCES partner_service_types (id),
  CONSTRAINT fk_ps_pc      FOREIGN KEY (partner_id, category_id) REFERENCES partner_categories (partner_id, category_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- brand_id NULL ⇒ "Other" with a custom name awaiting admin review.
CREATE TABLE IF NOT EXISTS partner_brands (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  partner_id     INT UNSIGNED NOT NULL,
  category_id    INT(11)      NOT NULL,
  brand_id       INT(11)      NULL,
  custom_name    VARCHAR(80)  NULL,
  custom_key     VARCHAR(80)  AS (IFNULL(brand_id, CONCAT('c:', LOWER(custom_name)))) STORED,
  custom_status  ENUM('pending','approved','rejected') NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pb (partner_id, category_id, custom_key),
  KEY idx_pb_brand (brand_id, partner_id),
  CONSTRAINT fk_pb_partner FOREIGN KEY (partner_id) REFERENCES partners (id) ON DELETE CASCADE,
  CONSTRAINT fk_pb_brand   FOREIGN KEY (brand_id)   REFERENCES brand_tb (id),
  CONSTRAINT fk_pb_pc      FOREIGN KEY (partner_id, category_id) REFERENCES partner_categories (partner_id, category_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Coverage. locality_id NULL ⇒ whole city (city-wide).
--   city-wide row      → listed on that city's pages only
--   locality row       → listed on that locality's pages only
CREATE TABLE IF NOT EXISTS partner_service_areas (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  partner_id    INT UNSIGNED NOT NULL,
  city_id       INT(11)      NOT NULL,
  locality_id   INT(11)      NULL,
  locality_key  INT(11)      AS (IFNULL(locality_id, 0)) STORED,
  is_primary    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_psa (partner_id, city_id, locality_key),
  KEY idx_psa_city (city_id, locality_key, partner_id),
  KEY idx_psa_locality (locality_id, partner_id),
  CONSTRAINT fk_psa_partner  FOREIGN KEY (partner_id)  REFERENCES partners (id) ON DELETE CASCADE,
  CONSTRAINT fk_psa_city     FOREIGN KEY (city_id)     REFERENCES city_tb (id),
  CONSTRAINT fk_psa_locality FOREIGN KEY (locality_id) REFERENCES city_tb (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Localities a partner asked for that don't exist in city_tb yet.
CREATE TABLE IF NOT EXISTS partner_location_requests (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  partner_id         INT UNSIGNED NOT NULL,
  city_id            INT(11)      NOT NULL,
  requested_name     VARCHAR(120) NOT NULL,
  status             ENUM('pending','mapped','rejected') NOT NULL DEFAULT 'pending',
  mapped_locality_id INT(11)      NULL,
  resolved_by        INT          NULL,
  resolved_at        DATETIME     NULL,
  created_at         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_plr (partner_id, city_id, requested_name),
  KEY idx_plr_status (status, created_at),
  CONSTRAINT fk_plr_partner FOREIGN KEY (partner_id) REFERENCES partners (id) ON DELETE CASCADE,
  CONSTRAINT fk_plr_city    FOREIGN KEY (city_id)    REFERENCES city_tb (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Private documents (S3 prefix partner-docs/ — never public).
CREATE TABLE IF NOT EXISTS partner_documents (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  partner_id     INT UNSIGNED NOT NULL,
  doc_type       ENUM('gst_certificate','id_proof','business_proof','other') NOT NULL,
  s3_key         VARCHAR(300) NOT NULL,
  mime_type      VARCHAR(60)  NOT NULL,
  size_bytes     INT UNSIGNED NOT NULL,
  original_name  VARCHAR(160) NOT NULL DEFAULT '',
  review_status  ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  review_note    VARCHAR(500) NULL,
  reviewed_by    INT          NULL,
  reviewed_at    DATETIME     NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at     DATETIME     NULL,
  PRIMARY KEY (id),
  KEY idx_pd_partner (partner_id, deleted_at),
  CONSTRAINT fk_pd_partner FOREIGN KEY (partner_id) REFERENCES partners (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Audit trail for every status / listing / verification change.
CREATE TABLE IF NOT EXISTS partner_status_history (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  partner_id   INT UNSIGNED NOT NULL,
  action       VARCHAR(40)  NOT NULL,
  from_status  VARCHAR(20)  NULL,
  to_status    VARCHAR(20)  NULL,
  reason       TEXT         NULL,
  actor_type   ENUM('partner','admin','system') NOT NULL,
  actor_id     INT          NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_psh_partner (partner_id, created_at),
  CONSTRAINT fk_psh_partner FOREIGN KEY (partner_id) REFERENCES partners (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS partner_consents (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  partner_id    INT UNSIGNED NOT NULL,
  consent_type  ENUM('terms','privacy','public_display') NOT NULL,
  version       VARCHAR(20)  NOT NULL,
  ip            VARCHAR(45)  NOT NULL DEFAULT '',
  user_agent    VARCHAR(255) NOT NULL DEFAULT '',
  accepted_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_pcons_partner (partner_id, consent_type),
  CONSTRAINT fk_pcons_partner FOREIGN KEY (partner_id) REFERENCES partners (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- 6) Seed service types for the ten appliance categories (by category_url,
--    so it works whatever the ids are). Admins can edit these later.
INSERT IGNORE INTO partner_service_types (category_id, name, slug, sort_order)
SELECT c.id, s.name, s.slug, s.sort_order
  FROM category_tb c
  JOIN (
              SELECT 'ro-water-purifier' cat, 'Repair Service' name, 'repair' slug, 1 sort_order
    UNION ALL SELECT 'ro-water-purifier', 'Installation', 'installation', 2
    UNION ALL SELECT 'ro-water-purifier', 'Uninstallation', 'uninstallation', 3
    UNION ALL SELECT 'ro-water-purifier', 'AMC', 'amc', 4
    UNION ALL SELECT 'ro-water-purifier', 'Filter Replacement', 'filter-replacement', 5
    UNION ALL SELECT 'ro-water-purifier', 'Membrane Replacement', 'membrane-replacement', 6
    UNION ALL SELECT 'ro-water-purifier', 'New Product Sales', 'sales', 7
    UNION ALL SELECT 'ac', 'Repair', 'repair', 1
    UNION ALL SELECT 'ac', 'Installation', 'installation', 2
    UNION ALL SELECT 'ac', 'Uninstallation', 'uninstallation', 3
    UNION ALL SELECT 'ac', 'Gas Refilling', 'gas-refilling', 4
    UNION ALL SELECT 'ac', 'General Service', 'general-service', 5
    UNION ALL SELECT 'ac', 'AMC', 'amc', 6
    UNION ALL SELECT 'washing-machine-repair', 'Repair', 'repair', 1
    UNION ALL SELECT 'washing-machine-repair', 'Installation', 'installation', 2
    UNION ALL SELECT 'washing-machine-repair', 'Uninstallation', 'uninstallation', 3
    UNION ALL SELECT 'washing-machine-repair', 'General Service', 'general-service', 4
    UNION ALL SELECT 'washing-machine-repair', 'AMC', 'amc', 5
    UNION ALL SELECT 'refrigerator-repair', 'Repair', 'repair', 1
    UNION ALL SELECT 'refrigerator-repair', 'Gas Refilling', 'gas-refilling', 2
    UNION ALL SELECT 'refrigerator-repair', 'General Service', 'general-service', 3
    UNION ALL SELECT 'refrigerator-repair', 'AMC', 'amc', 4
    UNION ALL SELECT 'geyser-repair', 'Repair', 'repair', 1
    UNION ALL SELECT 'geyser-repair', 'Installation', 'installation', 2
    UNION ALL SELECT 'geyser-repair', 'Uninstallation', 'uninstallation', 3
    UNION ALL SELECT 'geyser-repair', 'General Service', 'general-service', 4
    UNION ALL SELECT 'microwav-repair', 'Repair', 'repair', 1
    UNION ALL SELECT 'microwav-repair', 'Installation', 'installation', 2
    UNION ALL SELECT 'microwav-repair', 'General Service', 'general-service', 3
    UNION ALL SELECT 'led-tv-repair', 'Repair', 'repair', 1
    UNION ALL SELECT 'led-tv-repair', 'Installation / Wall Mounting', 'installation', 2
    UNION ALL SELECT 'led-tv-repair', 'Uninstallation', 'uninstallation', 3
    UNION ALL SELECT 'led-tv-repair', 'Panel Repair', 'panel-repair', 4
    UNION ALL SELECT 'kitchen-chimney-repair', 'Repair', 'repair', 1
    UNION ALL SELECT 'kitchen-chimney-repair', 'Installation', 'installation', 2
    UNION ALL SELECT 'kitchen-chimney-repair', 'Deep Cleaning', 'deep-cleaning', 3
    UNION ALL SELECT 'kitchen-chimney-repair', 'AMC', 'amc', 4
    UNION ALL SELECT 'air-purifier-repair', 'Repair', 'repair', 1
    UNION ALL SELECT 'air-purifier-repair', 'Installation', 'installation', 2
    UNION ALL SELECT 'air-purifier-repair', 'Filter Replacement', 'filter-replacement', 3
    UNION ALL SELECT 'vacuum-cleaner-repair', 'Repair', 'repair', 1
    UNION ALL SELECT 'vacuum-cleaner-repair', 'General Service', 'general-service', 2
  ) s ON s.cat = c.category_url;
