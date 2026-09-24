// api/admin/brand_rollout
//
// Creates a brand together with the page rows that make it visible.
//
// Visibility on this site is NOT a flag — a brand appears on /{city}/{cat}
// only when a page_master_tb row exists for that exact city + category + brand
// (see the EXISTS gate in src/lib/cityCategoryPageData.js). So "where should
// this brand show?" is really "which page rows should exist?", and that is what
// this route writes:
//
//   scope "near_me" -> 1 row  (city_url = near-me)
//   scope "all"     -> 1 row per active city
//
// GET  ?type=categories          -> category dropdown
// GET  ?type=preview&scope=..    -> row counts, no writes
// GET  ?type=check_duplicate     -> live slug/name check
// POST                           -> create brand + pages
//
// Content comes from src/lib/pageContent.js, the same module the CLI seeder
// uses, so a brand added here is indistinguishable from a seeded one.

import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  CATEGORY_COPY,
  brandPage,
  faqColumns,
  NEAR_ME_SLUG,
} from "@/lib/pageContent";

export const runtime = "nodejs";

// page_master_tb has no UNIQUE key, so a double submit would silently create
// duplicate pages. Rows are written in chunks and every chunk re-checks what
// already exists, which makes the whole operation safe to re-run.
const CHUNK = 100;

const SCOPES = new Set(["near_me", "all"]);
const bad = (message, status = 400, extra = {}) =>
  NextResponse.json({ success: false, message, ...extra }, { status });

async function requireAdmin(request) {
  const session = await getSession(request);
  if (!session) return bad("Not authenticated.", 401);
  return null;
}

/** Cities a rollout targets. "all" means every city with a usable slug. */
async function targetCities(connection, scope) {
  if (scope === "near_me") {
    const [rows] = await connection.query(
      `SELECT id, city_name, city_url FROM city_tb WHERE LOWER(city_url) = ? LIMIT 1`,
      [NEAR_ME_SLUG]
    );
    return rows;
  }
  const [rows] = await connection.query(
    `SELECT id, city_name, city_url
       FROM city_tb
      WHERE city_url IS NOT NULL AND city_url <> ''
      ORDER BY city_name ASC`
  );
  return rows;
}

export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    connection = await db.getConnection();

    if (type === "categories") {
      const [rows] = await connection.query(
        `SELECT id, category_name, category_url FROM category_tb
          WHERE status = '1' ORDER BY category_name ASC`
      );
      // A category with no entry in CATEGORY_COPY has no wording to generate
      // from, so the UI greys it out instead of failing at submit time.
      return NextResponse.json({
        success: true,
        categories: rows.map((c) => ({ ...c, hasCopy: Boolean(CATEGORY_COPY[c.category_url]) })),
      });
    }

    if (type === "check_duplicate") {
      const field = searchParams.get("field");
      const value = (searchParams.get("value") || "").trim();
      const categoryId = searchParams.get("category_id");
      if (!["brand_name", "brand_url"].includes(field) || !value || !categoryId) {
        return NextResponse.json({ success: true, exists: false });
      }
      // A slug may legitimately repeat across categories ("godrej" is AC,
      // Washing Machine and Refrigerator), so duplicates are per category.
      const [rows] = await connection.query(
        `SELECT id FROM brand_tb WHERE ${field} = ? AND category_id = ? LIMIT 1`,
        [value, categoryId]
      );
      return NextResponse.json({ success: true, exists: rows.length > 0 });
    }

    if (type === "preview") {
      const scope = searchParams.get("scope");
      const categoryId = Number(searchParams.get("category_id"));
      const brandUrl = (searchParams.get("brand_url") || "").trim().toLowerCase();
      if (!SCOPES.has(scope)) return bad("Unknown scope.");
      if (!categoryId) return bad("Pick a category first.");

      const cities = await targetCities(connection, scope);
      if (!cities.length) {
        return bad(
          scope === "near_me"
            ? `No city row with city_url = '${NEAR_ME_SLUG}'. Create that city first.`
            : "No cities found."
        );
      }

      let existing = 0;
      if (brandUrl) {
        const [[row]] = await connection.query(
          `SELECT COUNT(DISTINCT pm.city_id) n
             FROM page_master_tb pm
             JOIN brand_tb b ON b.id = pm.brand_id
            WHERE pm.category_id = ? AND LOWER(b.brand_url) = ?`,
          [categoryId, brandUrl]
        );
        existing = row.n;
      }

      return NextResponse.json({
        success: true,
        cities: cities.length,
        existing,
        toCreate: Math.max(0, cities.length - existing),
        sampleUrls: cities.slice(0, 3).map((c) => `/${c.city_url}/${brandUrl || "{brand}"}/{category}`),
      });
    }

    return bad("Unknown request type.");
  } catch (error) {
    return bad(error.message, 500);
  } finally {
    if (connection) connection.release();
  }
}

