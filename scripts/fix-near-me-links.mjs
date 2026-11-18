// scripts/fix-near-me-links.mjs
//
// Two broken near-me links sit in old page copy (both return 404):
//   /ro-water-purifier/ro-service-near-me  → /near-me/ro-water-purifier
//   /near-me/ac-service                    → /near-me/ac
// They are in category_tb.category_content (the fallback copy every page
// without its own row shows) and in master_tb_withoutbrand.page_content.
//
//   node scripts/fix-near-me-links.mjs            # dry run: counts only
//   node scripts/fix-near-me-links.mjs --commit   # back up rows, then replace
//   node scripts/fix-near-me-links.mjs --restore  # put the backed-up text back
//
// Only these exact URLs are replaced (with or without www). Every changed row's
// original text is saved first in near_me_link_fix_bak.

import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const COMMIT = process.argv.includes("--commit");
const RESTORE = process.argv.includes("--restore");

const FIXES = [
  ["https://www.mrserviceexpert.com/ro-water-purifier/ro-service-near-me", "https://www.mrserviceexpert.com/near-me/ro-water-purifier"],
  ["https://mrserviceexpert.com/ro-water-purifier/ro-service-near-me", "https://www.mrserviceexpert.com/near-me/ro-water-purifier"],
  ["https://www.mrserviceexpert.com/near-me/ac-service\"", "https://www.mrserviceexpert.com/near-me/ac\""],
  ["https://mrserviceexpert.com/near-me/ac-service\"", "https://www.mrserviceexpert.com/near-me/ac\""],
];
const TARGETS = [
  ["category_tb", "category_content"],
  ["master_tb_withoutbrand", "page_content"],
];

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
  if (RESTORE) {
    for (const [table, col] of TARGETS) {
      const [r] = await db.query(
        `UPDATE \`${table}\` t JOIN near_me_link_fix_bak b ON b.tbl = ? AND b.row_id = t.id SET t.\`${col}\` = b.content`,
        [table]
      );
      console.log(`${table}: restored ${r.affectedRows}`);
    }
  } else {
    await db.query(`CREATE TABLE IF NOT EXISTS near_me_link_fix_bak (
      tbl     VARCHAR(40) NOT NULL,
      row_id  INT         NOT NULL,
      content LONGTEXT    NULL,
      saved_at DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (tbl, row_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);

    const like = FIXES.map(() => "?? LIKE ?").join(" OR ");
    console.log(COMMIT ? "mode: COMMIT\n" : "mode: DRY RUN (no writes)\n");
    for (const [table, col] of TARGETS) {
      const params = FIXES.flatMap(([from]) => [col, `%${from}%`]);
      const [rows] = await db.query(`SELECT id FROM \`${table}\` WHERE ${like}`, params);
      console.log(`${table}: ${rows.length} row(s) ${COMMIT ? "fixed" : "to fix"}`);
      if (!COMMIT || !rows.length) continue;
      const ids = rows.map((r) => r.id);
      await db.beginTransaction();
      try {
        // INSERT IGNORE keeps the ORIGINAL text if the script is run twice.
        await db.query(
          `INSERT IGNORE INTO near_me_link_fix_bak (tbl, row_id, content) SELECT ?, id, \`${col}\` FROM \`${table}\` WHERE id IN (?)`,
          [table, ids]
        );
        let expr = `\`${col}\``;
        const vals = [];
        for (const [from, to] of FIXES) {
          expr = `REPLACE(${expr}, ?, ?)`;
          vals.push(from, to);
        }
        await db.query(`UPDATE \`${table}\` SET \`${col}\` = ${expr} WHERE id IN (?)`, [...vals, ids]);
        await db.commit();
      } catch (err) {
        await db.rollback();
        throw err;
      }
    }
  }
} finally {
  await db.end();
}
