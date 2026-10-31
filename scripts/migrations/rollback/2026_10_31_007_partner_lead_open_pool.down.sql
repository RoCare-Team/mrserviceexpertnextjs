-- Rollback for 2026_10_31_007 (lead open pool).
DROP TABLE IF EXISTS partner_lead_passes;
ALTER TABLE partner_leads
  DROP INDEX IF EXISTS idx_pl_pool,
  DROP COLUMN IF EXISTS original_partner_id,
  DROP COLUMN IF EXISTS phase,
  DROP COLUMN IF EXISTS open_city_id,
  DROP COLUMN IF EXISTS opened_at;
DELETE FROM schema_migrations_mse WHERE name = '2026_10_31_007_partner_lead_open_pool.sql';
