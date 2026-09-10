// scripts/make-content-templates.mjs
//
// Builds the Excel templates an editor fills in to create the missing
// /{city}/{brand}/{cat} pages.
//
//   node scripts/make-content-templates.mjs
//
// "Missing" means: the city already has a /{city}/{cat} page (so the city page
// renders a "Popular Brand" link to /{city}/{brand}/{cat}) but page_master_tb
// has no row for that city+brand+category, so the link 404s. See
// scripts/import-brand-pages.mjs for the other half of the round trip.
//
// One workbook per category+brand, because content gets written brand by brand
// and a finished brand can be imported while the next one is still being
// written. Combinations with only a handful of missing pages are collected
// into a single leftovers workbook instead of a file each.
//
// The url column is the key the importer reads — city / brand / category are
// carried alongside purely so the writer has the real names to hand. Rows are
// ordered by the same crawl-priority tiers the sitemaps use, so the cities
// worth the most traffic sit at the top of every sheet.

import ExcelJS from "exceljs";
import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "content-templates");
const BASE = "https://www.mrserviceexpert.com";

// Below this, a category+brand goes into the leftovers workbook rather than
// getting a file of its own.
const OWN_FILE_MIN_ROWS = 50;
const LEFTOVERS_FILE = "misc-leftovers.xlsx";
const SHEET = "pages";

// Same tiers as scripts/generate-sitemaps.mjs — metros first, then the
// serviced tier-2 cities, then everything else alphabetically.
const TIER_ALWAYS = ["hyderabad", "mumbai", "noida", "chandigarh", "panchkula", "mohali", "faridabad", "bhopal", "thane", "greater-noida", "sohna", "manesar", "zirakpur", "ghaziabad", "gurgaon", "indore", "meerut", "jaipur", "mahbubnagar", "khammam", "adilabad", "bharatpur"];
const TIER_WEEKLY_HIGH = ["prayagraj", "port-blair", "jamugurihat", "ahmedabad", "pune", "ghilot", "guwahati", "dibrugarh", "patna", "tinsukia", "kamrup", "gaya", "chapra", "bhagalpur", "bhojpur", "arrah", "rohtak", "hazaribagh", "dhampur", "neemrana", "bawal", "baljeet-nagar-delhi", "rohini-delhi", "agra", "bijnor", "kanpur", "gonda", "lucknow", "shahjahanpur", "moradabad", "agartala", "bhubaneswar", "choudwar", "bargarh", "kota", "kotputli", "khordha", "rewari", "tohana", "ranchi", "nagpur", "nashik", "namsai", "valsad", "dharuhera", "gandhinagar", "dholka"];

const rankOf = (city) => {
  const a = TIER_ALWAYS.indexOf(city);
  if (a !== -1) return a;
  const w = TIER_WEEKLY_HIGH.indexOf(city);
  if (w !== -1) return 1000 + w;
  return Infinity;
};

// Column order the importer expects. `key` doubles as the page_master_tb
// column name for everything from page_title onwards; the first five are
// reference only and are ignored on import.
const COLUMNS = [
  { key: "url", header: "url", width: 62, locked: true },
  { key: "city_name", header: "city_name", width: 20, locked: true },
  { key: "state", header: "state", width: 18, locked: true },
  { key: "brand_name", header: "brand_name", width: 18, locked: true },
  { key: "category_name", header: "category_name", width: 22, locked: true },
  { key: "page_title", header: "page_title  (max 200)", width: 42 },
  { key: "meta_title", header: "meta_title  (max 255)", width: 42 },
  { key: "meta_description", header: "meta_description  (max 255)", width: 52 },
  { key: "meta_keywords", header: "meta_keywords  (max 255)", width: 42 },
  { key: "page_content", header: "page_content  (HTML)", width: 80 },
];
for (let i = 1; i <= 5; i++) {
  COLUMNS.push({ key: `faqquestion${i}`, header: `faqquestion${i}`, width: 42 });
  COLUMNS.push({ key: `faqanswer${i}`, header: `faqanswer${i}`, width: 60 });
}

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

const clean = (v) => (v ?? "").toString().trim().toLowerCase();

async function writeWorkbook(file, rows) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(SHEET);

  ws.columns = COLUMNS.map((c) => ({ key: c.key, width: c.width }));
  ws.addRow(COLUMNS.map((c) => c.header));
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFEFEFEF" },
  };
  // Freeze the header and the five reference columns so the writer can always
  // see which page a row belongs to while scrolling right through the content.
  ws.views = [{ state: "frozen", xSplit: 5, ySplit: 1 }];

  for (const r of rows) ws.addRow(COLUMNS.map((c) => r[c.key] ?? ""));

  // The reference columns are prefilled and must not drift, so grey them out —
  // a visual cue only; the sheet is not password protected.
  const refCount = COLUMNS.filter((c) => c.locked).length;
  for (let i = 1; i <= refCount; i++) {
    ws.getColumn(i).font = { color: { argb: "FF666666" } };
  }
  // page_content holds multi-paragraph HTML; without wrapping the sheet is
  // unreadable the moment anything is typed into it.
  ws.getColumn(COLUMNS.findIndex((c) => c.key === "page_content") + 1).alignment =
    { wrapText: true, vertical: "top" };

  await wb.xlsx.writeFile(path.join(OUT_DIR, file));
}

