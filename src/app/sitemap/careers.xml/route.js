import { getSettings } from "@/lib/careers/settings";

// Only the careers page itself. Individual jobs have no URLs (they open in a
// popup), so nothing here goes stale when a job closes or expires.
export const revalidate = 3600;

const BASE = "https://www.mrserviceexpert.com";

export async function GET() {
  let visible = true;
  try {
    visible = (await getSettings()).careers_page_visible;
  } catch (err) {
    if (err?.code !== "ER_NO_SUCH_TABLE" && err?.code !== "ER_BAD_FIELD_ERROR") throw err;
  }
  const url = visible ? `  <url>\n    <loc>${BASE}/careers</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.6</priority>\n  </url>\n` : "";
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${url}</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