export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let connection;
  try {
    const body = await request.json();
    const brandName = (body.brand_name || "").trim();
    const brandUrl = (body.brand_url || "").trim().toLowerCase();
    const categoryId = Number(body.category_id);
    const scope = body.scope;

    const errors = {};
    if (!brandName) errors.brand_name = "Brand name is required.";
    if (!brandUrl) errors.brand_url = "Brand URL is required.";
    else if (!/^[a-z0-9-]+$/.test(brandUrl))
      errors.brand_url = "Only lowercase letters, numbers and hyphens.";
    if (!categoryId) errors.category_id = "Category is required.";
    if (!SCOPES.has(scope)) errors.scope = "Pick where this brand should show.";
    if (Object.keys(errors).length)
      return bad("Validation failed.", 422, { errors });

    connection = await db.getConnection();

    const [[category]] = await connection.query(
      `SELECT id, category_name, category_url FROM category_tb WHERE id = ? LIMIT 1`,
      [categoryId]
    );
    if (!category) return bad("Category not found.", 404);

    const copy = CATEGORY_COPY[category.category_url];
    if (!copy)
      return bad(
        `No page wording exists for "${category.category_url}". Add it to src/lib/pageContent.js first.`,
        422
      );

    const cities = await targetCities(connection, scope);
    if (!cities.length)
      return bad(
        scope === "near_me"
          ? `No city row with city_url = '${NEAR_ME_SLUG}'.`
          : "No cities found.",
        422
      );

    // Reuse the brand row if this slug already exists in this category, so a
    // re-submit tops up missing pages instead of creating a second brand.
    let [[brand]] = await connection.query(
      `SELECT id, brand_name, brand_url FROM brand_tb
        WHERE LOWER(brand_url) = ? AND category_id = ? LIMIT 1`,
      [brandUrl, categoryId]
    );
    let brandCreated = false;
    if (!brand) {
      const [res] = await connection.query(
        `INSERT INTO brand_tb (brand_name, brand_url, category_id, status)
         VALUES (?, ?, ?, '1')`,
        [brandName, brandUrl, categoryId]
      );
      brand = { id: res.insertId, brand_name: brandName, brand_url: brandUrl };
      brandCreated = true;
    }

    // Which of the target cities already have a page for this brand+category?
    const [done] = await connection.query(
      `SELECT DISTINCT pm.city_id
         FROM page_master_tb pm
         JOIN brand_tb b ON b.id = pm.brand_id
        WHERE pm.category_id = ? AND LOWER(b.brand_url) = ?`,
      [categoryId, brandUrl]
    );
    const haveCity = new Set(done.map((r) => r.city_id));
    const pending = cities.filter((c) => !haveCity.has(c.id));

    const COLS = [
      "city_id", "category_id", "brand_id", "service_type_id",
      "page_title", "page_url", "page_content", "status",
      "meta_title", "meta_keywords", "meta_description",
      ...Array.from({ length: 5 }, (_, i) => [`faqquestion${i + 1}`, `faqanswer${i + 1}`]).flat(),
    ];

    let created = 0;
    for (let i = 0; i < pending.length; i += CHUNK) {
      const slice = pending.slice(i, i + CHUNK);
      const values = slice.map((cityRow) => {
        const page = brandPage(brand, copy, cityRow);
        const faq = faqColumns(page.faqs);
        return [
          cityRow.id, categoryId, brand.id, 1,
          page.page_title, "", page.page_content, "1",
          page.meta_title, page.meta_keywords, page.meta_description,
          ...COLS.slice(11).map((c) => faq[c] ?? null),
        ];
      });
      await connection.query(
        `INSERT INTO page_master_tb (${COLS.join(", ")}) VALUES ?`,
        [values]
      );
      created += slice.length;
    }

    return NextResponse.json({
      success: true,
      brand: { id: brand.id, brand_name: brand.brand_name, brand_url: brand.brand_url },
      brandCreated,
      scope,
      pagesCreated: created,
      pagesAlreadyThere: cities.length - pending.length,
      message: brandCreated
        ? `${brand.brand_name} created with ${created} page${created === 1 ? "" : "s"}.`
        : `${brand.brand_name} already existed — added ${created} missing page${created === 1 ? "" : "s"}.`,
      note:
        scope === "all"
          ? "Run `npm run sitemaps` to add the new URLs to the XML sitemaps."
          : "This brand will appear on /near-me pages only. Run `npm run sitemaps` to update the XML.",
    });
  } catch (error) {
    return bad(error.message, 500);
  } finally {
    if (connection) connection.release();
  }
}
