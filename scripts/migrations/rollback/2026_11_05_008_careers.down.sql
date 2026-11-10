-- Drops the whole career / recruitment system. DESTROYS all jobs and
-- applications — take a backup first. Resume files in S3 (career-resumes/)
-- are NOT removed by this script.
DROP TABLE IF EXISTS career_admin_activity;
DROP TABLE IF EXISTS career_resume_uploads;
DROP TABLE IF EXISTS career_application_logs;
DROP TABLE IF EXISTS career_interviews;
DROP TABLE IF EXISTS career_application_notes;
DROP TABLE IF EXISTS career_applications;
DROP TABLE IF EXISTS career_settings;
DROP TABLE IF EXISTS career_jobs;
DELETE FROM schema_migrations_mse WHERE name = '2026_11_05_008_careers.sql';
