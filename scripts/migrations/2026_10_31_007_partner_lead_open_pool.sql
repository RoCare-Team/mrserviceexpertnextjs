-- =====================================================================
-- Lead open pool. A booking is first offered to the chosen partner for
-- 15 minutes ("direct" phase). If they don't accept, it opens to every
-- eligible partner in that city for another 15 minutes ("open" phase);
-- the first to accept gets it (partner_id moves to them). Still
-- unaccepted → expired and forwarded to the CRM as before.
-- =====================================================================

ALTER TABLE partner_leads
  ADD COLUMN IF NOT EXISTS original_partner_id INT UNSIGNED NULL AFTER partner_id,   -- partner the customer picked
  ADD COLUMN IF NOT EXISTS phase        ENUM('direct','open') NOT NULL DEFAULT 'direct' AFTER status,
  ADD COLUMN IF NOT EXISTS open_city_id INT(11)  NULL AFTER page_city_id,            -- city_tb id the pool is drawn from
  ADD COLUMN IF NOT EXISTS opened_at    DATETIME NULL AFTER expires_at,
  ADD INDEX IF NOT EXISTS idx_pl_pool (phase, status, open_city_id, category_id);

UPDATE partner_leads SET original_partner_id = partner_id WHERE original_partner_id IS NULL;
UPDATE partner_leads SET open_city_id = page_city_id WHERE open_city_id IS NULL AND page_city_id IS NOT NULL;

-- Partners who passed on an open lead: it is hidden from them, others can
-- still accept it.
CREATE TABLE IF NOT EXISTS partner_lead_passes (
  lead_id     INT UNSIGNED NOT NULL,
  partner_id  INT UNSIGNED NOT NULL,
  reason      VARCHAR(255) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (lead_id, partner_id),
  KEY idx_plp_partner (partner_id),
  CONSTRAINT fk_plp_lead    FOREIGN KEY (lead_id)    REFERENCES partner_leads (id) ON DELETE CASCADE,
  CONSTRAINT fk_plp_partner FOREIGN KEY (partner_id) REFERENCES partners (id)      ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
