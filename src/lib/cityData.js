// lib/cityData.js
import db from "@/lib/db";

const CITY_COLUMNS = `
  id, city_name, city_url, city_content, state, status,
  created_at, updated_at, meta_title, meta_keywords, meta_description
`;

const normalize = (v = "") => v.toString().toLowerCase().trim();

// ── All cities (used by generateStaticParams) ───────────────────────────────
export async function getAllCities() {
  let connection;
  try {
    connection = await db.getConnection();
    const [rows] = await connection.query(
      `SELECT id, city_name, city_url
         FROM city_tb
        WHERE city_url IS NOT NULL AND city_url <> ''
        ORDER BY city_name ASC`
    );
    return rows;
  } finally {
    if (connection) connection.release();
  }
}

// ── One city by its URL slug ─────────────────────────────────────────────────
export async function getCityByUrl(rawCityUrl) {
  const cityUrl = normalize(rawCityUrl);
  if (!cityUrl) return null;

  let connection;
  try {
    connection = await db.getConnection();

    const [rows] = await connection.query(
      `SELECT ${CITY_COLUMNS}
         FROM city_tb
        WHERE LOWER(city_url) = ?
        LIMIT 1`,
      [cityUrl]
    );
    if (!rows.length) return null;

    const cityDetail = rows[0];

    // "Popular Cities Near Me" — ALL other cities in the SAME state (no limit).
    const [recent] = await connection.query(
      `SELECT id, city_name, city_url
         FROM city_tb
        WHERE city_url IS NOT NULL AND city_url <> ''
          AND state = ?
          AND LOWER(city_url) <> ?
        ORDER BY city_name ASC`,
      [cityDetail.state, cityUrl]
    );

    return {
      // Top-level fields: the <City> component reads cityData.status,
      // cityData.city_name, cityData.city_content, etc. directly.
      ...cityDetail,
      // Kept nested too, for generateMetadata (data.city_detail.meta_title).
      city_detail: cityDetail,
      categorydetail: null,
      recent_cities: recent.map((c) => ({
        id: c.id,
        city_id: c.id,
        parent_city: cityDetail.state,
        url: `/${c.city_url}`,
        city_name: c.city_name,
        city_url: c.city_url,
      })),
    };
  } finally {
    if (connection) connection.release();
  }
}

// ── Entry point: "all"/empty → array, otherwise → detail or { error } ─────────
export async function fetchCityData(city) {
  const value = normalize(city);
  if (!value || value === "all") {
    return { data: await getAllCities(), notFound: false };
  }
  const detail = await getCityByUrl(value);
  if (!detail) return { data: { error: "City not found" }, notFound: true };
  return { data: detail, notFound: false };
}