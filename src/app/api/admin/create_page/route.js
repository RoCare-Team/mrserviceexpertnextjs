import { NextResponse } from "next/server";
import db from "@/lib/db";

const FAQ_FIELDS = [];
for (let i = 1; i <= 5; i++) FAQ_FIELDS.push(`faqquestion${i}`, `faqanswer${i}`);

// The two page sources (same split as the edit_page route).
//   brand   -> page_master_tb          (city + category + brand pages)
//   nobrand -> master_tb_withoutbrand  (city + category pages, resolved
//              live by city_id + category_id, NOT by page_url)
const TABLES = {
  brand: "page_master_tb",
  nobrand: "master_tb_withoutbrand",
};

const COMMON_INSERT_FIELDS = [
  "page_title",
  "page_content",
  "status",
  "city_id",
  "category_id",
  "service_type_id",
  "meta_title",
  "meta_keywords",
  "meta_description",
  ...FAQ_FIELDS,
];

// Table-specific extras, intersected with each table's real columns:
//   brand_id / youtube_url -> only page_master_tb
//   robots                 -> only master_tb_withoutbrand
const EXTRA_INSERT_FIELDS = ["brand_id", "youtube_url", "robots"];
const CANDIDATE_INSERT_FIELDS = [...COMMON_INSERT_FIELDS, ...EXTRA_INSERT_FIELDS];

const _colCache = new Map();
async function getColumns(connection, table) {
  if (_colCache.has(table)) return _colCache.get(table);
  const [cols] = await connection.query(`SHOW COLUMNS FROM \`${table}\``);
  const set = new Set(cols.map((c) => c.Field));
  _colCache.set(table, set);
  return set;
}

export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    connection = await db.getConnection();

    // ---- real-time duplicate check ----
    // page_url is unused by the live routes (and empty in both tables), so
    // duplicates are defined by the ID combination the live lookup uses:
    //   brand   : city_id + category_id + brand_id in page_master_tb
    //   nobrand : city_id + category_id            in master_tb_withoutbrand
    if (type === "check_duplicate") {
      const source = searchParams.get("source") === "nobrand" ? "nobrand" : "brand";
      const cityId = (searchParams.get("city_id") || "").trim();
      const categoryId = (searchParams.get("category_id") || "").trim();

      if (source === "nobrand") {
        if (!cityId || !categoryId)
          return NextResponse.json({ success: true, exists: false });

        const [rows] = await connection.query(
          `SELECT id FROM master_tb_withoutbrand
           WHERE city_id = ? AND category_id = ? LIMIT 1`,
          [cityId, categoryId]
        );
        return NextResponse.json({ success: true, exists: rows.length > 0 });
      }

      const brandId = (searchParams.get("brand_id") || "").trim();
      if (!cityId || !categoryId || !brandId)
        return NextResponse.json({ success: true, exists: false });

      const [rows] = await connection.query(
        `SELECT id FROM page_master_tb
         WHERE city_id = ? AND category_id = ? AND brand_id = ? LIMIT 1`,
        [cityId, categoryId, brandId]
      );
      return NextResponse.json({ success: true, exists: rows.length > 0 });
    }

    // ---- relation pickers (reused from edit route) ----
    if (type === "cities") {
      const q = (searchParams.get("q") || "").trim();
      const [rows] = await connection.query(
        `SELECT id, city_name, city_url FROM city_tb
         WHERE city_name LIKE ? OR city_url LIKE ?
         ORDER BY city_name ASC LIMIT 20`,
        [`%${q}%`, `%${q}%`]
      );
      return NextResponse.json({ success: true, cities: rows });
    }
    if (type === "categories") {
      const [rows] = await connection.query(
        `SELECT id, category_name FROM category_tb WHERE status='1' ORDER BY category_name ASC`
      );
      return NextResponse.json({ success: true, categories: rows });
    }
    if (type === "brands") {
      const [rows] = await connection.query(
        `SELECT id, brand_name FROM brand_tb WHERE status='1' ORDER BY brand_name ASC`
      );
      return NextResponse.json({ success: true, brands: rows });
    }
    if (type === "service_types") {
      try {
        const [rows] = await connection.query(
          `SELECT * FROM service_type_tb ORDER BY id ASC`
        );
        return NextResponse.json({ success: true, service_types: rows });
      } catch {
        return NextResponse.json({ success: true, service_types: [] });
      }
    }

    return NextResponse.json(
      { success: false, message: "Unknown request type." },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

// ---- CREATE a new page ----
export async function POST(request) {
  let connection;
  try {
    const body = await request.json();
    const { page_title } = body;

    // "brand" (default) -> page_master_tb, "nobrand" -> master_tb_withoutbrand
    const source = body._source === "nobrand" ? "nobrand" : "brand";
    const table = TABLES[source];

    // --- Required field validation ---
    // Live pages are resolved by IDs (page_url is unused), so the IDs are
    // what's mandatory and the URL is always derived — never typed by hand.
    const errors = {};
    if (!page_title || !page_title.trim())
      errors.page_title = "Page title is required.";
    if (!body.city_id) errors.city_id = "City is required.";
    if (!body.category_id) errors.category_id = "Category is required.";
    if (source === "brand" && !body.brand_id)
      errors.brand_id = "Brand is required for a branded page.";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, message: "Validation failed.", errors },
        { status: 422 }
      );
    }

    connection = await db.getConnection();

    // --- Duplicate check on the ID combination the live lookup uses ---
    if (source === "brand") {
      const [dupRows] = await connection.query(
        `SELECT id FROM page_master_tb
         WHERE city_id = ? AND category_id = ? AND brand_id = ? LIMIT 1`,
        [body.city_id, body.category_id, body.brand_id]
      );
      if (dupRows.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Duplicate entry detected.",
            errors: {
              brand_id: `A page for this city + category + brand already exists (ID: ${dupRows[0].id}).`,
            },
          },
          { status: 409 }
        );
      }
    } else {
      const [dupRows] = await connection.query(
        `SELECT id FROM master_tb_withoutbrand
         WHERE city_id = ? AND category_id = ? LIMIT 1`,
        [body.city_id, body.category_id]
      );
      if (dupRows.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Duplicate entry detected.",
            errors: {
              city_id: `A without-brand page for this city + category already exists (ID: ${dupRows[0].id}).`,
            },
          },
          { status: 409 }
        );
      }
    }

    // --- Build insert from whitelisted fields that actually exist ---
    const existing = await getColumns(connection, table);
    const fields = CANDIDATE_INSERT_FIELDS.filter((f) => existing.has(f));
    const values = fields.map((f) => {
      if (f === "page_title") return page_title.trim();
      if (f === "status") return body[f] ?? "1";
      return body[f] !== undefined && body[f] !== "" ? body[f] : null;
    });

    const [result] = await connection.query(
      `INSERT INTO \`${table}\` (${fields.join(", ")}, created_at, updated_at)
       VALUES (${fields.map(() => "?").join(", ")}, NOW(), NOW())`,
      values
    );

    return NextResponse.json(
      {
        success: true,
        message: "Page created successfully.",
        page_id: result.insertId,
        _source: source,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        {
          success: false,
          message: "A page with this combination already exists.",
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}