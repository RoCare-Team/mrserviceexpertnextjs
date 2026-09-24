// scripts/create-other-city-links-table.mjs
//
// Creates other_city_links_tb, which backs the "Other Cities" dropdown on the
// homepage. Unlike POPULAR_CITIES (a hard-coded list in src/lib/popularCities.js)
// these links are editable from the admin panel, and the target can be any
// path — a city, a city+category, or anything else worth linking.
//
//   node scripts/create-other-city-links-table.mjs            # show what it would do
//   node scripts/create-other-city-links-table.mjs --commit   # create it
//
// Safe to re-run: uses CREATE TABLE IF NOT EXISTS.

import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMMIT = process.argv.includes("--commit");

const DDL = `
CREATE TABLE IF NOT EXISTS other_city_links_tb (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(160)  NOT NULL,
  url         VARCHAR(500)  NOT NULL,
  sort_order  INT           NOT NULL DEFAULT 0,
  status      ENUM('1','0') NOT NULL DEFAULT '1',
  created_at  TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_status_sort (status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

function loadEnv() {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    if (!(k in process.env)) process.env[k] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
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

const [[exists]] = await db.query(
  `SELECT COUNT(*) n FROM information_schema.tables
    WHERE table_schema = ? AND table_name = 'other_city_links_tb'`,
  [process.env.DB_NAME]
);

if (exists.n) {
  const [[c]] = await db.query("SELECT COUNT(*) n FROM other_city_links_tb");
  console.log(`other_city_links_tb already exists (${c.n} rows) — nothing to do.`);
} else if (!COMMIT) {
  console.log("other_city_links_tb is missing. Re-run with --commit to create it.");
} else {
  await db.query(DDL);
  console.log("other_city_links_tb created.");
}

await db.end();
