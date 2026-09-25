// lib/otherCityLinks.js
//
// The "Homepage Cities" links shown on the homepage, managed from
// /admin/other_cities. Kept separate from src/lib/popularCities.js: that list
// is hard-coded and deploys with the code, this one is editable at runtime.

import db from "@/lib/db";

/** Active links, in admin-defined order. Returns [] on any failure. */
export async function getOtherCityLinks() {
  try {
    const [rows] = await db.query(
      `SELECT id, title, url
         FROM other_city_links_tb
        WHERE status = '1'
        ORDER BY sort_order ASC, title ASC`
    );
    return rows;
  } catch (error) {
    // The homepage must render even if this table is missing (fresh clone that
    // has not run scripts/create-other-city-links-table.mjs yet) or the DB is
    // briefly unreachable. An empty list simply hides the block.
    console.error("getOtherCityLinks failed:", error.message);
    return [];
  }
}

/**
 * Normalises whatever an admin typed into something safe to put in an href.
 * Internal paths get a leading slash; http(s) links are left as-is. Anything
 * else (javascript:, data:, mailto: …) is rejected so the admin form cannot be
 * used to inject a scheme into the homepage.
 */
export function normalizeLinkUrl(raw) {
  const value = String(raw ?? "").trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) return value;
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null; // any other scheme

  return "/" + value.replace(/^\/+/, "");
}
