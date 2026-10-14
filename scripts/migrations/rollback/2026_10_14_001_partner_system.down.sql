-- Rollback for 2026_10_14_001_partner_system.sql
-- DELETES ALL PARTNER DATA. Take a backup first. Touches only the tables the
-- migration created; existing site tables (city_tb, category_tb, brand_tb,
-- states, related_city …) are not modified.
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS partner_consents;
DROP TABLE IF EXISTS partner_status_history;
DROP TABLE IF EXISTS partner_documents;
DROP TABLE IF EXISTS partner_location_requests;
DROP TABLE IF EXISTS partner_service_areas;
DROP TABLE IF EXISTS partner_brands;
DROP TABLE IF EXISTS partner_services;
DROP TABLE IF EXISTS partner_categories;
DROP TABLE IF EXISTS partner_otp_challenges;
DROP TABLE IF EXISTS partners;
DROP TABLE IF EXISTS partner_service_types;
DROP TABLE IF EXISTS city_parent_map;
SET FOREIGN_KEY_CHECKS = 1;
DELETE FROM schema_migrations_mse WHERE name = '2026_10_14_001_partner_system.sql';
