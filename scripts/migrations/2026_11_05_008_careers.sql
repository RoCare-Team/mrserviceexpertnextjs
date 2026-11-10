-- =====================================================================
-- Career & Recruitment system.
--
--   career_jobs               job postings (never hard-deleted — archived)
--   career_applications       candidate applications (+ private S3 resume key)
--   career_application_notes  internal admin notes (never public)
--   career_interviews         interview rounds per application
--   career_application_logs   full status history + activity timeline
--   career_settings           configurable careers / recruitment settings
--   career_resume_uploads     presigned uploads not yet attached to an
--                             application — swept by the careers cron
--   career_admin_activity     audit trail of admin actions (jobs, exports…)
--
-- Applications reference jobs with ON DELETE RESTRICT so a job can never
-- disappear from under its applications.
-- =====================================================================

CREATE TABLE IF NOT EXISTS career_jobs (
  id                      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title                   VARCHAR(160) NOT NULL,
  slug                    VARCHAR(180) NOT NULL,
  department              VARCHAR(100) NOT NULL,
  short_description       VARCHAR(500) NOT NULL DEFAULT '',
  description             MEDIUMTEXT   NULL,          -- sanitized HTML
  responsibilities        MEDIUMTEXT   NULL,          -- sanitized HTML
  requirements            MEDIUMTEXT   NULL,          -- sanitized HTML
  additional_requirements MEDIUMTEXT   NULL,          -- sanitized HTML
  skills                  VARCHAR(1000) NOT NULL DEFAULT '', -- comma separated
  employment_type         ENUM('full_time','part_time','internship','contract','work_from_home') NOT NULL DEFAULT 'full_time',
  experience_min          DECIMAL(4,1) UNSIGNED NOT NULL DEFAULT 0,  -- years
  experience_max          DECIMAL(4,1) UNSIGNED NULL,
  qualification           VARCHAR(200) NOT NULL DEFAULT '',
  vacancies               SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  salary_type             ENUM('fixed','range','negotiable','company_policy') NULL,
  salary_min              INT UNSIGNED NULL,
  salary_max              INT UNSIGNED NULL,
  salary_period           ENUM('month','year') NOT NULL DEFAULT 'month',
  country                 VARCHAR(80)  NOT NULL DEFAULT 'India',
  state                   VARCHAR(80)  NOT NULL DEFAULT '',
  city                    VARCHAR(80)  NOT NULL DEFAULT '',
  postal_code             VARCHAR(12)  NULL,
  work_mode               ENUM('office','remote','hybrid') NOT NULL DEFAULT 'office',
  office_address          VARCHAR(300) NULL,
  application_deadline    DATE         NULL,
  expiry_date             DATE         NULL,
  publish_date            DATETIME     NULL,
  contact_email           VARCHAR(190) NULL,
  contact_person          VARCHAR(120) NULL,
  status                  ENUM('draft','published','closed','archived') NOT NULL DEFAULT 'draft',
  closed_reason           ENUM('manual','expired') NULL,
  is_featured             TINYINT(1)   NOT NULL DEFAULT 0,
  show_on_website         TINYINT(1)   NOT NULL DEFAULT 1,
  meta_title              VARCHAR(190) NULL,
  meta_description        VARCHAR(320) NULL,
  canonical_url           VARCHAR(300) NULL,
  created_by              INT          NULL,
  updated_by              INT          NULL,
  created_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at            DATETIME     NULL,           -- first publish
  closed_at               DATETIME     NULL,
  archived_at             DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cj_slug (slug),
  KEY idx_cj_listing (status, show_on_website, publish_date),
  KEY idx_cj_city (city),
  KEY idx_cj_department (department),
  KEY idx_cj_deadline (application_deadline),
  KEY idx_cj_expiry (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS career_applications (
  id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_code    VARCHAR(20)  NULL,               -- APP-2026-000001 (set right after insert)
  job_id              INT UNSIGNED NOT NULL,
  full_name           VARCHAR(120) NOT NULL,
  mobile              VARCHAR(15)  NOT NULL,
  email               VARCHAR(190) NOT NULL,
  current_city        VARCHAR(80)  NOT NULL,
  total_experience    DECIMAL(4,1) UNSIGNED NOT NULL DEFAULT 0, -- years
  current_company     VARCHAR(150) NULL,
  current_salary      VARCHAR(60)  NULL,
  expected_salary     VARCHAR(60)  NULL,
  notice_period       VARCHAR(60)  NULL,
  cover_letter        TEXT         NULL,
  status              ENUM('new','under_review','shortlisted','interview_scheduled','selected','rejected','hired','withdrawn') NOT NULL DEFAULT 'new',
  status_changed_at   DATETIME     NULL,
  resume_original_name VARCHAR(255) NULL,
  resume_key          VARCHAR(255) NULL,               -- private S3 object key, never a public URL
  resume_mime         VARCHAR(120) NULL,
  resume_size         INT UNSIGNED NULL,               -- bytes
  consent_at          DATETIME     NULL,
  ip_address          VARCHAR(45)  NULL,
  user_agent          VARCHAR(255) NULL,
  anonymized_at       DATETIME     NULL,               -- privacy erasure (record kept for stats)
  created_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ca_code (application_code),
  KEY idx_ca_job_status (job_id, status),
  KEY idx_ca_status (status),
  KEY idx_ca_created (created_at),
  KEY idx_ca_city (current_city),
  KEY idx_ca_dupe_email (job_id, email),
  KEY idx_ca_dupe_mobile (job_id, mobile),
  KEY idx_ca_ip (ip_address, created_at),
  CONSTRAINT fk_ca_job FOREIGN KEY (job_id) REFERENCES career_jobs (id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS career_application_notes (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_id  INT UNSIGNED NOT NULL,
  admin_id        INT          NULL,
  admin_name      VARCHAR(120) NULL,
  note            TEXT         NOT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_can_app (application_id, created_at),
  CONSTRAINT fk_can_app FOREIGN KEY (application_id) REFERENCES career_applications (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS career_interviews (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_id   INT UNSIGNED NOT NULL,
  round_no         TINYINT UNSIGNED NOT NULL DEFAULT 1,
  round_name       VARCHAR(80)  NOT NULL DEFAULT '',
  scheduled_at     DATETIME     NOT NULL,
  duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  mode             ENUM('online','offline') NOT NULL DEFAULT 'online',
  meeting_link     VARCHAR(500) NULL,
  location         VARCHAR(300) NULL,
  interviewer_name VARCHAR(120) NULL,
  status           ENUM('scheduled','rescheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled',
  result           ENUM('pending','pass','fail') NOT NULL DEFAULT 'pending',
  feedback         TEXT         NULL,
  cancel_reason    VARCHAR(300) NULL,
  created_by       INT          NULL,
  updated_by       INT          NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_ci_app (application_id, round_no),
  KEY idx_ci_upcoming (status, scheduled_at),
  CONSTRAINT fk_ci_app FOREIGN KEY (application_id) REFERENCES career_applications (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS career_application_logs (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  application_id  INT UNSIGNED NOT NULL,
  event           VARCHAR(40)  NOT NULL,  -- submitted, status_changed, interview_scheduled, note_added, …
  from_status     VARCHAR(30)  NULL,
  to_status       VARCHAR(30)  NULL,
  remarks         TEXT         NULL,
  admin_id        INT          NULL,      -- NULL = candidate / system
  admin_name      VARCHAR(120) NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_cal_app (application_id, created_at),
  KEY idx_cal_event (event, created_at),
  CONSTRAINT fk_cal_app FOREIGN KEY (application_id) REFERENCES career_applications (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS career_settings (
  setting_key    VARCHAR(80)  NOT NULL,
  setting_value  TEXT         NULL,
  updated_by     INT          NULL,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS career_resume_uploads (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  upload_token    CHAR(48)     NOT NULL,
  s3_key          VARCHAR(255) NOT NULL,
  job_id          INT UNSIGNED NOT NULL,
  original_name   VARCHAR(255) NOT NULL,
  mime            VARCHAR(120) NOT NULL,
  declared_size   INT UNSIGNED NOT NULL,
  ip_address      VARCHAR(45)  NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  consumed_at     DATETIME     NULL,     -- attached to an application
  application_id  INT UNSIGNED NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cru_token (upload_token),
  UNIQUE KEY uq_cru_key (s3_key),
  KEY idx_cru_sweep (consumed_at, created_at),
  KEY idx_cru_ip (ip_address, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS career_admin_activity (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  admin_id    INT          NULL,
  admin_name  VARCHAR(120) NULL,
  entity      ENUM('job','application','interview','settings','export') NOT NULL,
  entity_id   INT UNSIGNED NULL,
  action      VARCHAR(40)  NOT NULL,
  details     VARCHAR(1000) NULL,
  ip_address  VARCHAR(45)  NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_caa_entity (entity, entity_id, created_at),
  KEY idx_caa_admin (admin_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Defaults (admins edit these in Admin → Careers → Settings).
INSERT IGNORE INTO career_settings (setting_key, setting_value) VALUES
  ('recruitment_email', ''),
  ('careers_page_visible', '1'),
  ('careers_page_title', 'Careers at Mr. Service Expert'),
  ('careers_page_intro', 'Join a fast-growing home services company. We are looking for talented, customer-focused people who want to build their careers with us.'),
  ('application_confirmation_message', 'Thank you for your interest in joining Mr. Service Expert. Our recruitment team will review your application and contact you if your profile matches our requirements.'),
  ('notify_admin_new_application', '1'),
  ('notify_candidate_confirmation', '1'),
  ('notify_candidate_status', '1'),
  ('notify_candidate_interview', '1'),
  ('default_expiry_days', '30'),
  ('require_cover_letter', '0'),
  ('show_salary_fields', '1'),
  ('allow_reapply_after_rejection', '0'),
  ('retention_months', '0');
