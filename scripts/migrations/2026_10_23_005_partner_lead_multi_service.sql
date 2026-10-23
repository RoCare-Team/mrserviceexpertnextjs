-- A booking can include several services; the full list (id, name, price)
-- lives here. service_name / service_price / php_service_id keep the
-- combined name, total price and first service for existing screens.
ALTER TABLE partner_leads
  ADD COLUMN IF NOT EXISTS services_json TEXT NULL AFTER service_price,
  MODIFY service_name VARCHAR(500) NOT NULL;
