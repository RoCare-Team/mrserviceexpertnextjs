-- Rollback for 2026_10_22_003 — DELETES all partner leads, wallet balances,
-- payments and reviews. Take a backup first. Existing site tables untouched.
DROP TABLE IF EXISTS partner_wallet_txns;
DROP TABLE IF EXISTS partner_payments;
DROP TABLE IF EXISTS partner_wallets;
DROP TABLE IF EXISTS partner_reviews;
DROP TABLE IF EXISTS partner_leads;
DROP TABLE IF EXISTS site_customers;
DELETE FROM schema_migrations_mse WHERE name = '2026_10_22_003_partner_leads_wallet_reviews.sql';
