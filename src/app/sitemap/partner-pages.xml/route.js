import db from "@/lib/db";
import { hasColumn } from "@/lib/partners/schema";

// Pages created because an approved partner serves that city / locality
// (partner_generated_pages, migration 012). Live route so a newly approved
// partner's pages show up without re-running `npm run sitemaps`. A page is
// listed only while at least one partner is visible on it — the same rule
// that keeps it indexable (lib/localities.js pageRobots).
export const revalidate = 3600;

const BASE = "https://www.mrserviceexpert.com";
const SLUG = /^[a-z0-9-]+$/;

const escapeXml = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);

const istDate = (d) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export async function GET() {
  let rows = [];
  try {
    if (await hasColumn("partner_generated_pages", "page_kind")) {
      const locks = await hasColumn("partner_service_areas", "badge_locked");
      const lk = (a) => (locks ? ` AND ${a}.badge_locked = 0` : "");
      [rows] = await db.query(
        `SELECT LOWER(ci.city_url) AS city_url, LOWER(ca.category_url) AS category_url,
                LOWER(b.brand_url) AS brand_url, g.created_at
           FROM partner_generated_pages g
           JOIN city_tb ci ON ci.id = g.city_id
           JOIN category_tb ca ON ca.id = g.category_id
           LEFT JOIN brand_tb b ON b.id = g.brand_id
          WHERE ca.status = '1' AND ci.status = '1'
            AND (g.page_kind = 'category' OR b.status = '1')
            AND EXISTS (
              SELECT 1 FROM partners p
               WHERE p.status = 'approved' AND p.is_listed = 1
                 AND p.mobile_verified_at IS NOT NULL AND p.deleted_at IS NULL
                 AND EXISTS (SELECT 1 FROM partner_services ps WHERE ps.partner_id = p.id AND ps.category_id = g.category_id)
                 AND EXISTS (SELECT 1 FROM partner_service_areas a
                              WHERE a.partner_id = p.id${lk("a")}
                                AND ((a.city_id = g.city_id AND a.locality_key = 0) OR a.locality_id = g.city_id))
                 ${locks ? "AND EXISTS (SELECT 1 FROM partner_categories pc WHERE pc.partner_id = p.id AND pc.category_id = g.category_id AND pc.badge_locked = 0)" : ""}
                 AND (g.brand_id IS NULL OR EXISTS (
                       SELECT 1 FROM partner_brands pb
                        WHERE pb.partner_id = p.id AND pb.category_id = g.category_id AND pb.brand_id = g.brand_id${lk("pb")}))
            )
          ORDER BY g.id
          LIMIT 50000`
      );
    }
  } catch (err) {
    if (err?.code !== "ER_NO_SUCH_TABLE" && err?.code !== "ER_BAD_FIELD_ERROR") throw err;
  }

  const urls = rows
    .filter((r) => SLUG.test(r.city_url || "") && SLUG.test(r.category_url || "") && (!r.brand_url || SLUG.test(r.brand_url)))
    .map((r) => {
      const path = r.brand_url ? `${r.city_url}/${r.brand_url}/${r.category_url}` : `${r.city_url}/${r.category_url}`;
      return (
        `  <url>\n    <loc>${escapeXml(`${BASE}/${path}`)}</loc>\n` +
        (r.created_at ? `    <lastmod>${istDate(r.created_at)}</lastmod>\n` : "") +
        `    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>`
      );
    });

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.join("\n") +
    `\n</urlset>\n`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
