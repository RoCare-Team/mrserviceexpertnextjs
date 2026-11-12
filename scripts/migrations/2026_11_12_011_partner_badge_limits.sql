-- =====================================================================
-- Free plan limits + Featured badge, and the new registration step order.
--
-- Free plan: 1 city, 2 categories, 2 brands per category. More needs the
-- Featured Partner badge. Without an active badge the extras are kept but
-- hidden (badge_locked = 1) until the badge is bought / renewed.
--
--   partners.featured_pending_days   badge paid during registration; the
--                                    days start when the admin approves
--   partners.badge_limits_applied    1 = locks already applied for the
--                                    current no-badge period (cron flag)
--   partner_categories / partner_service_areas / partner_brands
--     .badge_locked                  1 = above the free limit, hidden
--
-- Wizard steps were 1 basic, 2 categories, 3 services, 4 brands,
-- 5 business, 6 address & areas, 7 review. They are now 1 basic,
-- 2 business, 3 address & areas, 4 categories, 5 services, 6 brands,
-- 7 review. current_step (= first step not yet done) is remapped
-- conservatively for partners still filling the form.
-- =====================================================================

ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS featured_pending_days SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badge_limits_applied  TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE partner_categories    ADD COLUMN IF NOT EXISTS badge_locked TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE partner_service_areas ADD COLUMN IF NOT EXISTS badge_locked TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE partner_brands        ADD COLUMN IF NOT EXISTS badge_locked TINYINT(1) NOT NULL DEFAULT 0;

-- old 2..5 → basic done, business not yet  → 2
-- old 6    → business done, areas not yet  → 3
UPDATE partners
   SET current_step = CASE WHEN current_step BETWEEN 2 AND 5 THEN 2 WHEN current_step = 6 THEN 3 ELSE current_step END
 WHERE current_step BETWEEN 2 AND 6;
