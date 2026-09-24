// scripts/seed-near-me-pages.mjs
//
// Creates the /near-me/* pages the live routes need:
//
//   master_tb_withoutbrand  -> /near-me/{category}          (one per category)
//   page_master_tb          -> /near-me/{brand}/{category}  (one per brand)
//
// Both routes resolve by ID, so a missing row is the difference between a real
// page and a 404 (the brand route) or a thin fallback page (the category
// route). The wording lives in scripts/near-me-copy.mjs — edit that file and
// re-run with --force to revise the pages.
//
//   node scripts/seed-near-me-pages.mjs              # dry run, writes nothing
//   node scripts/seed-near-me-pages.mjs --commit     # insert missing rows
//   node scripts/seed-near-me-pages.mjs --commit --force   # also rewrite existing
//   node scripts/seed-near-me-pages.mjs --sample ac  # print one page and exit
//
// Re-running without --force is safe: rows that already exist are left alone.

import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NEAR_ME_ONLY_BRANDS } from "./near-me-copy.mjs";
import {
  CATEGORY_COPY,
  categoryPage,
  brandPage,
  faqColumns,
} from "../src/lib/pageContent.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CITY_SLUG = "near-me";

const args = process.argv.slice(2);
const COMMIT = args.includes("--commit");
const FORCE = args.includes("--force");
const SAMPLE = args.includes("--sample") ? args[args.indexOf("--sample") + 1] : null;

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

/* ───────────────────────────── row writing ───────────────────────────── */

async function upsert(db, table, keyCols, keyVals, page, extra = {}) {
  const [existing] = await db.query(
    `SELECT id FROM \`${table}\` WHERE ${keyCols.map((c) => `${c} = ?`).join(" AND ")} LIMIT 1`,
    keyVals
  );

  const row = {
    page_title: page.page_title,
    page_url: "",
    page_content: page.page_content,
    status: "1",
    service_type_id: 1,
    meta_title: page.meta_title,
    meta_keywords: page.meta_keywords,
    meta_description: page.meta_description,
    ...faqColumns(page.faqs),
    ...extra,
  };

  if (existing.length) {
    if (!FORCE) return "skipped";
    if (!COMMIT) return "would-update";
    const cols = Object.keys(row);
    await db.query(
      `UPDATE \`${table}\` SET ${cols.map((c) => `${c} = ?`).join(", ")} WHERE id = ?`,
      [...cols.map((c) => row[c]), existing[0].id]
    );
    return "updated";
  }

  if (!COMMIT) return "would-insert";
  const cols = [...keyCols, ...Object.keys(row)];
  const vals = [...keyVals, ...Object.keys(row).map((c) => row[c])];
  await db.query(
    `INSERT INTO \`${table}\` (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")})`,
    vals
  );
  return "inserted";
}

/* ──────────────────────────────── main ──────────────────────────────── */

loadEnv();

const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
});

const [[city]] = await db.query(
  "SELECT id, city_name, city_url FROM city_tb WHERE LOWER(city_url) = ? LIMIT 1",
  [CITY_SLUG]
);
if (!city) {
  console.error(`No city_tb row with city_url='${CITY_SLUG}'. Create it first.`);
  await db.end();
  process.exit(1);
}

const [categories] = await db.query(
  "SELECT id, category_name, category_url FROM category_tb WHERE status = '1' ORDER BY id"
);
const [brands] = await db.query(
  `SELECT b.id, b.brand_name, b.brand_url, b.category_id
     FROM brand_tb b
    WHERE b.status = '1' AND b.brand_url IS NOT NULL AND b.brand_url <> ''
    ORDER BY b.category_id, b.brand_name`
);

// --sample prints one category page and one brand page, then exits. Nothing
// touches the database, so it is the safe way to review wording changes.
if (SAMPLE) {
  const cat = categories.find((c) => c.category_url === SAMPLE);
  const copy = CATEGORY_COPY[SAMPLE];
  if (!cat || !copy) {
    console.error(`Unknown category '${SAMPLE}'.`);
    await db.end();
    process.exit(1);
  }
  const cp = categoryPage(copy);
  console.log(`===== /near-me/${cat.category_url} =====`);
  console.log(JSON.stringify({ ...cp, faqs: cp.faqs.length }, null, 2));
  console.log(cp.page_content);
  const brand = brands.find((b) => b.category_id === cat.id);
  if (brand) {
    const bp = brandPage(brand, copy, city);
    console.log(`\n===== /near-me/${brand.brand_url}/${cat.category_url} =====`);
    console.log(JSON.stringify({ ...bp, faqs: bp.faqs.length }, null, 2));
    console.log(bp.page_content);
  }
  await db.end();
  process.exit(0);
}

