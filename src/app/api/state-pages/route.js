import { NextResponse } from "next/server";
import db from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BASE_URL = "https://www.mrserviceexpert.com";

// Every indexable page on the site is one of these three shapes:
//   /{city_url}                             → city landing page   (city_tb)
//   /{city_url}/{category_url}              → city + category     (master_tb_withoutbrand)
//   /{city_url}/{brand_url}/{category_url}  → city + brand + cat  (page_master_tb)
// This API returns the last two, bucketed by category_url, for one city or
// one whole state. City landing pages have no category, so they're returned
// separately under `city_pages`.

function json(body, status = 200) {
  return NextResponse.json(body, { status });
}

// "uttar-pradesh" / "Uttar Pradesh" / "UTTAR PRADESH" all mean the same state.
// city_tb.state is stored upper-case with spaces, and MySQL's default
// collation is case-insensitive, so normalising the separator is enough.
function normalizeState(value) {
  return value.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const city = searchParams.get("city")?.trim() || null;
    const stateParam = searchParams.get("state")?.trim() || null;

    // The scope clause is shared by all three queries below, so it's built
    // once and interpolated with its own params each time.
    let scope;
    let where;
    let params;

    if (city) {
      // Accept either the slug ("gurgaon") or the display name ("Gurgaon").
      where = "(LOWER(ct.city_url) = ? OR LOWER(ct.city_name) = ?)";
      params = [city.toLowerCase(), city.toLowerCase()];
      scope = `city:${city}`;
    } else if (stateParam) {
      where = "ct.state = ?";
      params = [normalizeState(stateParam)];
      scope = `state:${stateParam}`;
    } else {
      return json(
        { success: false, error: "Pass ?city=<city> or ?state=<state>." },
        400
      );
    }

    const [[cityRows], [brandRows], [catRows]] = await Promise.all([
      // City landing pages inside the scope.
      db.query(
        `SELECT ct.city_url, ct.city_name, ct.state, ct.meta_keywords
           FROM city_tb ct
          WHERE ct.status = '1' AND ${where}
          ORDER BY ct.city_name ASC`,
        params
      ),
      // /{city}/{brand}/{category}
      db.query(
        `SELECT ct.city_url, b.brand_url, c.category_url, pm.meta_keywords
           FROM page_master_tb pm
           JOIN city_tb ct     ON ct.id = pm.city_id
           JOIN category_tb c  ON c.id  = pm.category_id
           JOIN brand_tb b     ON b.id  = pm.brand_id
          WHERE pm.status = '1' AND ct.status = '1'
            AND ct.city_url <> '' AND b.brand_url <> '' AND c.category_url <> ''
            AND ${where}`,
        params
      ),
      // /{city}/{category}
      db.query(
        `SELECT ct.city_url, c.category_url, mw.meta_keywords
           FROM master_tb_withoutbrand mw
           JOIN city_tb ct     ON ct.id = mw.city_id
           JOIN category_tb c  ON c.id  = mw.category_id
          WHERE mw.status = '1' AND ct.status = '1'
            AND ct.city_url <> '' AND c.category_url <> ''
            AND ${where}`,
        params
      ),
    ]);

    if (!cityRows.length) {
      return json(
        { success: false, error: `No active city found for ${scope}.` },
        404
      );
    }

    // slug -> Map<url, meta_keywords>. The Map dedupes URLs that more than one
    // row can produce (e.g. two brand rows sharing a brand_url in the same
    // category), keeping the first non-empty keywords we saw.
    const grouped = new Map();
    const add = (slug, url, keywords) => {
      if (!grouped.has(slug)) grouped.set(slug, new Map());
      const bucket = grouped.get(slug);
      if (!bucket.get(url)) bucket.set(url, keywords || null);
    };

    for (const r of catRows) {
      const slug = String(r.category_url).toLowerCase();
      add(slug, `${BASE_URL}/${String(r.city_url).toLowerCase()}/${slug}`, r.meta_keywords);
    }
    for (const r of brandRows) {
      const slug = String(r.category_url).toLowerCase();
      const cityUrl = String(r.city_url).toLowerCase();
      const brandUrl = String(r.brand_url).toLowerCase();
      add(slug, `${BASE_URL}/${cityUrl}/${brandUrl}/${slug}`, r.meta_keywords);
    }

    const categories = [...grouped.keys()].sort().map((slug) => {
      const urls = [...grouped.get(slug).entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([url, meta_keywords]) => ({ url, meta_keywords }));
      return { category: slug, count: urls.length, urls };
    });

    const city_pages = cityRows.map((c) => ({
      url: `${BASE_URL}/${String(c.city_url).toLowerCase()}`,
      city: c.city_name,
      state: c.state,
      meta_keywords: c.meta_keywords ?? null,
    }));

    const url_count =
      city_pages.length + categories.reduce((n, c) => n + c.count, 0);

    return json({
      success: true,
      scope,
      city_count: city_pages.length,
      category_count: categories.length,
      url_count,
      city_pages,
      categories,
    });
  } catch (err) {
    console.error("[state-pages] error:", err);
    return json({ success: false, error: err.message }, 500);
  }
}