/** Writes a workbook unless one is already sitting there. */
async function emit(file, rows) {
  if (!force && fs.existsSync(path.join(OUT_DIR, file))) {
    skipped.push(file);
    return false;
  }
  await writeWorkbook(file, rows);
  return true;
}

loadEnv();

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
  connectTimeout: 20000,
});

const [categories] = await db.query(
  `SELECT id, category_name, category_url
     FROM category_tb
    WHERE category_url IS NOT NULL AND category_url <> ''
    ORDER BY id`
);
// status='0' brands are off site-wide (see lib/cityCategoryPageData.js), so
// their pages are never linked and there is nothing to write content for.
const [brands] = await db.query(
  `SELECT id, brand_name, LOWER(brand_url) AS brand_url, category_id
     FROM brand_tb
    WHERE status = '1'
      AND brand_url IS NOT NULL AND brand_url <> ''`
);
const [cities] = await db.query(
  `SELECT id, city_name, LOWER(city_url) AS city_url, state
     FROM city_tb
    WHERE city_url IS NOT NULL AND city_url <> ''`
);
// Cities that already have a /{city}/{cat} page — those are the only pages that
// render brand links, so they define which brand pages are actually reachable.
const [cityPages] = await db.query(
  `SELECT DISTINCT city_id, category_id FROM master_tb_withoutbrand`
);
const [existing] = await db.query(
  `SELECT city_id, category_id, brand_id FROM page_master_tb`
);

await db.end();

const cityById = new Map(cities.map((c) => [c.id, c]));
const brandById = new Map(brands.map((b) => [b.id, b]));

// city+category+brand_url combinations that already have a page.
const have = new Set();
for (const row of existing) {
  const brand = brandById.get(row.brand_id);
  const city = cityById.get(row.city_id);
  if (brand && city) have.add(`${row.category_id}|${city.city_url}|${brand.brand_url}`);
}

// category_id -> [city rows that have a city page for it]
const citiesForCategory = new Map();
for (const row of cityPages) {
  const city = cityById.get(row.city_id);
  if (!city) continue;
  if (!citiesForCategory.has(row.category_id)) citiesForCategory.set(row.category_id, []);
  citiesForCategory.get(row.category_id).push(city);
}
for (const list of citiesForCategory.values()) {
  list.sort((a, b) => rankOf(a.city_url) - rankOf(b.city_url) || a.city_url.localeCompare(b.city_url));
}

const groups = [];
for (const cat of categories) {
  const catSlug = clean(cat.category_url);
  const catCities = citiesForCategory.get(cat.id) || [];
  for (const brand of brands.filter((b) => b.category_id === cat.id)) {
    const rows = [];
    // city_tb carries a few slugs twice (madhepura, mira-bhayandar,
    // vasai-virar). One slug is one URL, so only the first row may be written —
    // the importer creates a page row for every id behind the slug.
    const seen = new Set();
    for (const city of catCities) {
      if (have.has(`${cat.id}|${city.city_url}|${brand.brand_url}`)) continue;
      if (seen.has(city.city_url)) continue;
      seen.add(city.city_url);
      rows.push({
        url: `${BASE}/${city.city_url}/${brand.brand_url}/${catSlug}`,
        city_name: city.city_name,
        state: city.state,
        brand_name: brand.brand_name,
        category_name: cat.category_name,
      });
    }
    if (rows.length) groups.push({ cat: catSlug, brand: brand.brand_url, rows });
  }
}

fs.mkdirSync(OUT_DIR, { recursive: true });

// An existing workbook is NEVER overwritten. Once someone has typed content
// into one it is the only copy of hours of work, and regenerating the blank
// templates must not be able to destroy it. --force overwrites, and is only
// safe when the files are known to still be empty.
const force = process.argv.includes("--force");

const written = [];
const skipped = [];
const leftovers = [];

for (const g of groups.sort((a, b) => b.rows.length - a.rows.length)) {
  if (g.rows.length < OWN_FILE_MIN_ROWS) {
    leftovers.push(...g.rows);
    continue;
  }
  const file = `${g.brand}-${g.cat}.xlsx`;
  if (await emit(file, g.rows)) written.push({ file, count: g.rows.length });
}

if (leftovers.length) {
  if (await emit(LEFTOVERS_FILE, leftovers)) {
    written.push({ file: LEFTOVERS_FILE, count: leftovers.length });
  }
}

for (const { file, count } of written) {
  console.log(`${String(count).padStart(6)}  ${file}`);
}
console.log(
  `\n${written.length} workbooks written, ${written.reduce((n, w) => n + w.count, 0)} rows -> ${path.relative(ROOT, OUT_DIR)}/`
);

if (skipped.length) {
  console.log(
    `\n${skipped.length} workbook(s) left untouched because they already exist:`
  );
  for (const f of skipped) console.log(`  ${f}`);
  console.log(`Delete them yourself, or pass --force, to rebuild them blank.`);
}
