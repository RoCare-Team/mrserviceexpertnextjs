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

const PINCODE_API = "https://inet.waterpurifierservicecenter.in/include/ajax/get_city_with_pincode.php";
const norm = (s) => String(s || "").toUpperCase().replace(/&/g, "AND").replace(/[^A-Z0-9]+/g, " ").trim();
// Old state names the lookup service still returns → names in our states table.
const STATE_ALIASES = {
  ORISSA: "ODISHA",
  PONDICHERRY: "PUDUCHERRY",
  UTTARANCHAL: "UTTARAKHAND",
  CHATTISGARH: "CHHATTISGARH",
  CHHATISGARH: "CHHATTISGARH",
  "NEW DELHI": "DELHI",
  "NCT OF DELHI": "DELHI",
};

/**
 * Pincode → { state_id, state, city_id, city } in OUR tables, using the same
 * lookup service as the booking popup (its city ids belong to another DB, so
 * state and city are matched here by name). city_id is null when the city
 * isn't one of ours; null overall when the pincode is unknown.
 */
export async function lookupPincode(pin) {
  if (!/^[1-9]\d{5}$/.test(String(pin))) return null;
  let data = null;
  try {
    const res = await fetch(`${PINCODE_API}?pincode=${pin}`, { signal: AbortSignal.timeout(6000), cache: "no-store" });
    data = await res.json();
  } catch {}
  // Fallback for pincodes the booking service doesn't know (Noida, Dehradun …): India Post.
  if (!data?.state) {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`, { signal: AbortSignal.timeout(6000), cache: "no-store" });
      const office = (await res.json())?.[0]?.PostOffice?.[0];
      data = office?.State ? { state: office.State, city: office.District } : null;
    } catch {
      data = null;
    }
  }
  if (!data?.state) return null;

  const [states] = await db.query("SELECT id, name FROM states");
  const st =
    states.find((s) => norm(s.name) === norm(data.state)) ||
    states.find((s) => norm(s.name) === STATE_ALIASES[norm(data.state)]);
  if (!st) return null;
  // city_tb.state sometimes keeps an old spelling (Raipur → "CHATTISGARH").
  const stateNames = [norm(st.name), ...Object.keys(STATE_ALIASES).filter((k) => STATE_ALIASES[k] === norm(st.name))];

  let city = null;
  const raw = norm(data.city);
  if (raw) {
    // Top-level cities of that state; localities are picked under their city.
    const [rows] = await db.query(
      `SELECT c.id, c.city_name AS name, LOWER(c.city_url) AS url, SOUNDEX(c.city_name) = SOUNDEX(?) AS sounds
         FROM city_tb c
        WHERE c.status = '1' AND c.city_url <> ''
          AND NOT EXISTS (SELECT 1 FROM city_parent_map m WHERE m.city_id = c.id)
          AND UPPER(REPLACE(c.state, '&', 'AND')) IN (?)
        ORDER BY c.id`,
      [raw, stateNames]
    );
    const slug = raw.toLowerCase().replace(/ /g, "-");
    city =
      rows.find((c) => norm(c.name) === raw || c.url === slug) || // exact
      rows.filter((c) => (` ${raw} `).includes(` ${norm(c.name)} `)).sort((a, b) => b.name.length - a.name.length)[0] || // "Central Delhi" → Delhi
      (rows.filter((c) => c.sounds).length === 1 ? rows.find((c) => c.sounds) : null) || // "Khorda" → Khordha (only if unambiguous)
      null;
  }
  return { state_id: st.id, state: st.name, city_id: city?.id || null, city: city?.name || null, raw_city: data.city || null };
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
