-- Rollback for 2026_11_16_012_localities_partner_pages.sql
--
-- Run `node scripts/import-localities.mjs --remove --commit` FIRST: it deletes
-- the imported locality rows from city_tb (only ones no partner uses). Pages
-- created for partners stay — they are normal page rows; delete them by id
-- from partner_generated_pages before dropping it if you want them gone.

-- 1) Restore the legacy hierarchy exactly as it was.
DELETE FROM city_parent_map WHERE kind = 'legacy';
INSERT IGNORE INTO city_parent_map (city_id, parent_city_id, created_at)
SELECT city_id, parent_city_id, created_at FROM city_parent_map_bak_012;

-- 2) Drop the new column / index / table.
ALTER TABLE city_parent_map DROP INDEX IF EXISTS idx_cpm_parent_kind;
ALTER TABLE city_parent_map DROP COLUMN IF EXISTS kind;
DROP TABLE IF EXISTS partner_generated_pages;

DELETE FROM schema_migrations_mse WHERE name = '2026_11_16_012_localities_partner_pages.sql';
-- city_parent_map_bak_012 is kept on purpose; drop it by hand once happy.
