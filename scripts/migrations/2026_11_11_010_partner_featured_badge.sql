-- =====================================================================
-- "Featured Partner" badge: ₹499 via Easebuzz for 30 days (renewable), or
-- granted free by an admin. Badge holders are listed first; inside each
-- group partners rank by rating, then jobs done.
--
--   partners.featured_until        badge active while > NOW()
--   partners.featured_reminded_at  expiry reminder sent for this period
--   partner_payments.purpose       recharge (coins) | badge
--
-- Additive only.
-- =====================================================================

ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS featured_until       DATETIME NULL,
  ADD COLUMN IF NOT EXISTS featured_reminded_at DATETIME NULL;

ALTER TABLE partners ADD INDEX IF NOT EXISTS idx_partners_featured (featured_until);

ALTER TABLE partner_payments
  ADD COLUMN IF NOT EXISTS purpose ENUM('recharge','badge') NOT NULL DEFAULT 'recharge' AFTER amount;
