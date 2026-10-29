// Partner public-profile SEO.
//
// For every approved partner we keep, on the partners row:
//   seo_content      ~750-char overview written from name + shop + categories +
//                    brands + cities (shown on the profile, indexable)
//   meta_title / meta_description / meta_keywords   derived from that content
//   description      the editable "About" — seeded by AI when empty, and
//                    re-seeded only while about_ai = 1 (partner never edited it)
//
// Generation uses OpenAI when OPENAI_API_KEY is set, otherwise a deterministic
// template, so a profile is never left without indexable copy. All triggers
// are fire-and-forget (approval, change-request approval, service-area edits,
// first public view); seo_attempted_at stops two workers running at once.

import { createHash } from "node:crypto";
import db from "@/lib/db";
import { callOpenAI } from "@/lib/aiContent";
import { BUSINESS_TYPES } from "@/lib/partners/validation";

export const SEO_LIMITS = { content: 900, title: 70, description: 160, keywords: 400, about: 1500 };

/* ── work done (completed leads), rounded down to a multiple of 5 ───────── */

/** 53 → "50+", 7 → "5+", 4 → null (hidden until there is something to show). */
export function workDoneLabel(n) {
  const v = Math.floor(Number(n || 0) / 5) * 5;
  return v >= 5 ? `${v}+` : null;
}

export async function getWorkDoneCounts(partnerIds) {
  if (!partnerIds.length) return new Map();
  const [rows] = await db.query(
    "SELECT partner_id, COUNT(*) AS n FROM partner_leads WHERE partner_id IN (?) AND status = 'completed' GROUP BY partner_id",
    [partnerIds]
  );
  return new Map(rows.map((r) => [r.partner_id, Number(r.n)]));
}

/* ── input ──────────────────────────────────────────────────────────────── */

async function loadInput(partnerId) {
  const [[p]] = await db.query(
    `SELECT p.id, p.full_name, p.business_name, p.business_type, p.experience_years, p.operating_hours,
            p.description, p.about_ai, p.seo_source_hash, p.seo_content,
            p.address_locality, c.city_name AS address_city, s.name AS state_name
       FROM partners p
       LEFT JOIN city_tb c ON c.id = p.address_city_id
       LEFT JOIN states s ON s.id = p.address_state_id
      WHERE p.id = ? AND p.deleted_at IS NULL`,
    [partnerId]
  );
  if (!p) return null;

  const [[cats], [svcs], [brands], [areas]] = await Promise.all([
    db.query(
      `SELECT c.id, c.category_name AS name, c.category_url AS url
         FROM partner_categories pc JOIN category_tb c ON c.id = pc.category_id
        WHERE pc.partner_id = ? ORDER BY c.id`,
      [partnerId]
    ),
    db.query(
      `SELECT ps.category_id, t.name FROM partner_services ps
         JOIN partner_service_types t ON t.id = ps.service_type_id
        WHERE ps.partner_id = ? ORDER BY t.sort_order`,
      [partnerId]
    ),
    db.query(
      `SELECT pb.category_id, COALESCE(b.brand_name, pb.custom_name) AS name
         FROM partner_brands pb LEFT JOIN brand_tb b ON b.id = pb.brand_id
        WHERE pb.partner_id = ? AND (pb.brand_id IS NOT NULL OR pb.custom_status = 'approved')
        ORDER BY name`,
      [partnerId]
    ),
    db.query(
      `SELECT c.city_name, l.city_name AS locality, a.is_primary
         FROM partner_service_areas a
         JOIN city_tb c ON c.id = a.city_id
         LEFT JOIN city_tb l ON l.id = a.locality_id
        WHERE a.partner_id = ? ORDER BY a.is_primary DESC, c.city_name, l.city_name`,
      [partnerId]
    ),
  ]);

  const cities = [];
  for (const a of areas) {
    let g = cities.find((x) => x.name === a.city_name);
    if (!g) cities.push((g = { name: a.city_name, localities: [] }));
    if (a.locality) g.localities.push(a.locality);
  }

  return {
    id: p.id,
    person: p.full_name || "",
    shop: p.business_name || "",
    businessType: BUSINESS_TYPES[p.business_type] || "",
    isIndividual: p.business_type === "individual",
    experience: p.experience_years || 0,
    hours: p.operating_hours || "",
    locality: p.address_locality || "",
    city: p.address_city || cities[0]?.name || "",
    state: p.state_name || "",
    categories: cats.map((c) => ({
      name: c.name,
      services: svcs.filter((s) => s.category_id === c.id).map((s) => s.name),
      brands: brands.filter((b) => b.category_id === c.id).map((b) => b.name),
    })),
    cities,
    // current state, for deciding what to (re)write
    description: p.description || "",
    aboutIsAi: !!p.about_ai,
    hash: p.seo_source_hash,
    hasContent: !!p.seo_content,
  };
}

