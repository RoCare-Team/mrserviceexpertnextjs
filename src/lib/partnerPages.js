// lib/partnerPages.js
//
// Creates the missing service pages for an approved partner's areas:
//
//   every area (city-wide → the city, locality → the locality)
//     × every active category   → /{area}/{category}          master_tb_withoutbrand
//     × every active brand      → /{area}/{brand}/{category}  page_master_tb
//
// Only rows that are MISSING are written — an existing page (hand-written or
// seeded) is never touched. Every row written is recorded in
// partner_generated_pages; that is how the site knows to noindex it while no
// partner is visible there and to list it in sitemap/partner-pages.xml.
//
// Shared by the app (queuePartnerPages in lib/partners/pages.js) and the CLI
// backfill (scripts/ensure-partner-pages.mjs), so it takes the connection as
// an argument and has NO "@/..." imports (Node scripts can't resolve them).

import { CATEGORY_COPY, brandPage, cityCategoryPage, faqColumns } from "./pageContent.js";

// One partner can't create more than this many pages in one run.
export const MAX_PAGES_PER_RUN = 600;

const LOCK = "mse_partner_pages";

async function columnExists(conn, table, column) {
  try {
    const [r] = await conn.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
    return r.length > 0;
  } catch {
    return false;
  }
}

/** True once migration 012 has run. */
export async function partnerPagesReady(conn) {
  return columnExists(conn, "partner_generated_pages", "page_kind");
}

const FAQ_COLS = Array.from({ length: 5 }, (_, i) => [`faqquestion${i + 1}`, `faqanswer${i + 1}`]).flat();

