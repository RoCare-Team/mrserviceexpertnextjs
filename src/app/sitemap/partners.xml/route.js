import db from "@/lib/db";

// Public partner profiles. Live route (like blogs.xml) so a partner approved
// from the admin panel is picked up without a redeploy. Only profiles that
// are indexable (approved, listed, verified, with generated or written copy)
// are included — the page itself sets noindex for the rest.
export const revalidate = 3600;

const BASE = "https://www.mrserviceexpert.com";

const escapeXml = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);

const istDate = (d) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

export async function GET() {
  let rows = [];
  try {
    [rows] = await db.query(
      `SELECT p.slug, p.updated_at
         FROM partners p
        WHERE p.status = 'approved' AND p.is_listed = 1 AND p.mobile_verified_at IS NOT NULL
          AND p.deleted_at IS NULL AND p.slug IS NOT NULL
          AND (CHAR_LENGTH(COALESCE(p.seo_content, '')) >= 200 OR CHAR_LENGTH(COALESCE(p.description, '')) >= 80)
          AND EXISTS (SELECT 1 FROM partner_services ps WHERE ps.partner_id = p.id)
        ORDER BY p.approved_at DESC, p.id DESC
        LIMIT 50000`
    );
  } catch (err) {
    if (err?.code !== "ER_NO_SUCH_TABLE" && err?.code !== "ER_BAD_FIELD_ERROR") throw err;
  }

  const urls = rows
    .filter((r) => /^[a-z0-9-]+$/.test(r.slug))
    .map(
      (r) =>
        `  <url>\n    <loc>${escapeXml(`${BASE}/partners/${r.slug}`)}</loc>\n` +
        (r.updated_at ? `    <lastmod>${istDate(r.updated_at)}</lastmod>\n` : "") +
        `    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`
    );

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.join("\n") +
    `\n</urlset>\n`;

  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