/** Anything here changing means the copy should be rewritten. */
export function inputHash(i) {
  const src = JSON.stringify({
    person: i.person,
    shop: i.shop,
    type: i.businessType,
    exp: i.experience,
    loc: [i.locality, i.city, i.state],
    cats: i.categories.map((c) => [c.name, c.services, c.brands]),
    cities: i.cities,
  });
  return createHash("sha1").update(src).digest("hex");
}

/* ── writers ────────────────────────────────────────────────────────────── */

const displayName = (i) => i.shop || i.person;
const joinList = (arr) => (arr.length <= 1 ? arr.join("") : `${arr.slice(0, -1).join(", ")} and ${arr[arr.length - 1]}`);
const clip = (s, max) => {
  s = String(s || "").replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 25)).trim()}…`;
};
const clipPara = (s, max) => {
  s = String(s || "").replace(/\r/g, "").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf(".\n"), cut.lastIndexOf("."));
  return end > max * 0.6 ? cut.slice(0, end + 1).trim() : `${cut.trim()}…`;
};

/** Deterministic copy used when there is no API key or the model fails. */
export function templateSeo(i) {
  const name = displayName(i);
  const where = joinList(i.cities.map((c) => c.name)) || i.city || "your city";
  const catNames = i.categories.map((c) => c.name);
  const cats = joinList(catNames) || "appliance";
  const allBrands = [...new Set(i.categories.flatMap((c) => c.brands))];
  const allServices = [...new Set(i.categories.flatMap((c) => c.services))];
  const localities = [...new Set(i.cities.flatMap((c) => c.localities))];
  const who = i.shop && i.person && i.shop !== i.person ? `${i.shop}, run by ${i.person},` : `${name}`;

  const p1 = `${who} is a Mr. Service Expert approved ${i.businessType ? i.businessType.toLowerCase() : "partner"} offering ${cats} services in ${where}.${
    i.experience ? ` With ${i.experience}+ years of hands-on experience, the team handles` : " The team handles"
  } ${allServices.length ? joinList(allServices.slice(0, 6)) : "installation, repair and maintenance"} for homes and small businesses.`;
  const p2 = allBrands.length
    ? `Brands serviced include ${allBrands.length > 10 ? `${allBrands.slice(0, 10).join(", ")} and more` : joinList(allBrands)}. Genuine spare parts, transparent pricing and doorstep visits are part of every job.`
    : `Doorstep visits, transparent pricing and genuine spare parts are part of every job.`;
  const p3 = `${name} serves ${localities.length ? `${joinList(localities.slice(0, 8))} and nearby areas of ${where}` : `all of ${where}`}.${
    i.hours ? ` Working hours: ${i.hours}.` : ""
  } Book online through Mr. Service Expert to get a confirmed technician visit.`;

  const seoContent = clipPara([p1, p2, p3].join("\n\n"), SEO_LIMITS.content);
  const firstCity = i.cities[0]?.name || i.city || "";
  // Drop the brand suffix before truncating the partner's own name.
  const titleCore = `${name} – ${catNames[0] || "Appliance"} Service${catNames.length > 1 ? "s" : ""} in ${firstCity || "India"}`;
  const title = titleCore.length + 21 <= SEO_LIMITS.title ? `${titleCore} | Mr. Service Expert` : clip(titleCore, SEO_LIMITS.title);
  const brandBit = allBrands.length
    ? ` ${allBrands.length > 3 ? `${allBrands.slice(0, 3).join(", ")} and more` : joinList(allBrands)}.`
    : "";
  const description = clip(
    `${name}: ${cats} service in ${where}.${brandBit}${i.experience ? ` ${i.experience}+ yrs experience.` : ""} Book a verified technician on Mr. Service Expert.`,
    SEO_LIMITS.description
  );
  const kw = new Set();
  for (const c of catNames) {
    kw.add(`${c} ${firstCity}`.trim().toLowerCase());
    kw.add(`${c} near me`.toLowerCase());
  }
  for (const b of allBrands.slice(0, 4)) for (const c of catNames.slice(0, 1)) kw.add(`${b} ${c} ${firstCity}`.trim().toLowerCase());
  for (const l of localities.slice(0, 3)) kw.add(`${catNames[0] || "appliance service"} ${l}`.toLowerCase());
  kw.add(name.toLowerCase());
  const keywords = clip([...kw].slice(0, 12).join(", "), SEO_LIMITS.keywords);

  const we = i.isIndividual ? "I" : "We";
  const our = i.isIndividual ? "my" : "our";
  const about = clipPara(
    `${we === "I" ? `I'm ${i.person || name}` : `We are ${name}`}, ${i.experience ? `with ${i.experience}+ years of experience ` : ""}providing ${cats} services in ${where}. ${we} handle ${
      allServices.length ? joinList(allServices.slice(0, 5)) : "installation, repair and maintenance"
    }${allBrands.length ? ` for ${allBrands.slice(0, 5).join(", ")} and other brands` : ""}. ${we} focus on quick doorstep visits, honest pricing and genuine parts, so ${our} customers get a lasting fix the first time.`,
    SEO_LIMITS.about
  );

  return { seoContent, title, description, keywords, about };
}

const SYSTEM = `You write SEO copy for public partner profiles on "Mr. Service Expert", an Indian home-appliance repair marketplace. Write natural Indian English for customers searching for a local technician. Never invent facts: no prices, ratings, certifications, phone numbers, guarantees or years that are not in the data. Do not use markdown. Return ONLY a JSON object.`;

function buildPrompt(i) {
  const lines = [
    `Partner name: ${i.person || "-"}`,
    `Shop / business name: ${i.shop || "(not provided — use the partner name)"}`,
    `Business type: ${i.businessType || "-"}`,
    i.experience ? `Experience: ${i.experience}+ years` : null,
    i.hours ? `Working hours: ${i.hours}` : null,
    `Based in: ${[i.locality, i.city, i.state].filter(Boolean).join(", ") || "-"}`,
    `Service areas: ${i.cities.map((c) => (c.localities.length ? `${c.name} (${c.localities.join(", ")})` : `${c.name} (entire city)`)).join("; ") || "-"}`,
    "Categories:",
    ...i.categories.map((c) => `- ${c.name}: services = ${c.services.join(", ") || "-"}; brands = ${c.brands.join(", ") || "-"}`),
    "",
    "Return JSON with exactly these keys:",
    `"seo_content": 700–800 characters of plain text in 2–3 short paragraphs separated by a blank line. Third person. Mention the shop/partner name, every category, the main brands and the cities/localities naturally. Written for search engines and customers.`,
    `"meta_title": at most 60 characters, pattern "<name> – <main category> in <city> | Mr. Service Expert".`,
    `"meta_description": at most 155 characters, mentions name, categories, city, a brand or two, ends with a call to book.`,
    `"meta_keywords": 8–12 comma-separated search phrases customers would type (category + city, brand + category + city, category + locality, "near me").`,
    `"about": 350–600 characters written as the partner (${i.isIndividual ? '"I"' : '"we"'}), friendly and specific, for an "About" section. Plain text, one or two paragraphs.`,
  ].filter((l) => l !== null);
  return lines.join("\n");
}

async function aiSeo(i) {
  const raw = await callOpenAI(
    [
      { role: "system", content: SYSTEM },
      { role: "user", content: buildPrompt(i) },
    ],
    1400,
    { temperature: 0.6, response_format: { type: "json_object" } }
  );
  let j;
  try {
    j = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    j = m ? JSON.parse(m[0]) : null;
  }
  if (!j || typeof j !== "object") throw new Error("Model did not return JSON");
  const out = {
    seoContent: clipPara(j.seo_content, SEO_LIMITS.content),
    title: clip(j.meta_title, SEO_LIMITS.title),
    description: clip(j.meta_description, SEO_LIMITS.description),
    keywords: clip(String(j.meta_keywords || "").replace(/\s*,\s*/g, ", "), SEO_LIMITS.keywords),
    about: clipPara(j.about, SEO_LIMITS.about),
  };
  if (out.seoContent.length < 400) throw new Error("Model returned unusably short content");
  // Fill any blank piece from the template rather than failing the whole run.
  const t = templateSeo(i);
  for (const k of Object.keys(out)) if (!out[k]) out[k] = t[k];
  return out;
}

/* ── orchestration ──────────────────────────────────────────────────────── */

/**
 * (Re)generate the SEO copy for one partner.
 *   force: false → only when missing or the inputs changed since last time
 *   about: "auto" (seed only while untouched/empty) | "always" | "never"
 * Returns what happened — never throws on model failure (falls back to template).
 */
export async function generatePartnerSeo(partnerId, { force = false, about = "auto" } = {}) {
  const i = await loadInput(partnerId);
  if (!i) return { ok: false, reason: "not_found" };
  if (!i.categories.length || !(i.shop || i.person)) return { ok: false, reason: "incomplete" };

  const hash = inputHash(i);
  const writeAbout = about === "always" || (about === "auto" && (!i.description || i.aboutIsAi));
  if (!force && i.hasContent && i.hash === hash && !(writeAbout && !i.description)) {
    return { ok: true, reason: "unchanged" };
  }

  let copy;
  let source = "ai";
  if (process.env.OPENAI_API_KEY) {
    try {
      copy = await aiSeo(i);
    } catch (err) {
      console.error(`[partner-seo] ${partnerId}: ${err.message}`);
    }
  }
  if (!copy) {
    copy = templateSeo(i);
    source = "template";
  }

  const sets = ["seo_content = ?", "meta_title = ?", "meta_description = ?", "meta_keywords = ?", "seo_source_hash = ?", "seo_generated_at = NOW()"];
  const vals = [copy.seoContent, copy.title, copy.description, copy.keywords, hash];
  if (writeAbout) {
    sets.push("description = ?", "about_ai = 1");
    vals.push(copy.about);
  }
  await db.query(`UPDATE partners SET ${sets.join(", ")} WHERE id = ?`, [...vals, partnerId]);
  return { ok: true, reason: "generated", source, aboutWritten: writeAbout };
}

/**
 * Fire-and-forget trigger. A row-level "attempted" stamp stops concurrent
 * runs (two admins, or a page view racing an approval).
 */
export function queuePartnerSeo(partnerId, opts = {}) {
  setTimeout(async () => {
    try {
      const [r] = await db.query(
        `UPDATE partners SET seo_attempted_at = NOW()
          WHERE id = ? AND (seo_attempted_at IS NULL OR seo_attempted_at < NOW() - INTERVAL 2 MINUTE)`,
        [partnerId]
      );
      if (!r.affectedRows) return;
      await generatePartnerSeo(partnerId, opts);
    } catch (err) {
      console.error(`[partner-seo] queue ${partnerId}: ${err.message}`);
    }
  }, 0);
}
