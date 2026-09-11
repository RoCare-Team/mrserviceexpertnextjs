// scripts/import-brand-pages.mjs
//
// Writes filled-in content workbooks into page_master_tb, creating the
// /{city}/{brand}/{cat} pages that currently 404.
//
//   node scripts/import-brand-pages.mjs --dry-run          # every workbook
//   node scripts/import-brand-pages.mjs                    # actually insert
//   node scripts/import-brand-pages.mjs content-templates/whirlpool-ac.xlsx
//   node scripts/import-brand-pages.mjs --limit=50          # first 50 rows/file
//
// Run scripts/check-content-templates.mjs first — it reports the same problems
// this script refuses rows for, without opening a transaction.
//
// New rows are shaped exactly like the 63,921 already in the table:
// service_type_id=1, status='1', page_url='' (the live routes resolve by
// city_id + category_id + brand_id, never by page_url).
//
// Safe to re-run. A page that already exists is skipped, never overwritten, so
// a workbook can be imported while it is still being filled in and imported
// again later for the rows added since.
//
// One row per file is NOT the unit of work: city_tb carries three slugs twice
// (madhepura, mira-bhayandar, vasai-virar) and the live lookup picks whichever
// id it finds first, so a page is written for every id behind the slug.

import ExcelJS from "exceljs";
import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "content-templates");
const SHEET = "pages";
const BATCH = 100;

const REQUIRED = ["page_title", "meta_title", "meta_description", "meta_keywords", "page_content"];
const MAX_LEN = {
  page_title: 200,
  meta_title: 255,
  meta_description: 255,
  meta_keywords: 255,
};
const FAQ_FIELDS = [];
for (let i = 1; i <= 5; i++) FAQ_FIELDS.push(`faqquestion${i}`, `faqanswer${i}`);

// Column order of the INSERT. Everything after brand_id comes from the sheet.
const INSERT_COLUMNS = [
  "city_id",
  "category_id",
  "brand_id",
  "service_type_id",
  "status",
  "page_url",
  "page_title",
  "meta_title",
  "meta_description",
  "meta_keywords",
  "page_content",
  ...FAQ_FIELDS,
];

const dryRun = process.argv.includes("--dry-run");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = limitArg ? Number(limitArg.split("=")[1]) : Infinity;

const norm = (v) => (v ?? "").toString().trim();

function cellText(cell) {
  const v = cell?.value;
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "object") {
    if (Array.isArray(v.richText)) return v.richText.map((t) => t.text).join("").trim();
    if (v.text != null) return String(v.text).trim();
    if (v.result != null) return String(v.result).trim();
    if (v.hyperlink) return String(v.hyperlink).trim();
  }
  return String(v).trim();
}

const headerKey = (h) => norm(h).split("(")[0].trim().toLowerCase();

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
      process.env[key] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
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

const [cityRows] = await db.query(
  `SELECT id, LOWER(city_url) AS city_url FROM city_tb WHERE city_url IS NOT NULL AND city_url <> ''`
);
const [brandRows] = await db.query(
  `SELECT id, LOWER(brand_url) AS brand_url, category_id
     FROM brand_tb
    WHERE status = '1' AND brand_url IS NOT NULL AND brand_url <> ''`
);
const [catRows] = await db.query(
  `SELECT id, LOWER(category_url) AS category_url FROM category_tb WHERE category_url IS NOT NULL AND category_url <> ''`
);
const [existingRows] = await db.query(`SELECT city_id, category_id, brand_id FROM page_master_tb`);

// One slug can front several city ids — write a page for each of them.
const cityIds = new Map();
for (const c of cityRows) {
  if (!cityIds.has(c.city_url)) cityIds.set(c.city_url, []);
  cityIds.get(c.city_url).push(c.id);
}
const catBySlug = new Map(catRows.map((c) => [c.category_url, c.id]));
// Same preference as lib/brandPageData.js: the row belonging to this category.
const brandIdOf = new Map();
for (const b of brandRows) {
  const key = `${b.brand_url}|${b.category_id}`;
  if (!brandIdOf.has(key)) brandIdOf.set(key, b.id);
}
const live = new Set(existingRows.map((r) => `${r.city_id}|${r.category_id}|${r.brand_id}`));

const files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const targets = files.length
  ? files.map((f) => path.resolve(ROOT, f))
  : fs
      .readdirSync(DIR)
      .filter((f) => f.endsWith(".xlsx") && !f.startsWith("~$"))
      .map((f) => path.join(DIR, f));

console.log(
  dryRun
    ? "DRY RUN — nothing will be written to the database.\n"
    : "Writing to page_master_tb.\n"
);

let grandInserted = 0;
let grandSkipped = 0;
let grandRejected = 0;

