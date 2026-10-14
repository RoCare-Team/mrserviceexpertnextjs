// Applies scripts/migrations/*.sql in filename order, once each.
//
//   node scripts/run-migrations.mjs            → dry run: lists pending files
//   node scripts/run-migrations.mjs --commit   → applies the pending files
//
// Applied files are recorded in `schema_migrations_mse` (a new table — the
// existing `migrations` table belongs to the old PHP app and is left alone).
// Migrations here are additive only (CREATE TABLE IF NOT EXISTS / INSERT
// IGNORE), so re-running a file is harmless. Take a backup first anyway:
//   mysqldump -u <user> -p <db> > backup-$(date +%F).sql

import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIR = path.join(ROOT, "scripts", "migrations");
const COMMIT = process.argv.includes("--commit");

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
  multipleStatements: true,
});

try {
  await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations_mse (
    name        VARCHAR(190) NOT NULL PRIMARY KEY,
    applied_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

  const [done] = await db.query("SELECT name FROM schema_migrations_mse");
  const applied = new Set(done.map((r) => r.name));
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();
  const pending = files.filter((f) => !applied.has(f));

  if (!pending.length) {
    console.log("No pending migrations.");
  } else if (!COMMIT) {
    console.log("Pending migrations (re-run with --commit to apply):");
    pending.forEach((f) => console.log("  " + f));
  } else {
    for (const f of pending) {
      process.stdout.write(`Applying ${f} … `);
      await db.query(fs.readFileSync(path.join(DIR, f), "utf8"));
      await db.query("INSERT INTO schema_migrations_mse (name) VALUES (?)", [f]);
      console.log("done");
    }
  }
} finally {
  await db.end();
}
