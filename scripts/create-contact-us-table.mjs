// scripts/create-contact-us-table.mjs
//
// Creates contact_us_tb, which stores submissions from the public /contact
// form. Admins read them (and mark them read / resolved) from
// /admin/contact_us.
//
//   node scripts/create-contact-us-table.mjs            # show what it would do
//   node scripts/create-contact-us-table.mjs --commit   # create it
//
// Safe to re-run: uses CREATE TABLE IF NOT EXISTS.

import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMMIT = process.argv.includes("--commit");

const DDL = `
CREATE TABLE IF NOT EXISTS contact_us_tb (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120)  NOT NULL,
  phone       VARCHAR(20)   NOT NULL,
  email       VARCHAR(160)  NOT NULL,
  subject     VARCHAR(160)  NULL,
  message     TEXT          NOT NULL,
  status      ENUM('new','read','resolved') NOT NULL DEFAULT 'new',
  admin_note  VARCHAR(500)  NULL,
  ip_address  VARCHAR(64)   NULL,
  user_agent  VARCHAR(300)  NULL,
  page_url    VARCHAR(500)  NULL,
  created_at  TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP     NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_status_created (status, created_at),
  KEY idx_created (created_at)
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
    WHERE table_schema = ? AND table_name = 'contact_us_tb'`,
  [process.env.DB_NAME]
);

if (exists.n) {
  const [[c]] = await db.query("SELECT COUNT(*) n FROM contact_us_tb");
  console.log(`contact_us_tb already exists (${c.n} rows) — nothing to do.`);
} else if (!COMMIT) {
  console.log("contact_us_tb is missing. Re-run with --commit to create it.");
} else {
  await db.query(DDL);
  console.log("contact_us_tb created.");
}

await db.end();