for (const file of targets) {
  const name = path.basename(file);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.getWorksheet(SHEET);

  if (!ws) {
    console.log(`${name}: ERROR sheet "${SHEET}" not found — skipped`);
    grandRejected++;
    continue;
  }

  const header = ws.getRow(1).values.slice(1).map(headerKey);
  const colOf = (key) => header.indexOf(key) + 1;
  const missingCols = ["url", ...REQUIRED].filter((k) => colOf(k) === 0);
  if (missingCols.length) {
    console.log(`${name}: ERROR header missing ${missingCols.join(", ")} — skipped`);
    grandRejected++;
    continue;
  }

  const values = [];
  const rejected = [];
  let blank = 0;
  let already = 0;
  let used = 0;

  for (let r = 2; r <= ws.rowCount && used < LIMIT; r++) {
    const row = ws.getRow(r);
    const get = (key) => {
      const c = colOf(key);
      return c ? cellText(row.getCell(c)) : "";
    };
    const url = get("url");
    if (!url) continue;

    if (!REQUIRED.some((k) => get(k))) {
      blank++;
      continue;
    }
    used++;

    const at = (msg) => `row ${r} ${url.replace(/^https?:\/\/[^/]+/, "")}: ${msg}`;

    const slug = url.replace(/^https?:\/\/[^/]+/, "").replace(/^\/+|\/+$/g, "").toLowerCase();
    const parts = slug.split("/");
    if (parts.length !== 3) {
      rejected.push(at("url is not /{city}/{brand}/{category}"));
      continue;
    }
    const [citySlug, brandSlug, catSlug] = parts;
    const catId = catBySlug.get(catSlug);
    const ids = cityIds.get(citySlug);
    if (!ids) { rejected.push(at(`unknown city "${citySlug}"`)); continue; }
    if (!catId) { rejected.push(at(`unknown category "${catSlug}"`)); continue; }
    const brandId = brandIdOf.get(`${brandSlug}|${catId}`);
    if (!brandId) { rejected.push(at(`unknown or switched-off brand "${brandSlug}"`)); continue; }

    const missing = REQUIRED.filter((k) => !get(k));
    if (missing.length) { rejected.push(at(`empty ${missing.join(", ")}`)); continue; }

    const tooLong = Object.entries(MAX_LEN)
      .filter(([k, max]) => get(k).length > max)
      .map(([k, max]) => `${k} ${get(k).length}/${max}`);
    if (tooLong.length) { rejected.push(at(`over column limit: ${tooLong.join(", ")}`)); continue; }

    const content = get("page_content");
    if (/<(script|style|iframe)[\s>]/i.test(content)) {
      rejected.push(at("page_content contains script/style/iframe"));
      continue;
    }

    for (const cityId of ids) {
      if (live.has(`${cityId}|${catId}|${brandId}`)) { already++; continue; }
      // Guard against the same page being queued twice inside one run.
      live.add(`${cityId}|${catId}|${brandId}`);
      values.push([
        cityId,
        catId,
        brandId,
        1, // service_type_id — every existing row uses 1
        "1", // status
        "", // page_url — empty on all 63,921 existing rows
        get("page_title"),
        get("meta_title"),
        get("meta_description"),
        get("meta_keywords"),
        content,
        ...FAQ_FIELDS.map((k) => get(k)),
      ]);
    }
  }

  let inserted = 0;
  if (values.length && !dryRun) {
    const sql =
      `INSERT INTO page_master_tb (${INSERT_COLUMNS.map((c) => `\`${c}\``).join(", ")}) VALUES ?`;
    await db.beginTransaction();
    try {
      for (let i = 0; i < values.length; i += BATCH) {
        const chunk = values.slice(i, i + BATCH);
        const [res] = await db.query(sql, [chunk]);
        inserted += res.affectedRows;
      }
      await db.commit();
    } catch (e) {
      await db.rollback();
      console.log(`${name}: FAILED — rolled back, nothing inserted. ${e.message}`);
      grandRejected += values.length;
      continue;
    }
  } else if (values.length) {
    inserted = values.length; // dry run: what would have been written
  }

  console.log(
    `${name.padEnd(34)} ${dryRun ? "would insert" : "inserted"} ${String(inserted).padStart(5)}` +
      `   already live ${String(already).padStart(5)}` +
      `   blank ${String(blank).padStart(5)}` +
      `   rejected ${String(rejected.length).padStart(4)}`
  );
  for (const m of rejected.slice(0, 10)) console.log(`    ${m}`);
  if (rejected.length > 10) console.log(`    … and ${rejected.length - 10} more`);

  grandInserted += inserted;
  grandSkipped += already;
  grandRejected += rejected.length;
}

await db.end();

console.log(
  `\n${dryRun ? "Would insert" : "Inserted"} ${grandInserted} rows, ` +
    `skipped ${grandSkipped} already-live, rejected ${grandRejected}.`
);
if (!dryRun && grandInserted) {
  console.log(`\nNext: node scripts/generate-sitemaps.mjs`);
}
