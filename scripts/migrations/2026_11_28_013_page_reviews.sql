-- =====================================================================
-- Customer reviews shown on service pages, managed from /admin/page_reviews.
--
-- A review belongs to one exact page URL, stored as the bare path without
-- slashes or domain: "delhi/ac", "delhi/samsung/ac". Pages show only their
-- own active reviews; a page with none renders no reviews block and keeps
-- its existing schema unchanged. New table only — nothing old is altered.
-- =====================================================================

CREATE TABLE IF NOT EXISTS page_reviews (
  id             INT(11)      NOT NULL AUTO_INCREMENT,
  page_url       VARCHAR(255) NOT NULL,
  customer_name  VARCHAR(100) NOT NULL,
  customer_city  VARCHAR(100) NULL,
  rating         TINYINT(1)   NOT NULL DEFAULT 5,
  review_text    TEXT         NOT NULL,
  review_date    DATE         NULL,
  status         ENUM('0','1') NOT NULL DEFAULT '1',
  sort_order     INT(11)      NOT NULL DEFAULT 0,
  created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_page_reviews_page (page_url, status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
