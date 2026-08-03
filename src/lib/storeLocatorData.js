// lib/storeLocatorData.js
import db from "@/lib/db";

const STORE_COLUMNS = `
  id, store_code, business_name, city_id, city_url, locality, state,
  address, postal_code, phone, website, primary_category,
  additional_categories, latitude, longitude, hours, description, status
`;

const normalize = (v = "") => v.toString().toLowerCase().trim();

// NOTE: db.query() checks a pool connection out and back in per statement —
// never hold a connection with db.getConnection() across awaits here (see
// the deadlock note in cityData.js).

// ── Published stores for a city, matched by its URL slug ────────────────────
// Used on the city page so branches near the visitor's city are shown.
export async function getStoresByCityUrl(rawCityUrl) {
  const cityUrl = normalize(rawCityUrl);
  if (!cityUrl) return [];

  const [rows] = await db.query(
    `SELECT ${STORE_COLUMNS}
       FROM store_locator
      WHERE status = '1'
        AND LOWER(city_url) = ?
      ORDER BY locality ASC, id ASC`,
    [cityUrl]
  );
  return rows;
}

// ── Published stores for a resolved city_id (fast, indexed path) ────────────
export async function getStoresByCityId(cityId) {
  if (!cityId) return [];

  const [rows] = await db.query(
    `SELECT ${STORE_COLUMNS}
       FROM store_locator
      WHERE status = '1'
        AND city_id = ?
      ORDER BY locality ASC, id ASC`,
    [cityId]
  );
  return rows;
}

// ── All published stores (directory / sitemap use) ──────────────────────────
export async function getAllStores() {
  const [rows] = await db.query(
    `SELECT ${STORE_COLUMNS}
       FROM store_locator
      WHERE status = '1'
      ORDER BY state ASC, locality ASC`
  );
  return rows;
}
