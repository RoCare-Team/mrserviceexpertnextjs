// lib/cityData.js
import db from "@/lib/db";
import { getStoresByCityId } from "@/lib/storeLocatorData";

const CITY_COLUMNS = `
  id, city_name, city_url, city_content, state, status,
  created_at, updated_at, meta_title, meta_keywords, meta_description
`;

// Matches the category_tb columns
const CATEGORY_COLUMNS = `
  id, category_name, category_url, category_content, status,
  phone, banner, icon, created_at, updated_at,
  meta_title, meta_keywords, meta_description
`;

const normalize = (v = "") => v.toString().toLowerCase().trim();

// NOTE: everything here uses db.query() (pool.query), which checks a
// connection out and back in around the single statement. Do NOT switch back
// to db.getConnection() and hold it across awaits — holding one connection
// while a nested call (e.g. getStoresByCityId) waits for a second one
// deadlocks the pool under build-time concurrency.

// ── All cities (used by generateStaticParams) ───────────────────────────────
export async function getAllCities() {
  const [rows] = await db.query(
    `SELECT id, city_name, city_url
       FROM city_tb
      WHERE city_url IS NOT NULL AND city_url <> ''
      ORDER BY city_name ASC`
  );
  return rows;
}

// ── All categories (so generateStaticParams covers category slugs too) ──────
export async function getAllCategories() {
  const [rows] = await db.query(
    `SELECT id, category_name, category_url
       FROM category_tb
      WHERE category_url IS NOT NULL AND category_url <> ''
        AND status = '1'
      ORDER BY category_name ASC`
  );
  return rows;
}

// ── One city by its URL slug ─────────────────────────────────────────────────
export async function getCityByUrl(rawCityUrl) {
  const cityUrl = normalize(rawCityUrl);
  if (!cityUrl) return null;

  const [rows] = await db.query(
    `SELECT ${CITY_COLUMNS}
       FROM city_tb
      WHERE LOWER(city_url) = ?
      LIMIT 1`,
    [cityUrl]
  );
  if (!rows.length) return null;

  const cityDetail = rows[0];

  // "Popular Cities Near Me" — ALL other cities in the SAME state (no limit).
  const [[recent], stores] = await Promise.all([
    db.query(
      `SELECT id, city_name, city_url
         FROM city_tb
        WHERE city_url IS NOT NULL AND city_url <> ''
          AND state = ?
          AND LOWER(city_url) <> ?
        ORDER BY city_name ASC`,
      [cityDetail.state, cityUrl]
    ),
    // Physical store branches to surface on this city page (may be empty).
    getStoresByCityId(cityDetail.id),
  ]);

  return {
    // Top-level fields: <City> reads cityData.city_name, cityData.status, etc.
    ...cityDetail,
    stores,
    // Force "1" so City renders the CITY layout (its `if status === "1"` branch).
    status: "1",
    type: "city",
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
}

// ── One category by its URL slug ────────────────────────────────────────────
export async function getCategoryByUrl(rawCategoryUrl) {
  const categoryUrl = normalize(rawCategoryUrl);
  if (!categoryUrl) return null;

  const [rows] = await db.query(
    `SELECT ${CATEGORY_COLUMNS}
       FROM category_tb
      WHERE LOWER(category_url) = ?
      LIMIT 1`,
    [categoryUrl]
  );
  if (!rows.length) return null;

  const categoryDetail = rows[0];

  return {
    ...categoryDetail,
    // Force a NON-"1" status so City renders the CATEGORY (else) layout.
    // (The category's own status column is also "1" when active, which would
    //  otherwise wrongly trigger the city layout — so we override it here.)
    status: "0",
    type: "category",
    // City's category branch reads cityData.city_name (heading) and
    // cityData.catbanner (banner <img>), so map them from the category row.
    city_name: categoryDetail.category_name,
    catbanner: categoryDetail.banner,
    // Nested copy, matching the old PHP API shape City + metadata expect.
    city_detail: null,
    categorydetail: categoryDetail,
    recent_cities: [],
  };
}

// ── Unified resolver: try city first, then category ─────────────────────────
export async function getPageByUrl(rawUrl) {
  const slug = normalize(rawUrl);
  if (!slug) return null;

  const city = await getCityByUrl(slug);
  if (city) return city;

  const category = await getCategoryByUrl(slug);
  if (category) return category;

  return null;
}

// ── Entry point: "all"/empty → array, otherwise → detail or { error } ─────────
export async function fetchCityData(city) {
  const value = normalize(city);
  if (!value || value === "all") {
    return { data: await getAllCities(), notFound: false };
  }
  const detail = await getPageByUrl(value);
  if (!detail) return { data: { error: "City not found" }, notFound: true };
  return { data: detail, notFound: false };
}
