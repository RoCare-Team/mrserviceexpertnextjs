-- Reverts 2026_11_11_010. Badge payments stay in partner_payments but lose
-- their purpose column (they will look like recharges) — export them first.
ALTER TABLE partner_payments DROP COLUMN IF EXISTS purpose;
ALTER TABLE partners DROP INDEX IF EXISTS idx_partners_featured;
ALTER TABLE partners DROP COLUMN IF EXISTS featured_reminded_at, DROP COLUMN IF EXISTS featured_until;
DELETE FROM schema_migrations_mse WHERE name = '2026_11_11_010_partner_featured_badge.sql';
