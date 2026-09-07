// scripts/generate-sitemaps.mjs
//
// Regenerates every file in public/sitemap/ plus the public/sitemap.xml index
// straight from the database, so the XML can never drift from the pages that
// actually resolve.
//
//   node scripts/generate-sitemaps.mjs
//
// Two kinds of sitemap are produced, one pair per category:
//
//   <cat>-pages.xml            /{city}/{cat}         <- master_tb_withoutbrand
//   brandwise-<cat>-pages.xml  /{city}/{brand}/{cat} <- page_master_tb
//
// Rows carrying robots='noindex' are skipped: the cleaning/trades categories
// only have ~34 real city pages each and the remaining ~1320 rows are
// placeholders the backend deliberately marked noindex. A brandwise file is
// only written when the category actually has brand pages.

import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "sitemap");
const INDEX_FILE = path.join(ROOT, "public", "sitemap.xml");
const BASE = "https://www.mrserviceexpert.com";

// Filenames already submitted to Google — keep them so no previously indexed
// sitemap URL starts 404ing after a regeneration.
const LEGACY_FILENAMES = { 1: "water-purifier.xml", 2: "ac-service-pages.xml" };
const cityPagesFile = (slug, id) => LEGACY_FILENAMES[id] ?? `${slug}-pages.xml`;
const brandPagesFile = (slug) => `brandwise-${slug}-pages.xml`;

// Priority tiers carried over from the hand-maintained sitemaps: the metros
// crawl first, then the serviced tier-2 cities, then everything else.
const TIER_ALWAYS = ["hyderabad", "mumbai", "noida", "chandigarh", "panchkula", "mohali", "faridabad", "bhopal", "thane", "greater-noida", "sohna", "manesar", "zirakpur", "ghaziabad", "gurgaon", "indore", "meerut", "jaipur", "mahbubnagar", "khammam", "adilabad", "bharatpur"];
const TIER_WEEKLY_HIGH = ["prayagraj", "port-blair", "jamugurihat", "ahmedabad", "pune", "ghilot", "guwahati", "dibrugarh", "patna", "tinsukia", "kamrup", "gaya", "chapra", "bhagalpur", "bhojpur", "arrah", "rohtak", "hazaribagh", "dhampur", "neemrana", "bawal", "baljeet-nagar-delhi", "rohini-delhi", "agra", "bijnor", "kanpur", "gonda", "lucknow", "shahjahanpur", "moradabad", "agartala", "bhubaneswar", "choudwar", "bargarh", "kota", "kotputli", "khordha", "rewari", "tohana", "ranchi", "nagpur", "nashik", "namsai", "valsad", "dharuhera", "gandhinagar", "dholka"];

const rankOf = (city) => {
  const a = TIER_ALWAYS.indexOf(city);
  if (a !== -1) return { rank: a, changefreq: "always", priority: "0.9" };
  const w = TIER_WEEKLY_HIGH.indexOf(city);
  if (w !== -1) return { rank: 1000 + w, changefreq: "weekly", priority: "0.8" };
  return { rank: Infinity, changefreq: "weekly", priority: "0.7" };
};

// A slug reaching the XML unescaped would silently corrupt the file, and every
// slug in the DB is already [a-z0-9-] — so treat anything else as a data bug
// worth reporting rather than something to escape and ship.
const SLUG = /^[a-z0-9-]+$/;
const clean = (v) => (v ?? "").toString().trim().toLowerCase();

function loadEnv() {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (!(key in process.env)) {
      process.env[key] = trimmed
        .slice(eq + 1)
        .trim()
        .replace(/^["']|["']$/g, "");
    }
  }
}

const urlsetXml = (entries, indent) => {
  const pad = " ".repeat(indent);
  const body = entries
    .map(
      (e) =>
        `${pad}<url>\n` +
        `${pad}${pad}<loc>${e.loc}</loc>\n` +
        `${pad}${pad}<changefreq>${e.changefreq}</changefreq>\n` +
        `${pad}${pad}<priority>${e.priority}</priority>\n` +
        `${pad}</url>`
    )
    .join("\n");
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
  );
};

