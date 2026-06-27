import { NextResponse } from "next/server";
import db from "@/lib/db";

const FAQ_FIELDS = [];
for (let i = 1; i <= 5; i++) FAQ_FIELDS.push(`faqquestion${i}`, `faqanswer${i}`);

const INSERT_FIELDS = [
  "page_title",
  "page_url",
  "page_content",
  "youtube_url",
  "status",
  "city_id",
  "category_id",
  "brand_id",
  "service_type_id",
  "meta_title",
  "meta_keywords",
  "meta_description",
  ...FAQ_FIELDS,
];

let _pageColumns = null;
async function getPageColumns(connection) {
  if (_pageColumns) return _pageColumns;
  const [cols] = await connection.query(`SHOW COLUMNS FROM page_master_tb`);
  _pageColumns = new Set(cols.map((c) => c.Field));
  return _pageColumns;
}

export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    connection = await db.getConnection();

    // ---- real-time duplicate check on page_url ----
    if (type === "check_duplicate") {
      const value = (searchParams.get("value") || "").trim();
      if (!value) return NextResponse.json({ success: true, exists: false });

      const [rows] = await connection.query(
        `SELECT id FROM page_master_tb WHERE page_url = ? LIMIT 1`,
        [value]
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
    const { page_title, page_url } = body;

    // --- Required field validation ---
    const errors = {};
    if (!page_title || !page_title.trim())
      errors.page_title = "Page title is required.";
    if (!page_url || !page_url.trim())
      errors.page_url = "Page URL is required.";

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { success: false, message: "Validation failed.", errors },
        { status: 422 }
      );
    }

    const trimmedUrl = page_url.trim();

    connection = await db.getConnection();

    // --- Duplicate check on page_url ---
    const [dupRows] = await connection.query(
      `SELECT id FROM page_master_tb WHERE page_url = ? LIMIT 1`,
      [trimmedUrl]
    );

    if (dupRows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Duplicate entry detected.",
          errors: {
            page_url: `This page URL already exists (ID: ${dupRows[0].id}).`,
          },
        },
        { status: 409 }
      );
    }

    // --- Build insert from whitelisted fields that actually exist ---
    const existing = await getPageColumns(connection);
    const fields = INSERT_FIELDS.filter((f) => existing.has(f));
    const values = fields.map((f) => {
      if (f === "page_url") return trimmedUrl;
      if (f === "page_title") return page_title.trim();
      if (f === "status") return body[f] ?? "1";
      return body[f] !== undefined && body[f] !== "" ? body[f] : null;
    });

    const [result] = await connection.query(
      `INSERT INTO page_master_tb (${fields.join(", ")}, created_at, updated_at)
       VALUES (${fields.map(() => "?").join(", ")}, NOW(), NOW())`,
      values
    );

    return NextResponse.json(
      {
        success: true,
        message: "Page created successfully.",
        page_id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        {
          success: false,
          message: "A page with this URL already exists.",
          errors: { page_url: "This page URL is already taken." },
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