const tally = {};
const bump = (k) => (tally[k] = (tally[k] || 0) + 1);
const missingCopy = [];

console.log(`city: ${city.city_name} (id ${city.id})`);
console.log(COMMIT ? (FORCE ? "mode: COMMIT + FORCE\n" : "mode: COMMIT\n") : "mode: DRY RUN (no writes)\n");

for (const cat of categories) {
  const copy = CATEGORY_COPY[cat.category_url];
  if (!copy) {
    missingCopy.push(cat.category_url);
    continue;
  }

  const r = await upsert(
    db, "master_tb_withoutbrand",
    ["city_id", "category_id"], [city.id, cat.id],
    categoryPage(copy),
    { robots: "index" }
  );
  bump(r);
  console.log(`  ${r.padEnd(13)} /near-me/${cat.category_url}`);

  for (const brand of brands.filter((b) => b.category_id === cat.id)) {
    const rb = await upsert(
      db, "page_master_tb",
      ["city_id", "category_id", "brand_id"], [city.id, cat.id, brand.id],
      brandPage(brand, copy, city)
    );
    bump(rb);
    console.log(`  ${rb.padEnd(13)} /near-me/${brand.brand_url}/${cat.category_url}`);
  }
}

/* ───────────── near-me-only brands ─────────────
 * Created last so the brand_tb row and its single page_master_tb row are
 * written together. ONLY the near-me page is ever created, and that is what
 * keeps the brand off every other city: both "Popular Brands" lists are gated
 * on a page row existing for the city being viewed, so a brand with no row for
 * Delhi simply is not rendered there — no link, therefore no 404.
 */
for (const spec of NEAR_ME_ONLY_BRANDS) {
  const cat = categories.find((c) => c.category_url === spec.category_url);
  const copy = CATEGORY_COPY[spec.category_url];
  if (!cat || !copy) {
    console.warn(`  SKIPPED       ${spec.brand_url}: unknown category '${spec.category_url}'`);
    continue;
  }
  if (!/^[a-z0-9-]+$/.test(spec.brand_url)) {
    console.warn(`  SKIPPED       ${spec.brand_url}: slug must be [a-z0-9-]`);
    continue;
  }

  // Reuse an existing brand row for this slug + category, otherwise create one.
  let [[brandRow]] = await db.query(
    `SELECT id, brand_name, brand_url FROM brand_tb
      WHERE LOWER(brand_url) = ? AND category_id = ? LIMIT 1`,
    [spec.brand_url, cat.id]
  );

  if (!brandRow) {
    if (!COMMIT) {
      console.log(`  would-add-brand ${spec.brand_name} (${spec.brand_url}) -> ${cat.category_name}`);
      bump("would-add-brand");
      continue;
    }
    const [res] = await db.query(
      `INSERT INTO brand_tb (brand_name, brand_url, category_id, status) VALUES (?, ?, ?, '1')`,
      [spec.brand_name, spec.brand_url, cat.id]
    );
    brandRow = { id: res.insertId, brand_name: spec.brand_name, brand_url: spec.brand_url };
    bump("brand-created");
    console.log(`  brand-created ${spec.brand_name} (id ${res.insertId}) -> ${cat.category_name}`);
  }

  const rb = await upsert(
    db, "page_master_tb",
    ["city_id", "category_id", "brand_id"], [city.id, cat.id, brandRow.id],
    brandPage(brandRow, copy, city)
  );
  bump(rb);
  console.log(`  ${rb.padEnd(13)} /near-me/${spec.brand_url}/${spec.category_url}   (near-me only)`);
}

console.log("\n" + Object.entries(tally).map(([k, v]) => `${k}: ${v}`).join("  |  "));
if (missingCopy.length) {
  console.warn(`\nNo copy in near-me-copy.mjs for: ${missingCopy.join(", ")}`);
}
if (!COMMIT) console.log("\nDry run only. Re-run with --commit to write.");

await db.end();