const indexXml = (files) =>
  `<?xml version="1.0" encoding="UTF-8"?>\n` +
  `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  files
    .map((f) => `  <sitemap>\n    <loc>${BASE}/sitemap/${f}</loc>\n  </sitemap>`)
    .join("\n") +
  `\n</sitemapindex>\n`;

const rejected = [];

/** De-duplicates, drops malformed slugs, and orders by crawl priority. */
function buildEntries(rows, toPath) {
  const seen = new Map();
  for (const row of rows) {
    const parts = Object.values(row).map(clean);
    if (parts.some((p) => !SLUG.test(p))) {
      rejected.push(parts.join("/"));
      continue;
    }
    const city = parts[0];
    const loc = `${BASE}/${toPath(parts)}`;
    if (!seen.has(loc)) seen.set(loc, { loc, city, ...rankOf(city) });
  }
  return [...seen.values()].sort(
    (a, b) => a.rank - b.rank || a.loc.localeCompare(b.loc)
  );
}

loadEnv();

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
});

const [categories] = await db.query(
  `SELECT id, category_url FROM category_tb
    WHERE category_url IS NOT NULL AND category_url <> ''
    ORDER BY id`
);

const written = [];

for (const cat of categories) {
  const slug = clean(cat.category_url);

  // /{city}/{cat} — one row per city that has real content for this category.
  const [cityRows] = await db.query(
    `SELECT DISTINCT ci.city_url
       FROM master_tb_withoutbrand m
       JOIN city_tb ci ON ci.id = m.city_id
      WHERE m.category_id = ?
        AND m.robots <> 'noindex'
        AND ci.city_url IS NOT NULL AND ci.city_url <> ''`,
    [cat.id]
  );
  const cityEntries = buildEntries(cityRows, ([city]) => `${city}/${slug}`);
  if (cityEntries.length) {
    const file = cityPagesFile(slug, cat.id);
    fs.writeFileSync(path.join(OUT_DIR, file), urlsetXml(cityEntries, 0), "utf8");
    written.push({ file, count: cityEntries.length });
  }

  // /{city}/{brand}/{cat} — only categories that actually have brand pages.
  const [brandRows] = await db.query(
    `SELECT DISTINCT ci.city_url, b.brand_url
       FROM page_master_tb p
       JOIN city_tb ci ON ci.id = p.city_id
       JOIN brand_tb b ON b.id = p.brand_id
      WHERE p.category_id = ?
        AND ci.city_url IS NOT NULL AND ci.city_url <> ''
        AND b.brand_url IS NOT NULL AND b.brand_url <> ''`,
    [cat.id]
  );
  const brandEntries = buildEntries(
    brandRows,
    ([city, brand]) => `${city}/${brand}/${slug}`
  ).map((e) => ({ ...e, changefreq: "daily", priority: "0.9" }));
  if (brandEntries.length) {
    const file = brandPagesFile(slug);
    fs.writeFileSync(path.join(OUT_DIR, file), urlsetXml(brandEntries, 2), "utf8");
    written.push({ file, count: brandEntries.length });
  }
}

await db.end();

fs.writeFileSync(INDEX_FILE, indexXml(written.map((w) => w.file)), "utf8");

for (const { file, count } of written) {
  console.log(`${String(count).padStart(6)}  ${file}`);
}
console.log(
  `\n${written.length} sitemaps, ${written.reduce((n, w) => n + w.count, 0)} URLs`
);

if (rejected.length) {
  console.warn(`\nSkipped ${rejected.length} malformed slug(s):`);
  for (const r of rejected.slice(0, 20)) console.warn(`  ${r}`);
}

// Google caps a single sitemap at 50,000 URLs — split before that bites.
const oversized = written.filter((w) => w.count > 50000);
if (oversized.length) {
  console.error(
    `\nOVER 50,000 URL LIMIT: ${oversized.map((o) => o.file).join(", ")}`
  );
  process.exitCode = 1;
}
