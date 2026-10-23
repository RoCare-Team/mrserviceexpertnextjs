-- Rollback for 2026_10_23_004 (partner tables only). Deletes notifications,
-- push subscriptions, gallery rows, change requests and the added columns.
DROP TABLE IF EXISTS partner_push_subscriptions;
DROP TABLE IF EXISTS partner_notifications;
DROP TABLE IF EXISTS partner_change_requests;
DROP TABLE IF EXISTS partner_photos;
ALTER TABLE partner_reviews DROP COLUMN IF EXISTS reply, DROP COLUMN IF EXISTS replied_at;
ALTER TABLE partner_payments DROP INDEX IF EXISTS idx_pp_status,
  DROP COLUMN IF EXISTS email, DROP COLUMN IF EXISTS payment_mode, DROP COLUMN IF EXISTS bank_ref_num,
  DROP COLUMN IF EXISTS card_or_vpa, DROP COLUMN IF EXISTS bank_name, DROP COLUMN IF EXISTS error_message,
  DROP COLUMN IF EXISTS gateway_status, DROP COLUMN IF EXISTS raw_response, DROP COLUMN IF EXISTS completed_at;
ALTER TABLE partner_leads DROP COLUMN IF EXISTS partner_note, DROP COLUMN IF EXISTS final_amount, DROP COLUMN IF EXISTS work_done;
ALTER TABLE partners DROP COLUMN IF EXISTS is_available, DROP COLUMN IF EXISTS low_balance_alert, DROP COLUMN IF EXISTS session_version;
DELETE FROM schema_migrations_mse WHERE name = '2026_10_23_004_partner_dashboard.sql';
