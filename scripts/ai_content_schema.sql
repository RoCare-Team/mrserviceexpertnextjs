-- =====================================================================
-- Mr. Service Expert — AI content generation schema
-- Run this once against your MySQL database.
--
-- The app also creates this table on demand (see src/lib/aiContent.js →
-- ensureAiContentTable), so running this file is optional — it just makes
-- the schema explicit and reviewable.
--
-- One row per URL. Re-generating the SAME url never overwrites an existing
-- content column: it writes the next free slot (content1 → content2 → …).
-- Columns beyond content3 are added automatically when they are first
-- needed, so nothing has to be pre-created here.
-- =====================================================================

CREATE TABLE IF NOT EXISTS ai_content (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  url         VARCHAR(500) NOT NULL,                  -- full absolute URL
  slug        VARCHAR(255) NOT NULL,                  -- e.g. delhi/ro-water-purifier
  `date`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,  -- first generated
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP, -- last generated / edited
  content1    LONGTEXT NULL,
  content2    LONGTEXT NULL,
  content3    LONGTEXT NULL,
  UNIQUE KEY uq_ai_content_slug (slug),
  KEY idx_ai_content_date (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
