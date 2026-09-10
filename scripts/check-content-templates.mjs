// scripts/check-content-templates.mjs
//
// Validates filled-in content workbooks BEFORE anything is written to the DB.
//
//   node scripts/check-content-templates.mjs                       # every file
//   node scripts/check-content-templates.mjs content-templates/whirlpool-ac.xlsx
//
// Read-only: it opens the workbooks and the database but writes to neither.
//
// Two kinds of problem are reported separately, because they need different
// responses:
//
//   ERRORS   the importer would reject or the DB would silently truncate —
//            missing required text, over-length meta fields, a url that no
//            longer resolves to a live city/brand/category.
//   WARNINGS the page would import fine but would be weak — content that is
//            the same for every city bar the name, a page that never mentions
//            its own city, markup the live page can't render.
//
// The near-duplicate check is the point of this script. The 63,921 pages
// already live only have 56,976 distinct bodies because whole brands were
// filled in by find-and-replacing the city name, and that is exactly what
// Google reads as doorway content. Blanking the city, state and brand out of
// each body before hashing catches that pattern no matter how many names were
// swapped.

import ExcelJS from "exceljs";
import mysql from "mysql2/promise";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "content-templates");
const SHEET = "pages";

const REF_COLUMNS = ["url", "city_name", "state", "brand_name", "category_name"];
const REQUIRED = ["page_title", "meta_title", "meta_description", "meta_keywords", "page_content"];
const MAX_LEN = {
  page_title: 200,
  meta_title: 255,
  meta_description: 255,
  meta_keywords: 255,
};
// Below this a body is not a landing page, whatever else it gets right.
const MIN_CONTENT_WORDS = 120;
// Tags the live page renders cleanly. <h1> is excluded on purpose: the page
// already has one, and a second breaks the heading outline.
const ALLOWED_TAGS = new Set(["p", "h2", "h3", "h4", "ul", "ol", "li", "strong", "em", "br", "b", "i"]);

const norm = (v) => (v ?? "").toString().trim();
const stripTags = (html) =>
  norm(html)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
const words = (html) => stripTags(html).split(/\s+/).filter(Boolean).length;

/** Excel gives back a string, a rich-text object, or a formula result. */
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

/** "meta_title  (max 255)" -> "meta_title" */
const headerKey = (h) => norm(h).split("(")[0].trim().toLowerCase();

/**
 * Body with its own city / state / brand names removed, so two pages that
 * differ only by those names hash identically.
 */
