-- =====================================================================
-- Partner public-profile SEO: AI-generated overview (~750 chars), meta
-- title / description / keywords, and an editable "About" that is seeded
-- by AI (about_ai = 1 until the partner edits it). Work-done counts come
-- from partner_leads (status = 'completed') via the existing idx_pl_partner index.
-- =====================================================================

ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS seo_content       TEXT         NULL,
  ADD COLUMN IF NOT EXISTS meta_title        VARCHAR(90)  NULL,
  ADD COLUMN IF NOT EXISTS meta_description  VARCHAR(220) NULL,
  ADD COLUMN IF NOT EXISTS meta_keywords     VARCHAR(400) NULL,
  ADD COLUMN IF NOT EXISTS about_ai          TINYINT(1)   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seo_source_hash   CHAR(40)     NULL,
  ADD COLUMN IF NOT EXISTS seo_generated_at  DATETIME     NULL,
  ADD COLUMN IF NOT EXISTS seo_attempted_at  DATETIME     NULL;
