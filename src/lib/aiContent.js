// lib/aiContent.js
//
// Core of the AI content generation feature.
//
//  1. URL  →  slug            (normalizeUrl)
//  2. slug →  page context    (resolveSlugContext)  — the SAME lookup the live
//     routes do: /{city}, /{category}, /{city}/{cat} → master_tb_withoutbrand,
//     /{city}/{brand}/{cat} → page_master_tb. Meta title / description /
//     keywords / existing copy come straight from those rows, so nothing is
//     crawled over HTTP.
//  3. context → OpenAI        (generateContentHtml)
//  4. html → ai_content       (saveGeneratedContent) — never overwrites an
//     existing contentN; always writes the next free slot.
//
// The live content tables (city_tb, category_tb, master_tb_withoutbrand,
// page_master_tb) are READ-ONLY here, by design: nothing in this feature ever
// writes generated copy back onto a live page. Whatever is already on the site
// stays exactly as it is; an admin copies content across by hand.
//
// Every db call uses db.query() (pool acquire/release per statement) —
// never hold a connection across awaits here (see lib/db.js / cityData.js).

import db from "@/lib/db";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.mrserviceexpert.com"
).replace(/\/+$/, "");

// Hard cap on how many content columns we will ever add to ai_content.
// Versions are "unlimited" for practical purposes; this is only a backstop
// against a runaway loop adding thousands of columns.
export const MAX_VERSIONS = Math.max(
  3,
  Number(process.env.AI_CONTENT_MAX_VERSIONS || 50)
);

// The admin UI accepts up to 500 URLs and feeds them to the API in small
// chunks, so a single HTTP request never runs long enough to time out.
export const MAX_BULK_URLS = 500;
export const MAX_URLS_PER_REQUEST = 10;

const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const norm = (v = "") => v.toString().toLowerCase().trim();

/* ─────────────────────────── URL → { url, slug } ─────────────────────────── */

/**
 * Accepts a full URL ("https://site.com/delhi/ro-water-purifier"), a path
 * ("/delhi/ro-water-purifier") or a bare slug ("delhi/ro-water-purifier").
 * Query strings and hashes are dropped. Returns null for junk input.
 */
export function normalizeUrl(raw) {
  let s = String(raw ?? "").trim();
  if (!s) return null;

  s = s.split("#")[0].split("?")[0].trim();
  if (!s) return null;

  const wasAbsolute = /^https?:\/\//i.test(s);
  if (!wasAbsolute) s = `${SITE_URL}/${s.replace(/^\/+/, "")}`;

  let u;
  try {
    u = new URL(s);
  } catch {
    return null;
  }

  let slug;
  try {
    slug = decodeURIComponent(u.pathname);
  } catch {
    slug = u.pathname;
  }
  slug = norm(slug).replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/");
  if (!slug) return null;
  if (slug.split("/").length > 3) return null; // no site route is deeper than 3
  // Site slugs are lowercase words joined by hyphens — reject anything with
  // spaces or punctuation so pasted prose can't masquerade as a URL.
  if (!/^[a-z0-9]+(?:[-.][a-z0-9]+)*(?:\/[a-z0-9]+(?:[-.][a-z0-9]+)*)*$/.test(slug)) {
    return null;
  }

  // Keep the origin the admin actually pasted; dedupe still happens on slug.
  const origin = wasAbsolute ? u.origin : SITE_URL;
  return { url: `${origin}/${slug}`, slug };
}

/* ───────────────────────── slug → page context ───────────────────────────── */

