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
import { CATEGORY_COPY, PHONE } from "./near-me-copy.mjs";

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

const li = (items) => items.map((t) => `<li>${t}</li>`).join("");

// Casing helpers. Acronyms in the catalogue ("AC", "RO", "LED TV") must survive
// both directions, so neither helper touches a short all-caps word.
const isAcronym = (w) => w.length <= 3 && w === w.toUpperCase();
// "air conditioner" -> "Air Conditioner", "LED TV" -> "LED TV"
const titleCase = (s) =>
  s.split(" ").map((w) => (isAcronym(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(" ");
// "AC Service" -> "AC service", "Washing Machine Repair" -> "washing machine repair"
const lowerCase = (s) =>
  s.split(" ").map((w) => (isAcronym(w) ? w : w.toLowerCase())).join(" ");
// meta_description is varchar(255) but Google truncates around 160, so cut at
// the last full word before 158 rather than letting the column do it mid-word.
const clip = (s, n = 158) =>
  s.length <= n ? s : s.slice(0, s.lastIndexOf(" ", n)).replace(/[,.]$/, "") + "...";

/* ───────────────────────── /near-me/{category} ───────────────────────── */

function categoryPage(cat, copy) {
  const { service, thing, tasks, problems, interval, from } = copy;

  const page_content = [
    `<h2><strong>${service} Near Me &ndash; Verified Technicians at Your Doorstep</strong></h2>`,
    `<p>Searching for "${lowerCase(service)} near me" usually means one thing: you want someone reliable at your door today, not a call centre that takes your number and never calls back. Mr Service Expert connects you with background verified ${thing} technicians working across India, with transparent pricing that starts at &#8377;${from} and a service warranty on every job.</p>`,
    `<p>You tell us the problem, we match you with a technician already working in your area, and you get a confirmed time slot instead of a vague "sometime today". Spare parts are genuine, charges are told to you before any work begins, and nothing is replaced without your approval.</p>`,

    `<h3>What Our ${service} Covers</h3>`,
    `<ul>${li(tasks)}</ul>`,

    `<h3>Common ${titleCase(thing)} Problems We Fix</h3>`,
    `<p>Most of the complaints we attend fall into a handful of familiar faults. If your ${thing} is showing any of these, a single visit is usually enough:</p>`,
    `<ul>${li(problems)}</ul>`,

    `<h3>Why Book ${service} With Mr Service Expert</h3>`,
    `<ul>`,
    `<li><strong>Verified technicians</strong> &ndash; every professional is background checked and trained on the brands they handle.</li>`,
    `<li><strong>Upfront pricing</strong> &ndash; you are told the charge before the work starts, so there is no bill shock at the end.</li>`,
    `<li><strong>Service warranty</strong> &ndash; if the same fault comes back within the warranty period, we return at no extra cost.</li>`,
    `<li><strong>Genuine spare parts</strong> &ndash; replacements are sourced properly and carry their own warranty.</li>`,
    `<li><strong>Same day slots</strong> &ndash; book before noon and in most areas a technician reaches you the same day.</li>`,
    `<li><strong>One number for everything</strong> &ndash; call ${PHONE} and we handle the rest.</li>`,
    `</ul>`,

    `<h3>How to Book ${service} Near You</h3>`,
    `<ol>`,
    `<li>Tell us your ${thing} problem on the booking form or by calling ${PHONE}.</li>`,
    `<li>Pick a time slot that suits you, including same day and weekend options.</li>`,
    `<li>A verified technician reaches you, inspects the ${thing} and shares the exact charge.</li>`,
    `<li>Work is done in front of you and you pay only after you are satisfied.</li>`,
    `</ol>`,

    `<p>Whether it is a one time repair or regular upkeep, booking ${lowerCase(service)} near you takes about a minute. Call <strong>${PHONE}</strong> or book online and get a confirmed slot right away.</p>`,
  ].join("\n");

  const faqs = [
    [
      `How do I find a trusted ${lowerCase(service)} near me?`,
      `Book through Mr Service Expert and you are matched with a background verified ${thing} technician already working in your area. You get a confirmed time slot, the charge is shared before any work begins, and the job carries a service warranty, so you are not relying on an unknown local number.`,
    ],
    [
      `What is included in ${lowerCase(service)}?`,
      `A standard visit covers ${tasks.slice(0, 3).map((t) => t.toLowerCase()).join(", ")} and more. The full list includes ${tasks.map((t) => t.toLowerCase()).join(", ")}. The technician inspects your ${thing} first and tells you exactly what is needed.`,
    ],
    [
      `What ${thing} problems can be fixed at home?`,
      `Most of them. We regularly fix issues like ${problems.slice(0, 3).map((p) => p.toLowerCase()).join(", ")} on the spot. If a fault needs workshop equipment, the technician tells you upfront instead of taking the unit away without explaining.`,
    ],
    [
      `How often should I book ${lowerCase(service)}?`,
      `We recommend ${interval} for normal usage. Servicing on schedule keeps the ${thing} running efficiently, keeps running costs down and catches small faults before they turn into an expensive replacement.`,
    ],
    [
      `How much does ${lowerCase(service)} cost?`,
      `${service} starts at &#8377;${from}. The final amount depends on the fault and on any spare parts required, and it is always confirmed with you before work begins. Call ${PHONE} for an estimate for your specific problem.`,
    ],
  ];

  return {
    page_title: `${service} Near Me @${PHONE}`,
    meta_title: `${service} Near Me | Book Verified Technicians Online`,
    meta_description: clip(
      `${service} near me starting at Rs ${from}. Verified technicians, upfront pricing, genuine parts and same day slots. Book online or call ${PHONE}.`
    ),
    meta_keywords: [
      `${lowerCase(service)} near me`,
      `${thing} repair near me`,
      `${thing} service near me`,
      `best ${lowerCase(service)} near me`,
      `${lowerCase(service)} at home`,
      `${lowerCase(service)} charges`,
    ].join(", ").slice(0, 255),
    page_content,
    faqs,
  };
}

/* ─────────────────── /near-me/{brand}/{category} ─────────────────── */

function brandPage(brand, cat, copy) {
  const { service, thing, tasks, problems, interval, from } = copy;
  const b = brand.brand_name;

  const page_content = [
    `<h2><strong>${b} ${service} Near Me</strong></h2>`,
    `<p>Looking for "${b.toLowerCase()} ${thing} service near me"? Mr Service Expert sends a technician who works on ${b} ${thing}s specifically, not a generalist seeing the model for the first time. Visits start at &#8377;${from}, the charge is confirmed before work begins, and every job carries a service warranty.</p>`,
    `<p>${b} units have their own quirks, error codes and part numbers. Our technicians carry the right tools and source genuine ${b} compatible spares, so a repair holds up instead of failing again a month later.</p>`,

    `<h3>${b} ${service} We Provide</h3>`,
    `<ul>${li(tasks)}</ul>`,

    `<h3>Common ${b} ${titleCase(thing)} Problems</h3>`,
    `<p>These are the ${b} complaints we attend most often, and most are resolved in a single visit:</p>`,
    `<ul>${li(problems)}</ul>`,

    `<h3>Why Choose Us for ${b} ${service}</h3>`,
    `<ul>`,
    `<li><strong>Brand trained technicians</strong> &ndash; professionals who regularly handle ${b} ${thing}s.</li>`,
    `<li><strong>Genuine spare parts</strong> &ndash; ${b} compatible parts with their own warranty.</li>`,
    `<li><strong>No hidden charges</strong> &ndash; the price is agreed before a single screw is opened.</li>`,
    `<li><strong>Service warranty</strong> &ndash; the same fault within the warranty period is attended free.</li>`,
    `<li><strong>Doorstep service</strong> &ndash; your ${thing} is repaired at home wherever possible.</li>`,
    `</ul>`,

    `<p>To book ${b} ${service} near you, call <strong>${PHONE}</strong> or use the booking form. Same day slots are available in most areas.</p>`,
  ].join("\n");

  const faqs = [
    [
      `How do I book ${b} ${lowerCase(service)} near me?`,
      `Call ${PHONE} or book on this page. Share your ${b} model and the problem, pick a slot, and a technician experienced with ${b} ${thing}s reaches your doorstep. The charge is confirmed before any work starts.`,
    ],
    [
      `What does ${b} ${lowerCase(service)} include?`,
      `It covers ${tasks.map((t) => t.toLowerCase()).join(", ")}. The technician inspects your ${b} ${thing}, explains what is actually needed and does only that.`,
    ],
    [
      `Are you an authorised ${b} service centre?`,
      `We are an independent multi brand service provider, not an authorised ${b} service centre. Our technicians are trained on ${b} ${thing}s and we use genuine compatible spares. If your unit is still under ${b} warranty, we will tell you so you can use the official channel first.`,
    ],
    [
      `Do you use genuine ${b} spare parts?`,
      `Yes. Any part replaced on your ${b} ${thing} is a genuine compatible spare and carries its own warranty. Nothing is replaced without showing you the faulty part and getting your approval.`,
    ],
    [
      `How much does ${b} ${lowerCase(service)} cost?`,
      `${b} ${lowerCase(service)} starts at &#8377;${from}. The final amount depends on the fault and on parts needed, and is always confirmed before work begins. Servicing ${interval} keeps the cost down over time.`,
    ],
  ];

  return {
    page_title: `${b} ${service} Near Me @${PHONE}`,
    meta_title: `${b} ${service} Near Me | ${b} ${titleCase(thing)} Repair at Home`,
    meta_description: clip(
      `${b} ${lowerCase(service)} near me from Rs ${from}. Brand trained technicians, genuine spares, upfront pricing and same day doorstep service. Call ${PHONE}.`
    ),
    meta_keywords: [
      `${b.toLowerCase()} ${lowerCase(service)} near me`,
      `${b.toLowerCase()} ${thing} repair near me`,
      `${b.toLowerCase()} service centre near me`,
      `${b.toLowerCase()} ${thing} service`,
      `${b.toLowerCase()} repair charges`,
    ].join(", ").slice(0, 255),
    page_content,
    faqs,
  };
}

/* ───────────────────────────── row writing ───────────────────────────── */

const faqCols = (faqs) => {
  const out = {};
  faqs.forEach(([q, a], i) => {
    out[`faqquestion${i + 1}`] = q;
    out[`faqanswer${i + 1}`] = a;
  });
  return out;
};

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
    ...faqCols(page.faqs),
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
  "SELECT id, city_name FROM city_tb WHERE LOWER(city_url) = ? LIMIT 1",
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
  const cp = categoryPage(cat, copy);
  console.log(`===== /near-me/${cat.category_url} =====`);
  console.log(JSON.stringify({ ...cp, faqs: cp.faqs.length }, null, 2));
  console.log(cp.page_content);
  const brand = brands.find((b) => b.category_id === cat.id);
  if (brand) {
    const bp = brandPage(brand, cat, copy);
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
    categoryPage(cat, copy),
    { robots: "index" }
  );
  bump(r);
  console.log(`  ${r.padEnd(13)} /near-me/${cat.category_url}`);

  for (const brand of brands.filter((b) => b.category_id === cat.id)) {
    const rb = await upsert(
      db, "page_master_tb",
      ["city_id", "category_id", "brand_id"], [city.id, cat.id, brand.id],
      brandPage(brand, cat, copy)
    );
    bump(rb);
    console.log(`  ${rb.padEnd(13)} /near-me/${brand.brand_url}/${cat.category_url}`);
  }
}

console.log("\n" + Object.entries(tally).map(([k, v]) => `${k}: ${v}`).join("  |  "));
if (missingCopy.length) {
  console.warn(`\nNo copy in near-me-copy.mjs for: ${missingCopy.join(", ")}`);
}
if (!COMMIT) console.log("\nDry run only. Re-run with --commit to write.");

await db.end();
