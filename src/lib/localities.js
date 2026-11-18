// lib/localities.js
//
// Localities are city_tb rows placed under a parent city in city_parent_map.
// Rows imported by scripts/import-localities.mjs carry kind = 'locality'
// (migration 012). Everything here degrades to "no localities" until that
// migration has run, so public pages never break when a deploy comes first.
//
//   hideLocalitiesSql(alias)  keeps imported localities OUT of the old city
//                             lists ("nearby cities", /api/cities, ...), so
//                             those lists show exactly what they showed before
//   getAreaLinks(...)         locality links for a city / locality page,
//                             only the ones that actually have that page
//   pageRobots(...)           noindex rules for locality / partner-made pages

import db from "@/lib/db";
import { hasColumn } from "@/lib/partners/schema";
import { countDirectPartners } from "@/lib/partners/listing";

export const localitiesReady = () => hasColumn("city_parent_map", "kind");
const generatedReady = () => hasColumn("partner_generated_pages", "page_kind");

/** SQL fragment: drop imported localities from a city_tb list (alias = city_tb alias). */
export async function hideLocalitiesSql(alias) {
  if (!(await localitiesReady())) return "";
  return ` AND NOT EXISTS (SELECT 1 FROM city_parent_map lm WHERE lm.city_id = ${alias}.id AND lm.kind = 'locality')`;
}

/**
 * SQL fragment: drop partner-made page rows (alias = master_tb_withoutbrand /
 * page_master_tb alias). Old link lists keep listing exactly what they did;
 * partner-made pages are linked from the locality block and their own sitemap.
 */
export async function hideGeneratedSql(alias, kind = "category") {
  if (!(await generatedReady())) return "";
  return ` AND NOT EXISTS (SELECT 1 FROM partner_generated_pages g WHERE g.page_kind = '${kind === "brand" ? "brand" : "category"}' AND g.page_id = ${alias}.id)`;
}

// Pass `q` (a held connection) + `ready` (localitiesReady(), checked before the
// connection was taken) when calling while holding a connection, so no second
// pool connection is requested (that deadlocks the pool, see cityData.js).

/** { parent: {id, city_name, city_url} | null, isLocality } for a city_tb id. */
export async function getAreaContext(cityId, { q = db, ready } = {}) {
  if (!cityId || !(ready ?? (await localitiesReady()))) return { parent: null, isLocality: false };
  const [[row]] = await q.query(
    `SELECT m.kind, p.id, p.city_name, p.city_url
       FROM city_parent_map m JOIN city_tb p ON p.id = m.parent_city_id
      WHERE m.city_id = ? LIMIT 1`,
    [cityId]
  );
  if (!row) return { parent: null, isLocality: false };
  return { parent: { id: row.id, city_name: row.city_name, city_url: row.city_url }, isLocality: row.kind === "locality" };
}

/**
 * Locality links for /{city}/{cat} or /{city}/{brand}/{cat}.
 *   city page     → its localities
 *   locality page → its sibling localities (the parent comes from getAreaContext)
 * Only localities that HAVE this page are returned, so no link can 404 or
 * land on a thin fallback page.
 */
export async function getAreaLinks({ cityId, parentId = null, categoryId, brandUrl = null }, { q = db, ready } = {}) {
  if (!(ready ?? (await localitiesReady()))) return [];
  const hub = parentId || cityId;
  const pageCheck = brandUrl
    ? `EXISTS (SELECT 1 FROM page_master_tb pm JOIN brand_tb b ON b.id = pm.brand_id
                WHERE pm.city_id = c.id AND pm.category_id = ? AND LOWER(b.brand_url) = ?)`
    : `EXISTS (SELECT 1 FROM master_tb_withoutbrand w WHERE w.city_id = c.id AND w.category_id = ?)`;
  const [rows] = await q.query(
    `SELECT c.id, c.city_name, c.city_url
       FROM city_parent_map m JOIN city_tb c ON c.id = m.city_id
      WHERE m.parent_city_id = ? AND c.id <> ? AND c.status = '1'
        AND c.city_url IS NOT NULL AND c.city_url <> ''
        AND ${pageCheck}
      ORDER BY c.city_name ASC`,
    brandUrl ? [hub, cityId, categoryId, brandUrl] : [hub, cityId, categoryId]
  );
  return rows;
}

/**
 * robots value for a city/locality service page. Old pages keep "index,
 * follow"; only these become noindex:
 *   • an imported locality with no page row (generic fallback content)
 *   • a page created for partners while no partner is visible on it
 */
export async function pageRobots({ cityId, categoryId, brandId = null, pageId = null, isLocality = false }) {
  const INDEX = "index, follow";
  try {
    if (!pageId) return isLocality ? "noindex, follow" : INDEX;
    if (!(await generatedReady())) return INDEX;
    const [[gen]] = await db.query(
      "SELECT id FROM partner_generated_pages WHERE page_kind = ? AND page_id = ? LIMIT 1",
      [brandId ? "brand" : "category", pageId]
    );
    if (!gen) return INDEX;
    const n = await countDirectPartners({ cityId, categoryId, brandId });
    return n > 0 ? INDEX : "noindex, follow";
  } catch (err) {
    console.error("[localities] robots", err?.message);
    return INDEX;
  }
}
