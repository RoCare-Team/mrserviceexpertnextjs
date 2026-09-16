import { listBlogsForSitemap } from "@/lib/blogs";

// Served alongside the static files in public/sitemap/ and listed in
// public/sitemap.xml. Generated from the DB (not by scripts/generate-sitemaps)
// so a blog published from the admin panel shows up without a redeploy.
export const revalidate = 3600;

const BASE = "https://www.mrserviceexpert.com";

const escapeXml = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]);

// DB dates are IST midnights (18:30 UTC the day before) — format in IST so
// the day doesn't slip back by one.
const istDate = (d) => d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

const urlXml = ({ loc, lastmod, changefreq, priority }) =>
  `  <url>\n` +
  `    <loc>${escapeXml(loc)}</loc>\n` +
  (lastmod ? `    <lastmod>${istDate(lastmod)}</lastmod>\n` : "") +
  `    <changefreq>${changefreq}</changefreq>\n` +
  `    <priority>${priority}</priority>\n` +
  `  </url>`;

export async function GET() {
  const blogs = await listBlogsForSitemap();

  const entries = [
    { loc: `${BASE}/blogs`, lastmod: blogs.map((b) => b.lastmod).filter(Boolean).sort((a, b) => b - a)[0], changefreq: "daily", priority: "0.8" },
    ...blogs.map((b) => ({
      loc: `${BASE}/blogs/${encodeURIComponent(b.blog_url)}`,
      lastmod: b.lastmod,
      changefreq: "monthly",
      priority: "0.7",
    })),
  ];

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    entries.map(urlXml).join("\n") +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
