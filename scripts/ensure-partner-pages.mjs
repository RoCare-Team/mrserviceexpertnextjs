// scripts/ensure-partner-pages.mjs
//
// Creates the missing /{area}/{category} and /{area}/{brand}/{category} pages
// for approved, listed partners — the same thing that happens automatically
// when an admin approves a partner (src/lib/partnerPages.js). Use it once
// after the migration for partners approved before this feature existed.
//
//   node scripts/ensure-partner-pages.mjs                 # dry run, all partners
//   node scripts/ensure-partner-pages.mjs --commit
//   node scripts/ensure-partner-pages.mjs --partner=13 [--commit]
//
// Existing pages are never touched; only missing rows are inserted.

import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ensurePartnerPages, partnerPagesReady } from "../src/lib/partnerPages.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const COMMIT = args.includes("--commit");
const ONE = Number((args.find((a) => a.startsWith("--partner=")) || "").slice(10)) || null;

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

try {
  if (!(await partnerPagesReady(db))) {
    console.error("Run the migrations first (2026_11_16_012 adds partner_generated_pages).");
    process.exitCode = 1;
  } else {
    const [partners] = await db.query(
      `SELECT id, business_name FROM partners
        WHERE status = 'approved' AND is_listed = 1 AND mobile_verified_at IS NOT NULL AND deleted_at IS NULL
          ${ONE ? "AND id = ?" : ""}
        ORDER BY id`,
      ONE ? [ONE] : []
    );
    console.log(COMMIT ? "mode: COMMIT\n" : "mode: DRY RUN (no writes)\n");
    let total = 0;
    for (const p of partners) {
      const r = await ensurePartnerPages(db, p.id, { dryRun: !COMMIT });
      total += r.created.length;
      console.log(`partner ${p.id} ${p.business_name || ""}: ${r.created.length} ${COMMIT ? "created" : "to create"}, ${r.skipped} already exist${r.capped ? " (capped)" : ""}`);
      for (const u of r.created) console.log(`    ${u}`);
    }
    console.log(`\n${COMMIT ? "created" : "would create"} ${total} page(s) for ${partners.length} partner(s).`);
  }
} finally {
  await db.end();
}
