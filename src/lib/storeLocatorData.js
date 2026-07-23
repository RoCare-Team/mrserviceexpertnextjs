// lib/storeLocatorData.js
import db from "@/lib/db";

const STORE_COLUMNS = `
  id, store_code, business_name, city_id, city_url, locality, state,
  address, postal_code, phone, website, primary_category,
  additional_categories, latitude, longitude, hours, description, status
`;

const normalize = (v = "") => v.toString().toLowerCase().trim();

// ── Published stores for a city, matched by its URL slug ────────────────────
// Used on the city page so branches near the visitor's city are shown.
export async function getStoresByCityUrl(rawCityUrl) {
  const cityUrl = normalize(rawCityUrl);
  if (!cityUrl) return [];

  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await connection.query(
      `SELECT ${STORE_COLUMNS}
         FROM store_locator
        WHERE status = '1'
          AND LOWER(city_url) = ?
        ORDER BY locality ASC, id ASC`,
      [cityUrl]
    );
    return rows;
  } finally {
    if (connection) connection.release();
  }
}

// ── Published stores for a resolved city_id (fast, indexed path) ────────────
export async function getStoresByCityId(cityId) {
  if (!cityId) return [];

  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await connection.query(
      `SELECT ${STORE_COLUMNS}
         FROM store_locator
        WHERE status = '1'
          AND city_id = ?
        ORDER BY locality ASC, id ASC`,
      [cityId]
    );
    return rows;
  } finally {
    if (connection) connection.release();
  }
}

// ── All published stores (directory / sitemap use) ──────────────────────────
export async function getAllStores() {
  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await connection.query(
      `SELECT ${STORE_COLUMNS}
         FROM store_locator
        WHERE status = '1'
        ORDER BY state ASC, locality ASC`
    );
    return rows;
  } finally {
    if (connection) connection.release();
  }
}
