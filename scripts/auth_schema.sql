-- =====================================================================
-- Mr. Service Expert — admin auth schema
-- Run this once against your MySQL database.
-- =====================================================================

-- 1) Admin accounts (login + roles)
CREATE TABLE IF NOT EXISTS admin_users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(190)  NOT NULL,
  password      VARCHAR(255)  NOT NULL,         -- scrypt hash (scrypt$salt$hash)
  role          ENUM('super_admin','admin') NOT NULL DEFAULT 'admin',
  status        TINYINT(1)    NOT NULL DEFAULT 1, -- 1 active, 0 disabled
  last_login    DATETIME      NULL,
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2) Optional: YouTube URL column on city pages (used by the tabbed editor).
--    Safe to run even if it already exists — comment out if your column
--    is named differently.
ALTER TABLE page_master_tb
  ADD COLUMN youtube_url VARCHAR(255) NULL AFTER page_content;