function fingerprint(html, { city_name, state, brand_name }) {
  let t = stripTags(html).toLowerCase();
  for (const name of [city_name, state, brand_name]) {
    const n = norm(name).toLowerCase();
    if (n.length < 3) continue;
    t = t.split(n).join(" ");
  }
  return crypto.createHash("md5").update(t.replace(/\s+/g, " ").trim()).digest("hex");
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
// status='1' only — a brand switched off no longer renders anywhere, so rows
// written for it would create pages nothing links to.
const [brandRows] = await db.query(
  `SELECT id, LOWER(brand_url) AS brand_url, category_id FROM brand_tb WHERE status = '1' AND brand_url IS NOT NULL AND brand_url <> ''`
);
const [catRows] = await db.query(
  `SELECT id, LOWER(category_url) AS category_url FROM category_tb WHERE category_url IS NOT NULL AND category_url <> ''`
);
const [existingRows] = await db.query(
  `SELECT city_id, category_id, brand_id FROM page_master_tb`
);
await db.end();

// A slug can map to several city ids (madhepura, mira-bhayandar, vasai-virar).
const cityIds = new Map();
for (const c of cityRows) {
  if (!cityIds.has(c.city_url)) cityIds.set(c.city_url, []);
  cityIds.get(c.city_url).push(c.id);
}
const catBySlug = new Map(catRows.map((c) => [c.category_url, c.id]));
const brandSlugs = new Set(brandRows.map((b) => b.brand_url));
const brandIdOf = new Map();
for (const b of brandRows) {
  // Same preference order as lib/brandPageData.js: this category's row first.
  const key = `${b.brand_url}|${b.category_id}`;
  if (!brandIdOf.has(key)) brandIdOf.set(key, b.id);
}
const alreadyLive = new Set(existingRows.map((r) => `${r.city_id}|${r.category_id}|${r.brand_id}`));

const files = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const targets = files.length
  ? files.map((f) => path.resolve(ROOT, f))
  : fs
      .readdirSync(DIR)
      .filter((f) => f.endsWith(".xlsx") && !f.startsWith("~$"))
      .map((f) => path.join(DIR, f));

let grandErrors = 0;
let grandWarnings = 0;
let grandReady = 0;

for (const file of targets) {
  const name = path.basename(file);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = wb.getWorksheet(SHEET);

  console.log(`\n${"=".repeat(72)}\n${name}`);
  if (!ws) {
    console.log(`  ERROR  sheet "${SHEET}" not found (sheets: ${wb.worksheets.map((w) => w.name).join(", ")})`);
    grandErrors++;
    continue;
  }

  const header = ws.getRow(1).values.slice(1).map(headerKey);
  const colOf = (key) => header.indexOf(key) + 1;
  const missingCols = [...REF_COLUMNS, ...REQUIRED].filter((k) => colOf(k) === 0);
  if (missingCols.length) {
    console.log(`  ERROR  header row is missing columns: ${missingCols.join(", ")}`);
    grandErrors++;
    continue;
  }

  const errors = [];
  const warnings = [];
  const byFingerprint = new Map();
  const seenUrls = new Set();
  const seenTitles = new Map();
  let filled = 0;
  let blank = 0;
  let ready = 0;
  const contentLengths = [];

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const get = (key) => cellText(row.getCell(colOf(key)));
    const url = get("url");
    if (!url) continue;

    const at = (msg) => `row ${r} (${url.replace(/^https?:\/\/[^/]+/, "")}): ${msg}`;

    // A row nobody has touched yet is not an error — the sheet is filled in
    // over time and the importer simply skips these.
    const anyFilled = REQUIRED.some((k) => get(k));
    if (!anyFilled) {
      blank++;
      continue;
    }
    filled++;

    /* ---- url still resolves to a live city / brand / category ---- */
    const slug = url.replace(/^https?:\/\/[^/]+/, "").replace(/^\/+|\/+$/g, "").toLowerCase();
    const parts = slug.split("/");
    let rowOk = true;
    if (parts.length !== 3) {
      errors.push(at(`url is not /{city}/{brand}/{category}`));
      rowOk = false;
    } else {
      const [citySlug, brandSlug, catSlug] = parts;
      const catId = catBySlug.get(catSlug);
      if (!cityIds.has(citySlug)) { errors.push(at(`unknown city "${citySlug}"`)); rowOk = false; }
      if (!brandSlugs.has(brandSlug)) { errors.push(at(`unknown brand "${brandSlug}"`)); rowOk = false; }
      if (!catId) { errors.push(at(`unknown category "${catSlug}"`)); rowOk = false; }
      if (rowOk) {
        const brandId = brandIdOf.get(`${brandSlug}|${catId}`) ?? brandIdOf.get(`${brandSlug}|`);
        const live = cityIds.get(citySlug).some((cid) => alreadyLive.has(`${cid}|${catId}|${brandId}`));
        if (live) warnings.push(at(`page already exists in page_master_tb — import will skip it`));
      }
    }
    if (seenUrls.has(slug)) { errors.push(at(`duplicate url in this file`)); rowOk = false; }
    seenUrls.add(slug);

    /* ---- required text present and inside the column limits ---- */
    for (const k of REQUIRED) {
      if (!get(k)) { errors.push(at(`${k} is empty`)); rowOk = false; }
    }
    for (const [k, max] of Object.entries(MAX_LEN)) {
      const len = get(k).length;
      if (len > max) { errors.push(at(`${k} is ${len} chars, limit ${max} — would be truncated`)); rowOk = false; }
    }

    /* ---- body quality ---- */
    const content = get("page_content");
    if (content) {
      const wc = words(content);
      contentLengths.push(wc);
      if (wc < MIN_CONTENT_WORDS) {
        warnings.push(at(`page_content is only ${wc} words`));
      }
      if (/<h1[\s>]/i.test(content)) warnings.push(at(`page_content contains <h1> — the page already renders one`));
      if (/<(script|style|iframe)[\s>]/i.test(content)) {
        errors.push(at(`page_content contains a <script>/<style>/<iframe> tag`));
        rowOk = false;
      }
      if (/<!doctype|<html[\s>]|<body[\s>]/i.test(content)) {
        errors.push(at(`page_content is a full HTML document, not a fragment`));
        rowOk = false;
      }
      const badTags = [...new Set(
        [...content.matchAll(/<\s*\/?\s*([a-z][a-z0-9]*)/gi)].map((m) => m[1].toLowerCase())
      )].filter((t) => !ALLOWED_TAGS.has(t) && !["h1", "script", "style", "iframe", "html", "body"].includes(t));
      if (badTags.length) warnings.push(at(`unexpected tags in page_content: ${badTags.join(", ")}`));
      if (!/<(p|h2|h3|ul|ol)[\s>]/i.test(content)) {
        warnings.push(at(`page_content has no block tags — is it plain text?`));
      }

      const cityName = get("city_name");
      if (cityName && !stripTags(content).toLowerCase().includes(cityName.toLowerCase())) {
        warnings.push(at(`page_content never mentions "${cityName}"`));
      }

      const fp = fingerprint(content, {
        city_name: get("city_name"),
        state: get("state"),
        brand_name: get("brand_name"),
      });
      if (!byFingerprint.has(fp)) byFingerprint.set(fp, []);
      byFingerprint.get(fp).push(r);
    }

    /* ---- FAQ pairs: a question without its answer renders an empty block ---- */
    for (let i = 1; i <= 5; i++) {
      const qCol = colOf(`faqquestion${i}`);
      const aCol = colOf(`faqanswer${i}`);
      if (!qCol || !aCol) continue;
      const q = cellText(row.getCell(qCol));
      const a = cellText(row.getCell(aCol));
      if (q && !a) warnings.push(at(`faqquestion${i} has no faqanswer${i}`));
      if (a && !q) warnings.push(at(`faqanswer${i} has no faqquestion${i}`));
    }

    /* ---- identical titles across cities read as one page duplicated ---- */
    const title = get("page_title").toLowerCase();
    if (title) {
      seenTitles.set(title, (seenTitles.get(title) || 0) + 1);
    }

    if (rowOk) ready++;
  }

  /* ---- near-duplicate bodies ---- */
  const dupeGroups = [...byFingerprint.values()].filter((rows) => rows.length > 1);
  const dupeRows = dupeGroups.reduce((n, g) => n + g.length, 0);
  const repeatedTitles = [...seenTitles.entries()].filter(([, n]) => n > 1);

  const avgWords = contentLengths.length
    ? Math.round(contentLengths.reduce((a, b) => a + b, 0) / contentLengths.length)
    : 0;

  console.log(`  rows ${ws.rowCount - 1}   filled ${filled}   blank ${blank}   importable ${ready}`);
  if (contentLengths.length) {
    console.log(`  page_content words: avg ${avgWords}, min ${Math.min(...contentLengths)}, max ${Math.max(...contentLengths)}`);
    console.log(`  distinct bodies (city/brand names ignored): ${byFingerprint.size} of ${contentLengths.length}`);
  }

  if (dupeGroups.length) {
    console.log(`\n  NEAR-DUPLICATE CONTENT: ${dupeRows} rows share only ${dupeGroups.length} distinct bodies`);
    for (const g of dupeGroups.slice(0, 5)) {
      console.log(`    ${g.length} rows identical apart from names, e.g. rows ${g.slice(0, 6).join(", ")}${g.length > 6 ? " …" : ""}`);
    }
    if (dupeGroups.length > 5) console.log(`    … and ${dupeGroups.length - 5} more groups`);
  }
  if (repeatedTitles.length) {
    console.log(`\n  REPEATED page_title: ${repeatedTitles.length} title(s) used on more than one row`);
    for (const [t, n] of repeatedTitles.slice(0, 5)) console.log(`    ${n}x  "${t.slice(0, 70)}"`);
  }

  const show = (label, list, limit = 15) => {
    if (!list.length) return;
    console.log(`\n  ${label} (${list.length}):`);
    for (const m of list.slice(0, limit)) console.log(`    ${m}`);
    if (list.length > limit) console.log(`    … and ${list.length - limit} more`);
  };
  show("ERRORS", errors);
  show("WARNINGS", warnings);

  grandErrors += errors.length;
  grandWarnings += warnings.length;
  grandReady += ready;
}

console.log(`\n${"=".repeat(72)}`);
console.log(`${grandReady} rows importable, ${grandErrors} errors, ${grandWarnings} warnings`);
if (grandErrors) process.exitCode = 1;