async function insertPage(conn, table, keys, page, extra = {}) {
  const faq = faqColumns(page.faqs);
  const row = {
    ...keys,
    service_type_id: 1,
    status: "1",
    page_url: "",
    page_title: page.page_title,
    page_content: page.page_content,
    meta_title: page.meta_title,
    meta_keywords: page.meta_keywords,
    meta_description: page.meta_description,
    ...Object.fromEntries(FAQ_COLS.map((c) => [c, faq[c] ?? null])),
    ...extra,
  };
  const cols = Object.keys(row);
  const [res] = await conn.query(
    `INSERT INTO \`${table}\` (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
    cols.map((c) => row[c])
  );
  return res.insertId;
}

/**
 * What this partner's selections need. Returns the planned pages with a flag
 * saying whether each already exists. Read-only.
 */
export async function planPartnerPages(conn, partnerId) {
  const locks = await columnExists(conn, "partner_service_areas", "badge_locked");
  const unlocked = (a) => (locks ? ` AND ${a}.badge_locked = 0` : "");

  const [[p]] = await conn.query(
    `SELECT id FROM partners
      WHERE id = ? AND status = 'approved' AND is_listed = 1
        AND mobile_verified_at IS NOT NULL AND deleted_at IS NULL`,
    [partnerId]
  );
  if (!p) return { partnerId, eligible: false, pages: [] };

  const [areas] = await conn.query(
    `SELECT DISTINCT t.id, t.city_name, t.city_url, par.city_name AS parent_name
       FROM partner_service_areas a
       JOIN city_tb t ON t.id = COALESCE(a.locality_id, a.city_id)
       LEFT JOIN city_tb par ON par.id = a.city_id AND a.locality_id IS NOT NULL
      WHERE a.partner_id = ?${unlocked("a")}
        AND t.status = '1' AND t.city_url IS NOT NULL AND t.city_url <> ''`,
    [partnerId]
  );
  const [cats] = await conn.query(
    `SELECT c.id, c.category_url
       FROM partner_categories pc
       JOIN category_tb c ON c.id = pc.category_id
      WHERE pc.partner_id = ?${unlocked("pc")} AND c.status = '1'
        AND EXISTS (SELECT 1 FROM partner_services ps WHERE ps.partner_id = pc.partner_id AND ps.category_id = pc.category_id)`,
    [partnerId]
  );
  const usable = cats.filter((c) => CATEGORY_COPY[(c.category_url || "").toLowerCase()]);
  if (!areas.length || !usable.length) return { partnerId, eligible: true, pages: [] };

  const [brands] = await conn.query(
    `SELECT DISTINCT b.id, b.brand_name, b.brand_url, pb.category_id
       FROM partner_brands pb
       JOIN brand_tb b ON b.id = pb.brand_id
      WHERE pb.partner_id = ?${unlocked("pb")} AND pb.category_id IN (?)
        AND b.status = '1' AND b.brand_url IS NOT NULL AND b.brand_url <> ''
        AND b.brand_name IS NOT NULL AND b.brand_name <> ''`,
    [partnerId, usable.map((c) => c.id)]
  );

  const areaIds = areas.map((a) => a.id);
  const catIds = usable.map((c) => c.id);
  const [haveCat] = await conn.query(
    `SELECT DISTINCT city_id, category_id FROM master_tb_withoutbrand WHERE city_id IN (?) AND category_id IN (?)`,
    [areaIds, catIds]
  );
  // Brand pages are matched on brand_url, exactly like getBrandPageData and
  // the "Popular brands" gate, so a page linked to a sibling brand row counts.
  const [haveBrand] = await conn.query(
    `SELECT DISTINCT pm.city_id, pm.category_id, LOWER(b.brand_url) AS brand_url
       FROM page_master_tb pm JOIN brand_tb b ON b.id = pm.brand_id
      WHERE pm.city_id IN (?) AND pm.category_id IN (?)`,
    [areaIds, catIds]
  );
  const catSet = new Set(haveCat.map((r) => `${r.city_id}:${r.category_id}`));
  const brandSet = new Set(haveBrand.map((r) => `${r.city_id}:${r.category_id}:${r.brand_url}`));

  const pages = [];
  for (const a of areas) {
    const place = a.parent_name ? `${a.city_name}, ${a.parent_name}` : a.city_name;
    for (const c of usable) {
      const catUrl = c.category_url.toLowerCase();
      pages.push({
        kind: "category", cityId: a.id, categoryId: c.id, brandId: null, place,
        url: `/${a.city_url.toLowerCase()}/${catUrl}`, catUrl,
        exists: catSet.has(`${a.id}:${c.id}`),
      });
      for (const b of brands.filter((x) => x.category_id === c.id)) {
        pages.push({
          kind: "brand", cityId: a.id, categoryId: c.id, brandId: b.id, brand: b, place,
          cityName: a.city_name, cityUrl: a.city_url,
          url: `/${a.city_url.toLowerCase()}/${b.brand_url.toLowerCase()}/${catUrl}`, catUrl,
          exists: brandSet.has(`${a.id}:${c.id}:${b.brand_url.toLowerCase()}`),
        });
      }
    }
  }
  return { partnerId, eligible: true, pages };
}

/**
 * Writes the missing pages for one partner. `conn` must be a single
 * connection (GET_LOCK is per connection). Safe to run any number of times.
 * Returns { created: [...urls], skipped: n }.
 */
export async function ensurePartnerPages(conn, partnerId, { dryRun = false } = {}) {
  if (!(await partnerPagesReady(conn))) return { created: [], skipped: 0, notReady: true };

  const [[got]] = await conn.query("SELECT GET_LOCK(?, 30) AS ok", [LOCK]);
  if (!got?.ok) throw new Error("partner pages: could not get lock");
  try {
    const plan = await planPartnerPages(conn, partnerId);
    const todo = plan.pages.filter((p) => !p.exists);
    const created = [];
    for (const pg of todo.slice(0, MAX_PAGES_PER_RUN)) {
      if (dryRun) {
        created.push(pg.url);
        continue;
      }
      const copy = CATEGORY_COPY[pg.catUrl];
      let pageId;
      if (pg.kind === "category") {
        pageId = await insertPage(
          conn, "master_tb_withoutbrand",
          { city_id: pg.cityId, category_id: pg.categoryId },
          cityCategoryPage(copy, pg.place),
          { robots: "index" }
        );
      } else {
        pageId = await insertPage(
          conn, "page_master_tb",
          { city_id: pg.cityId, category_id: pg.categoryId, brand_id: pg.brandId },
          brandPage(pg.brand, copy, { city_name: pg.place, city_url: pg.cityUrl })
        );
      }
      await conn.query(
        `INSERT IGNORE INTO partner_generated_pages (page_kind, page_id, city_id, category_id, brand_id, partner_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pg.kind, pageId, pg.cityId, pg.categoryId, pg.brandId, partnerId]
      );
      created.push(pg.url);
    }
    return { created, skipped: plan.pages.length - todo.length, capped: todo.length > MAX_PAGES_PER_RUN };
  } finally {
    await conn.query("SELECT RELEASE_LOCK(?)", [LOCK]).catch(() => {});
  }
}