const cityBySlug = async (slug) => {
  const [rows] = await db.query(
    `SELECT id, city_name, city_url, state, city_content,
            meta_title, meta_keywords, meta_description
       FROM city_tb WHERE LOWER(city_url) = ? LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
};

const categoryBySlug = async (slug) => {
  const [rows] = await db.query(
    `SELECT id, category_name, category_url, category_content,
            meta_title, meta_keywords, meta_description
       FROM category_tb WHERE LOWER(category_url) = ? LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
};

/**
 * Resolve a slug to everything the prompt needs.
 *
 * Returns { ok: false, reason } when the slug matches no live page, so the
 * caller can report it per-URL instead of failing the whole batch.
 */
export async function resolveSlugContext(slug) {
  const parts = norm(slug).split("/").filter(Boolean);

  /* /{city} or /{category} */
  if (parts.length === 1) {
    const city = await cityBySlug(parts[0]);
    if (city) {
      return {
        ok: true,
        type: "city",
        cityName: city.city_name,
        state: city.state,
        metaTitle: city.meta_title,
        metaDescription: city.meta_description,
        metaKeywords: city.meta_keywords,
        pageTitle: null,
        existingHtml: city.city_content,
      };
    }
    const cat = await categoryBySlug(parts[0]);
    if (cat) {
      return {
        ok: true,
        type: "category",
        categoryName: cat.category_name,
        metaTitle: cat.meta_title,
        metaDescription: cat.meta_description,
        metaKeywords: cat.meta_keywords,
        pageTitle: null,
        existingHtml: cat.category_content,
      };
    }
    return { ok: false, reason: "No city or category matches this slug" };
  }

  /* /{city}/{category} → master_tb_withoutbrand */
  if (parts.length === 2) {
    const [city, cat] = await Promise.all([
      cityBySlug(parts[0]),
      categoryBySlug(parts[1]),
    ]);
    if (!city) return { ok: false, reason: `Unknown city "${parts[0]}"` };
    if (!cat) return { ok: false, reason: `Unknown category "${parts[1]}"` };

    const [[page]] = await db.query(
      `SELECT id, page_title, page_content, meta_title, meta_keywords, meta_description
         FROM master_tb_withoutbrand
        WHERE city_id = ? AND category_id = ?
        ORDER BY id ASC LIMIT 1`,
      [city.id, cat.id]
    );

    return {
      ok: true,
      type: "city_category",
      cityName: city.city_name,
      state: city.state,
      categoryName: cat.category_name,
      pageTitle: page?.page_title || null,
      metaTitle: page?.meta_title || cat.meta_title,
      metaDescription: page?.meta_description || cat.meta_description,
      metaKeywords: page?.meta_keywords || cat.meta_keywords,
      existingHtml: page?.page_content || cat.category_content,
    };
  }

  /* /{city}/{brand}/{category} → page_master_tb */
  if (parts.length === 3) {
    const [citySlug, brandSlug, catSlug] = parts;
    const [city, cat] = await Promise.all([
      cityBySlug(citySlug),
      categoryBySlug(catSlug),
    ]);
    if (!city) return { ok: false, reason: `Unknown city "${citySlug}"` };
    if (!cat) return { ok: false, reason: `Unknown category "${catSlug}"` };

    // A brand_url can exist once per category — prefer this category's row.
    const [[brand]] = await db.query(
      `SELECT id, brand_name, brand_url, category_id
         FROM brand_tb
        WHERE LOWER(brand_url) = ?
        ORDER BY (category_id = ?) DESC, id ASC
        LIMIT 1`,
      [brandSlug, cat.id]
    );
    if (!brand) return { ok: false, reason: `Unknown brand "${brandSlug}"` };

    const [[page]] = await db.query(
      `SELECT pm.id, pm.page_title, pm.page_content, pm.meta_title,
              pm.meta_keywords, pm.meta_description
         FROM page_master_tb pm
         JOIN brand_tb b ON b.id = pm.brand_id
        WHERE pm.city_id = ? AND pm.category_id = ? AND LOWER(b.brand_url) = ?
        ORDER BY pm.id ASC LIMIT 1`,
      [city.id, cat.id, brandSlug]
    );

    return {
      ok: true,
      type: "city_brand_category",
      cityName: city.city_name,
      state: city.state,
      brandName: brand.brand_name,
      categoryName: cat.category_name,
      pageTitle: page?.page_title || null,
      metaTitle: page?.meta_title || cat.meta_title,
      metaDescription: page?.meta_description || cat.meta_description,
      metaKeywords: page?.meta_keywords || cat.meta_keywords,
      existingHtml: page?.page_content || cat.category_content,
    };
  }

  return { ok: false, reason: "Unsupported URL shape" };
}

/* ─────────────────────────── HTML helpers ────────────────────────────────── */

/** Pull heading texts out of stored HTML so the prompt can avoid repeating them. */
export function extractHeadings(html = "", limit = 12) {
  const out = [];
  const re = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let m;
  while ((m = re.exec(html || "")) && out.length < limit) {
    const text = stripTags(m[2]);
    if (text) out.push(text);
  }
  return out;
}

export function stripTags(html = "") {
  return String(html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export const wordCount = (html = "") =>
  stripTags(html).split(/\s+/).filter(Boolean).length;

/** Model output → safe page HTML (no fences, no document wrapper, no h1). */
function cleanModelHtml(raw = "") {
  let html = String(raw || "").trim();

  // ```html … ``` fences
  html = html.replace(/^```[a-z]*\s*/i, "").replace(/```\s*$/i, "").trim();

  // Full-document wrappers, if the model ignored the instruction.
  html = html
    .replace(/<!doctype[^>]*>/gi, "")
    .replace(/<\/?(html|head|body)[^>]*>/gi, "")
    .replace(/<meta[^>]*>/gi, "")
    .replace(/<title[\s\S]*?<\/title>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");

  // The live page already renders an <h1>; demote any the model produced.
  html = html.replace(/<h1([^>]*)>/gi, "<h2$1>").replace(/<\/h1>/gi, "</h2>");

  return html.trim();
}

/* ──────────────────────────── OpenAI call ────────────────────────────────── */

const SYSTEM_PROMPT = `You are a senior SEO content writer for "Mr. Service Expert", an Indian home-appliance repair and home-services brand.
You write original, factual, human-sounding landing-page copy in clear Indian English.
You output RAW HTML ONLY — no markdown, no code fences, no commentary before or after.`;

function buildUserPrompt(ctx, { url, version, avoidHeadings }) {
  const lines = [];
  lines.push(`Write the body content for this landing page.`);
  lines.push("");
  lines.push(`Page URL: ${url}`);
  if (ctx.cityName) lines.push(`City: ${ctx.cityName}${ctx.state ? `, ${ctx.state}` : ""}`);
  if (ctx.categoryName) lines.push(`Service / category: ${ctx.categoryName}`);
  if (ctx.brandName) lines.push(`Brand: ${ctx.brandName}`);
  lines.push("");
  lines.push(
    `The City / Service / Brand above come from the URL itself and are AUTHORITATIVE. Some pages carry stale meta text about a different service — if anything below contradicts them, ignore it and write about the service above.`
  );
  if (ctx.pageTitle) lines.push(`Page title: ${ctx.pageTitle}`);
  if (ctx.metaTitle) lines.push(`Meta title: ${ctx.metaTitle}`);
  if (ctx.metaDescription) lines.push(`Meta description: ${ctx.metaDescription}`);
  if (ctx.metaKeywords) lines.push(`Meta keywords: ${ctx.metaKeywords}`);

  const headings = extractHeadings(ctx.existingHtml);
  if (headings.length) {
    lines.push("");
    lines.push(`Headings already on the page (for topic reference only):`);
    headings.forEach((h) => lines.push(`- ${h}`));
  }

  const excerpt = stripTags(ctx.existingHtml).slice(0, 1200);
  if (excerpt) {
    lines.push("");
    lines.push(`Existing copy (reference only — DO NOT copy or lightly reword it):`);
    lines.push(`"""${excerpt}"""`);
  }

  if (version > 1) {
    lines.push("");
    lines.push(
      `This is version ${version} of the content for this URL. It must read as a completely fresh take: different structure, different section order, different sentences.`
    );
    if (avoidHeadings?.length) {
      lines.push(`Do NOT reuse these headings from earlier versions:`);
      avoidHeadings.slice(0, 20).forEach((h) => lines.push(`- ${h}`));
    }
  }

  lines.push("");
  lines.push(`Requirements:`);
  // Asking for 500-700 lands the actual output in the 400-600 range.
  lines.push(`- 500 to 700 words of NEW copy.`);
  lines.push(
    `- Raw HTML only, using just these tags: <p>, <h2>, <h3>, <ul>, <ol>, <li>, <strong>, <em>. No <h1>, no <html>/<head>/<body>, no attributes, no inline styles, no classes, no images, no links.`
  );
  lines.push(`- Open with one <p> introduction that naturally uses the city and service name.`);
  lines.push(
    `- Then 4 to 6 <h2> sections, e.g. common problems we fix, our service process, why customers choose us, what the service covers, service coverage in the city.`
  );
  lines.push(`- Use at least one <ul> list.`);
  lines.push(`- Work the meta keywords in naturally; never stuff them.`);
  lines.push(
    `- Mention the city name 3 to 6 times across the copy, and the service name naturally throughout.`
  );
  lines.push(
    `- Never invent prices, discounts, phone numbers, addresses, warranty periods, ratings, awards, certifications or customer counts.`
  );
  lines.push(`- Close with a short <p> call to action to book the service (no phone number).`);

  return lines.join("\n");
}

/** One chat completion. Retries once on 429 / 5xx. */
async function callOpenAI(messages) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set in the environment");

  let lastErr;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 90_000);
    try {
      const res = await fetch(OPENAI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages,
          temperature: 0.8,
          max_tokens: 1800,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        const err = new Error(
          `OpenAI ${res.status}: ${text.slice(0, 300) || res.statusText}`
        );
        if ((res.status === 429 || res.status >= 500) && attempt === 1) {
          lastErr = err;
          await new Promise((r) => setTimeout(r, 2000));
          continue;
        }
        throw err;
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      if (!content) throw new Error("OpenAI returned an empty response");
      return content;
    } catch (e) {
      if (e.name === "AbortError") throw new Error("OpenAI request timed out (90s)");
      if (attempt === 2) throw e;
      lastErr = e;
      await new Promise((r) => setTimeout(r, 2000));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr || new Error("OpenAI request failed");
}

/** context + url + version → cleaned HTML string. */
export async function generateContentHtml(ctx, { url, version = 1, avoidHeadings = [] }) {
  const raw = await callOpenAI([
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserPrompt(ctx, { url, version, avoidHeadings }) },
  ]);
  const html = cleanModelHtml(raw);
  if (!html || wordCount(html) < 80) {
    throw new Error("Model returned unusably short content");
  }
  return html;
}

/* ─────────────────────── ai_content table plumbing ───────────────────────── */

let _colCache = null;

export async function ensureAiContentTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS ai_content (
      id          INT AUTO_INCREMENT PRIMARY KEY,
      url         VARCHAR(500) NOT NULL,
      slug        VARCHAR(255) NOT NULL,
      \`date\`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP,
      content1    LONGTEXT NULL,
      content2    LONGTEXT NULL,
      content3    LONGTEXT NULL,
      UNIQUE KEY uq_ai_content_slug (slug),
      KEY idx_ai_content_date (\`date\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

/** Column names of ai_content, cached per process. */
export async function getAiColumns(force = false) {
  if (_colCache && !force) return _colCache;
  await ensureAiContentTable();
  const [cols] = await db.query(`SHOW COLUMNS FROM ai_content`);
  _colCache = new Set(cols.map((c) => c.Field));
  return _colCache;
}

/** ["content1", "content2", …] in numeric order. */
export function versionColumns(cols) {
  return [...cols]
    .filter((c) => /^content\d+$/.test(c))
    .sort((a, b) => Number(a.slice(7)) - Number(b.slice(7)));
}

/** Add contentN if it doesn't exist yet (this is the "unlimited versions" bit). */
async function ensureVersionColumn(n) {
  if (n > MAX_VERSIONS) {
    throw new Error(
      `This URL already has ${MAX_VERSIONS} versions (AI_CONTENT_MAX_VERSIONS). Delete one before generating again.`
    );
  }
  const cols = await getAiColumns();
  const name = `content${n}`;
  if (cols.has(name)) return name;

  // Two requests can race here; IF NOT EXISTS isn't available for ADD COLUMN
  // on MySQL 5.7/8.0, so swallow the duplicate-column error instead.
  try {
    await db.query(`ALTER TABLE ai_content ADD COLUMN \`${name}\` LONGTEXT NULL`);
  } catch (e) {
    if (e.code !== "ER_DUP_FIELDNAME") throw e;
  }
  await getAiColumns(true);
  return name;
}

const isFilled = (v) => typeof v === "string" && v.trim() !== "";

/** The row for a slug, or null. */
export async function getAiRowBySlug(slug) {
  await getAiColumns();
  const [rows] = await db.query(`SELECT * FROM ai_content WHERE slug = ? LIMIT 1`, [slug]);
  return rows[0] || null;
}

/**
 * PUBLIC read used by the live pages.
 *
 * Returns the newest kept version of the generated copy for a slug/URL, or
 * null when that URL has no ai_content row (or the row has every version
 * deleted) — callers render nothing in that case, so /delhi/ro-water-purifier
 * can show AI copy while /mumbai/ro-water-purifier shows none.
 *
 * Deliberately does NOT go through getAiColumns(): a page render must not run
 * CREATE TABLE / SHOW COLUMNS. The contentN columns are read off the row that
 * came back, and any DB error (missing table on a fresh install, connection
 * blip) resolves to null instead of breaking the page.
 */
export async function getPublicAiContent(slugOrUrl) {
  const parsed = normalizeUrl(slugOrUrl);
  if (!parsed) return null;

  try {
    const [rows] = await db.query(
      `SELECT * FROM ai_content WHERE slug = ? LIMIT 1`,
      [parsed.slug]
    );
    const row = rows[0];
    if (!row) return null;

    const latest = Object.keys(row)
      .filter((k) => /^content\d+$/.test(k) && isFilled(row[k]))
      .sort((a, b) => Number(b.slice(7)) - Number(a.slice(7)))[0];
    if (!latest) return null;

    return {
      version: Number(latest.slice(7)),
      html: row[latest],
      updatedAt: row.updated_at || row.date || null,
    };
  } catch (e) {
    console.error("getPublicAiContent failed:", e?.message || e);
    return null;
  }
}

/** Highest used version number on a row (0 when the row has no content yet). */
export function highestVersion(row, cols) {
  if (!row) return 0;
  let max = 0;
  for (const c of versionColumns(cols)) {
    if (isFilled(row[c])) max = Math.max(max, Number(c.slice(7)));
  }
  return max;
}

/** Every filled version of a row, as [{ version, column, html, words }]. */
export function rowVersions(row, cols) {
  if (!row) return [];
  return versionColumns(cols)
    .filter((c) => isFilled(row[c]))
    .map((c) => ({
      version: Number(c.slice(7)),
      column: c,
      html: row[c],
      words: wordCount(row[c]),
    }));
}

/**
 * Write freshly generated HTML into the next FREE slot for this URL.
 * Existing content columns are never touched.
 */
export async function saveGeneratedContent({ url, slug, html }) {
  const cols = await getAiColumns();
  const existing = await getAiRowBySlug(slug);

  if (!existing) {
    const [res] = await db.query(
      `INSERT INTO ai_content (url, slug, \`date\`, content1) VALUES (?, ?, NOW(), ?)`,
      [url, slug, html]
    );
    return { id: res.insertId, version: 1, created: true };
  }

  const next = highestVersion(existing, cols) + 1;
  const column = await ensureVersionColumn(next);

  await db.query(
    `UPDATE ai_content SET \`${column}\` = ?, url = ? WHERE id = ?`,
    [html, url, existing.id]
  );
  return { id: existing.id, version: next, created: false };
}

/**
 * Full pipeline for one URL: normalize → resolve → generate → save.
 * Always resolves (never throws) so one bad URL can't kill a bulk run.
 */
export async function generateForUrl(rawUrl) {
  const parsed = normalizeUrl(rawUrl);
  if (!parsed) {
    return { input: rawUrl, ok: false, reason: "Invalid URL" };
  }

  try {
    const ctx = await resolveSlugContext(parsed.slug);
    if (!ctx.ok) {
      return { input: rawUrl, ...parsed, ok: false, reason: ctx.reason };
    }

    const cols = await getAiColumns();
    const existing = await getAiRowBySlug(parsed.slug);
    const nextVersion = highestVersion(existing, cols) + 1;
    const avoidHeadings = rowVersions(existing, cols).flatMap((v) =>
      extractHeadings(v.html, 6)
    );

    const html = await generateContentHtml(ctx, {
      url: parsed.url,
      version: nextVersion,
      avoidHeadings,
    });

    const saved = await saveGeneratedContent({ ...parsed, html });

    return {
      input: rawUrl,
      ...parsed,
      ok: true,
      id: saved.id,
      version: saved.version,
      words: wordCount(html),
      pageType: ctx.type,
    };
  } catch (e) {
    return { input: rawUrl, ...parsed, ok: false, reason: e.message };
  }
}
