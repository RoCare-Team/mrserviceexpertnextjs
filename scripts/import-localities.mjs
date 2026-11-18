// scripts/import-localities.mjs
//
// Adds the famous localities of the top cities (scripts/data/localities.csv,
// columns city_url,locality_name) as city_tb rows under their city in
// city_parent_map with kind = 'locality'. No pages are created here — a
// locality's pages are created when an approved partner serves it
// (src/lib/partnerPages.js).
//
//   node scripts/import-localities.mjs                 # dry run, writes nothing
//   node scripts/import-localities.mjs --commit        # insert missing localities
//   node scripts/import-localities.mjs --remove        # dry run of the undo
//   node scripts/import-localities.mjs --remove --commit
//   node scripts/import-localities.mjs --file=path.csv
//
// Needs migration 2026_11_16_012 (city_parent_map.kind).
//
// Safety rules:
//   • slug = {locality}-{city}, e.g. dlf-phase-1-gurgaon. If ANY city_tb row
//     already uses that slug the locality is skipped and reported — an
//     existing page is never taken over.
//   • A city whose slug appears on more than one city_tb row (madhepura,
//     mira-bhayandar, vasai-virar) or that is itself a locality is skipped.
//   • Re-running is safe: localities already imported are left alone.
//   • --remove deletes only kind='locality' rows that nothing references
//     (no partner area / request / lead, no page row). The rest are listed.

import mysql from "mysql2/promise";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const COMMIT = args.includes("--commit");
const REMOVE = args.includes("--remove");
const FILE = (args.find((a) => a.startsWith("--file=")) || "").slice(7) || path.join(ROOT, "scripts", "data", "localities.csv");

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

const slugify = (s) =>
  String(s)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

loadEnv();
const db = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
});

try {
  const [kindCol] = await db.query("SHOW COLUMNS FROM city_parent_map LIKE 'kind'");
  if (!kindCol.length) {
    console.error("Run the migrations first (2026_11_16_012 adds city_parent_map.kind).");
    process.exitCode = 1;
  } else if (REMOVE) {
    await remove();
  } else {
    await importAll();
  }
} finally {
  await db.end();
}

async function importAll() {
  const lines = fs.readFileSync(FILE, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const byCity = new Map();
  for (const line of lines.slice(1)) {
    const i = line.indexOf(",");
    const cityUrl = line.slice(0, i).trim().toLowerCase();
    const name = line.slice(i + 1).trim().replace(/\s+/g, " ");
    if (!cityUrl || !name || name.length > 120) continue;
    if (!byCity.has(cityUrl)) byCity.set(cityUrl, []);
    byCity.get(cityUrl).push(name);
  }

  const [allSlugs] = await db.query("SELECT id, LOWER(city_url) AS url FROM city_tb");
  const slugOwner = new Map();
  const slugCount = new Map();
  for (const r of allSlugs) {
    slugCount.set(r.url, (slugCount.get(r.url) || 0) + 1);
    slugOwner.set(r.url, r.id);
  }
  const [maps] = await db.query("SELECT city_id, parent_city_id FROM city_parent_map");
  const parentOf = new Map(maps.map((m) => [m.city_id, m.parent_city_id]));

  const tally = { inserted: 0, already: 0, clash: 0 };
  const clashes = [];
  const skippedCities = [];
  console.log(COMMIT ? "mode: COMMIT\n" : "mode: DRY RUN (no writes)\n");

  for (const [cityUrl, names] of byCity) {
    const [hubs] = await db.query(
      "SELECT id, city_name, city_url, state FROM city_tb WHERE LOWER(city_url) = ? AND status = '1'",
      [cityUrl]
    );
    if (hubs.length !== 1) {
      skippedCities.push(`${cityUrl} (${hubs.length ? "slug on several rows" : "not found"})`);
      continue;
    }
    const hub = hubs[0];
    if (parentOf.has(hub.id)) {
      skippedCities.push(`${cityUrl} (is itself a locality)`);
      continue;
    }

    const rows = [];
    for (const name of names) {
      const slug = `${slugify(name)}-${cityUrl}`;
      if (!slugify(name) || slug.length > 250) continue;
      const owner = slugOwner.get(slug);
      if (owner) {
        if (parentOf.get(owner) === hub.id) tally.already++;
        else {
          tally.clash++;
          clashes.push(`${slug} (city_tb id ${owner}${slugCount.get(slug) > 1 ? ", several rows" : ""})`);
        }
        continue;
      }
      slugOwner.set(slug, -1); // reserve against duplicates inside the CSV
      rows.push({ name, slug });
    }

    if (rows.length && COMMIT) {
      await db.beginTransaction();
      try {
        for (const r of rows) {
          const [res] = await db.query(
            `INSERT INTO city_tb (city_name, city_url, city_content, state, status)
             VALUES (?, ?, '', ?, '1')`,
            [r.name, r.slug, hub.state]
          );
          await db.query(
            "INSERT INTO city_parent_map (city_id, parent_city_id, kind) VALUES (?, ?, 'locality')",
            [res.insertId, hub.id]
          );
        }
        await db.commit();
      } catch (err) {
        await db.rollback();
        throw err;
      }
    }
    tally.inserted += rows.length;
    console.log(`  ${String(rows.length).padStart(3)} ${COMMIT ? "added" : "to add"}  ${hub.city_name} (${cityUrl})`);
  }

  console.log(`\n${COMMIT ? "inserted" : "would insert"}: ${tally.inserted}, already there: ${tally.already}, slug clash (skipped): ${tally.clash}`);
  if (clashes.length) console.log("\nSlug already used by another city_tb row (left alone):\n  " + clashes.join("\n  "));
  if (skippedCities.length) console.log("\nCities skipped:\n  " + skippedCities.join("\n  "));
}

async function remove() {
  const refs = [
    ["partner_service_areas", "locality_id"],
    ["partner_service_areas", "city_id"],
    ["partner_location_requests", "mapped_locality_id"],
    ["partner_leads", "page_city_id"],
    ["partner_leads", "open_city_id"],
    ["master_tb_withoutbrand", "city_id"],
    ["page_master_tb", "city_id"],
    ["partners", "address_city_id"],
  ];
  const checks = [];
  for (const [t, c] of refs) {
    const [col] = await db.query(`SHOW COLUMNS FROM \`${t}\` LIKE ?`, [c]).catch(() => [[]]);
    if (col.length) checks.push(`NOT EXISTS (SELECT 1 FROM \`${t}\` x WHERE x.\`${c}\` = m.city_id)`);
  }
  const [free] = await db.query(
    `SELECT m.city_id FROM city_parent_map m WHERE m.kind = 'locality'${checks.length ? " AND " + checks.join(" AND ") : ""}`
  );
  const [[{ n }]] = await db.query("SELECT COUNT(*) AS n FROM city_parent_map WHERE kind = 'locality'");
  console.log(`${n} imported localities, ${free.length} unused (${COMMIT ? "deleting" : "would delete"}), ${n - free.length} in use (kept).`);
  if (!COMMIT || !free.length) return;
  const ids = free.map((r) => r.city_id);
  await db.beginTransaction();
  try {
    await db.query("DELETE FROM city_parent_map WHERE city_id IN (?)", [ids]);
    await db.query("DELETE FROM city_tb WHERE id IN (?)", [ids]);
    await db.commit();
  } catch (err) {
    await db.rollback();
    throw err;
  }
  console.log(`Deleted ${ids.length}.`);
}
