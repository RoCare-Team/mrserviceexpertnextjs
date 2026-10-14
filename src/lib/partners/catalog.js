// Read-only catalogue + location lookups for the partner flow. All built on
// the site's existing masters (category_tb, brand_tb, city_tb, states) plus
// partner_service_types and city_parent_map.

import db from "@/lib/db";

/** Active categories that have at least one active partner service type. */
export async function getPartnerCategories() {
  const [rows] = await db.query(
    `SELECT c.id, c.category_name AS name, c.category_url AS url
       FROM category_tb c
      WHERE c.status = '1'
        AND EXISTS (SELECT 1 FROM partner_service_types s
                     WHERE s.category_id = c.id AND s.status = 1)
      ORDER BY c.id`
  );
  return rows;
}

export async function getServiceTypes(categoryIds) {
  if (!categoryIds?.length) return [];
  const [rows] = await db.query(
    `SELECT id, category_id, name, slug
       FROM partner_service_types
      WHERE status = 1 AND category_id IN (?)
      ORDER BY category_id, sort_order, name`,
    [categoryIds]
  );
  return rows;
}

export async function getBrands(categoryIds) {
  if (!categoryIds?.length) return [];
  const [rows] = await db.query(
    `SELECT id, category_id, brand_name AS name
       FROM brand_tb
      WHERE status = '1' AND category_id IN (?)
        AND brand_name IS NOT NULL AND brand_name <> ''
      ORDER BY category_id, brand_name`,
    [categoryIds]
  );
  return rows;
}

export async function getStates() {
  const [rows] = await db.query(
    `SELECT s.id, s.name FROM states s
      WHERE EXISTS (SELECT 1 FROM city_tb c
                     WHERE c.status = '1'
                       AND UPPER(REPLACE(c.state, '&', 'AND')) = UPPER(s.name))
      ORDER BY s.name`
  );
  return rows;
}

/**
 * Searchable list of top-level cities (localities are excluded — they're
 * picked under their parent). With a state, matches city_tb.state by name
 * ("JAMMU & KASHMIR" ≡ "Jammu and Kashmir").
 */
export async function searchCities({ q = "", stateId = null, limit = 20 } = {}) {
  const params = [];
  let where = `c.status = '1' AND c.city_url <> ''
    AND NOT EXISTS (SELECT 1 FROM city_parent_map m WHERE m.city_id = c.id)`;
  if (q) {
    where += " AND c.city_name LIKE ?";
    params.push(`${q.replace(/[%_\\]/g, "\\$&")}%`);
  }
  if (stateId) {
    where += ` AND UPPER(REPLACE(c.state, '&', 'AND')) = (SELECT UPPER(name) FROM states WHERE id = ?)`;
    params.push(stateId);
  }
  const [rows] = await db.query(
    `SELECT c.id, c.city_name AS name, c.state,
            (SELECT COUNT(*) FROM city_parent_map m WHERE m.parent_city_id = c.id) AS locality_count
       FROM city_tb c
      WHERE ${where}
      ORDER BY c.city_name
      LIMIT ${Math.min(Math.max(Number(limit) || 20, 1), 50)}`,
    params
  );
  return rows;
}

export async function getLocalities(cityId) {
  const [rows] = await db.query(
    `SELECT c.id, c.city_name AS name
       FROM city_parent_map m
       JOIN city_tb c ON c.id = m.city_id
      WHERE m.parent_city_id = ? AND c.status = '1'
      ORDER BY c.city_name`,
    [cityId]
  );
  return rows;
}
