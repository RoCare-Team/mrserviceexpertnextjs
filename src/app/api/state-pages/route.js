import db from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const BASE = "https://www.mrserviceexpert.com";

// /{city}/{category} pages (master_tb_withoutbrand) for one city or a whole
// state, grouped by category:  ?city=gurgaon  or  ?state=haryana
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const city = (searchParams.get("city") || "").trim();
  const state = (searchParams.get("state") || "").trim();

  if (!city && !state) {
    return NextResponse.json(
      { success: false, error: "Pass ?city=<city> or ?state=<state>." },
      { status: 400 }
    );
  }

  try {
    const where = city
      ? "(LOWER(ci.city_url) = ? OR LOWER(ci.city_name) = ?)"
      : "LOWER(ci.state) = ?";
    const params = city
      ? [city.toLowerCase(), city.toLowerCase()]
      : [state.toLowerCase()];

    const [rows] = await db.query(
      `SELECT DISTINCT ci.city_url, c.id AS category_id, c.category_url,
              m.meta_keywords
         FROM master_tb_withoutbrand m
         JOIN city_tb ci ON ci.id = m.city_id
         JOIN category_tb c ON c.id = m.category_id
        WHERE ${where}
          AND m.robots <> 'noindex'
          AND c.status = '1'
          AND ci.city_url IS NOT NULL AND ci.city_url <> ''
          AND c.category_url IS NOT NULL AND c.category_url <> ''
        ORDER BY c.id ASC, ci.city_url ASC`,
      params
    );

    const byCategory = new Map();
    const seen = new Set();
    for (const row of rows) {
      const url = `${BASE}/${row.city_url.trim().toLowerCase()}/${row.category_url.trim().toLowerCase()}`;
      if (seen.has(url)) continue;
      seen.add(url);

      if (!byCategory.has(row.category_id)) {
        byCategory.set(row.category_id, {
          category: row.category_url.trim().toLowerCase(),
          count: 0,
          urls: [],
        });
      }
      const entry = byCategory.get(row.category_id);
      entry.urls.push({ url, meta_keywords: row.meta_keywords || "" });
      entry.count++;
    }

    const categories = [...byCategory.values()];

    return NextResponse.json({
      success: true,
      scope: city ? `city:${city}` : `state:${state}`,
      category_count: categories.length,
      url_count: seen.size,
      categories,
    });
  } catch (error) {
    console.error("state-pages error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
