-- =====================================================================
-- Localities for the top cities + pages created on partner approval.
--
-- Old site tables (city_tb, master_tb_withoutbrand, page_master_tb,
-- brand_tb) are NOT altered here. Only partner-system tables change:
--
-- 1) city_parent_map.kind
--      'legacy'   rows that existed before this migration
--      'locality' rows written by scripts/import-localities.mjs
--    Public city lists ("nearby cities", /api/cities, ...) hide 'locality'
--    rows so the old pages keep showing exactly the cities they show today.
--
-- 2) Legacy clean-up. The 57 rows copied from the old `related_city` table
--    were "nearby cities", not localities (Noida under Agra, Gaya under
--    Patna, Visakhapatnam <-> Vijayawada in a loop). They hid those cities
--    from the partner city search and routed their leads to the wrong city.
--    Only Delhi's areas and Navi Mumbai are kept. A full copy is saved in
--    city_parent_map_bak_012 first (the rollback restores from it).
--    Checked before writing: the only partner using a legacy locality uses
--    Delhi's, which are kept.
--
-- 3) partner_generated_pages — one row per page that was created because an
--    approved partner serves that city/locality + category (+ brand). Pages
--    listed here are noindex while no partner is visible on them, and are
--    served by the live sitemap/partner-pages.xml instead of the static one.
-- =====================================================================

CREATE TABLE IF NOT EXISTS city_parent_map_bak_012 (
  city_id         INT(11)   NOT NULL,
  parent_city_id  INT(11)   NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (city_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO city_parent_map_bak_012 (city_id, parent_city_id, created_at)
SELECT city_id, parent_city_id, created_at FROM city_parent_map;

ALTER TABLE city_parent_map
  ADD COLUMN IF NOT EXISTS kind ENUM('legacy','locality') NOT NULL DEFAULT 'legacy';

ALTER TABLE city_parent_map
  ADD INDEX IF NOT EXISTS idx_cpm_parent_kind (parent_city_id, kind);

DELETE FROM city_parent_map
 WHERE kind = 'legacy'
   AND parent_city_id NOT IN (
     SELECT id FROM (SELECT id FROM city_tb WHERE LOWER(city_url) IN ('delhi', 'mumbai')) keep
   );

CREATE TABLE IF NOT EXISTS partner_generated_pages (
  id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
  page_kind    ENUM('category','brand') NOT NULL,   -- master_tb_withoutbrand | page_master_tb
  page_id      INT(11)      NOT NULL,
  city_id      INT(11)      NOT NULL,               -- city or locality (city_tb.id)
  category_id  INT(11)      NOT NULL,
  brand_id     INT(11)      NULL,
  brand_key    INT(11)      AS (IFNULL(brand_id, 0)) STORED,
  partner_id   INT UNSIGNED NULL,                   -- partner whose approval created it
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pgp (page_kind, city_id, category_id, brand_key),
  KEY idx_pgp_page (page_kind, page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
