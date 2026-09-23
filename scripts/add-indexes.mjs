// scripts/add-indexes.mjs
//
// The four catalogue tables shipped with only a PRIMARY key, so every live
// lookup (page_master_tb has ~87k rows) was a full table scan on a route that
// runs `force-dynamic`, i.e. on every single request.
//
//   node scripts/add-indexes.mjs            # show what is missing
//   node scripts/add-indexes.mjs --commit   # create the missing indexes
//
// Adding an index copies no data and is reversible with DROP INDEX. Re-running
// is safe: an index that already exists is skipped.

import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMMIT = process.argv.includes("--commit");

// Each entry names the query it exists for, so a future reader can tell whether
// it is still earning its keep.
const INDEXES = [
  // getBrandPageData: the page lookup, and the "Popular Brands" EXISTS probe.
  ["page_master_tb", "idx_pm_city_cat", "(city_id, category_id)"],
  // getBrandPageData: related_cities joins page_master_tb by category, and
  // related_categories by city; both then join brand_tb on brand_id.
  ["page_master_tb", "idx_pm_cat_brand", "(category_id, brand_id)"],
  ["page_master_tb", "idx_pm_brand", "(brand_id)"],
  // getCityCategoryPageData: the page row for city + category.
  ["master_tb_withoutbrand", "idx_nb_city_cat", "(city_id, category_id)"],
  // Slug resolution on every route.
  ["city_tb", "idx_city_url", "(city_url)"],
  ["brand_tb", "idx_brand_url", "(brand_url)"],
  ["category_tb", "idx_category_url", "(category_url)"],
  // "Popular Cities Near Me" filters cities by state.
  ["city_tb", "idx_city_state", "(state)"],
  // The brand pickers and "Popular Brands" filter brands by category.
  ["brand_tb", "idx_brand_category", "(category_id)"],
];

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
});

console.log(COMMIT ? "mode: COMMIT\n" : "mode: DRY RUN (no writes)\n");

let created = 0;
let skipped = 0;

for (const [table, name, cols] of INDEXES) {
  const [rows] = await db.query(
    "SELECT 1 FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ? LIMIT 1",
    [process.env.DB_NAME, table, name]
  );
  if (rows.length) {
    console.log(`  exists   ${table}.${name}`);
    skipped++;
    continue;
  }
  if (!COMMIT) {
    console.log(`  would-add ${table}.${name} ${cols}`);
    created++;
    continue;
  }
  const t0 = Date.now();
  await db.query(`ALTER TABLE \`${table}\` ADD INDEX \`${name}\` ${cols}`);
  console.log(`  added    ${table}.${name} ${cols}  [${Date.now() - t0}ms]`);
  created++;
}

console.log(`\n${created} ${COMMIT ? "created" : "to create"}, ${skipped} already present`);
if (!COMMIT) console.log("\nDry run only. Re-run with --commit to apply.");

await db.end();
