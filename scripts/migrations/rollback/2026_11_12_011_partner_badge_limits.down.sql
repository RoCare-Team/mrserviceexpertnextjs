-- Reverts 2026_11_12_011. current_step is not mapped back (partners still
-- filling the form simply re-walk a few steps).
ALTER TABLE partner_brands        DROP COLUMN IF EXISTS badge_locked;
ALTER TABLE partner_service_areas DROP COLUMN IF EXISTS badge_locked;
ALTER TABLE partner_categories    DROP COLUMN IF EXISTS badge_locked;
ALTER TABLE partners DROP COLUMN IF EXISTS badge_limits_applied, DROP COLUMN IF EXISTS featured_pending_days;
DELETE FROM schema_migrations_mse WHERE name = '2026_11_12_011_partner_badge_limits.sql';
