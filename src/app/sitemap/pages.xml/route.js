// Main site pages that aren't city/category/brand pages.
export const revalidate = 86400;

const BASE = "https://www.mrserviceexpert.com";
const PAGES = [
  ["/", "daily", "1.0"],
  ["/our-services", "weekly", "0.9"],
  ["/about-us", "monthly", "0.7"],
  ["/blogs", "daily", "0.7"],
  ["/store-locator", "weekly", "0.6"],
  ["/contact", "monthly", "0.6"],
  ["/join-as-partner", "monthly", "0.6"],
  ["/help-center", "monthly", "0.5"],
];

export async function GET() {
  const urls = PAGES.map(
    ([path, freq, prio]) => `  <url>\n    <loc>${BASE}${path === "/" ? "" : path}</loc>\n    <changefreq>${freq}</changefreq>\n    <priority>${prio}</priority>\n  </url>\n`
  ).join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}</urlset>\n`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
