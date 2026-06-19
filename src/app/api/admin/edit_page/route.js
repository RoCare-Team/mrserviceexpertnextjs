import { NextResponse } from "next/server";
import db from "@/lib/db";

const SORTABLE = [
  "id",
  "page_title",
  "page_url",
  "status",
  "city_id",
  "category_id",
  "brand_id",
  "service_type_id",
  "created_at",
  "updated_at",
];

// 5 FAQ pairs (matches the columns in your table screenshot).
const FAQ_FIELDS = [];
for (let i = 1; i <= 5; i++) FAQ_FIELDS.push(`faqquestion${i}`, `faqanswer${i}`);

// Whitelisted columns the PUT is allowed to write (prevents arbitrary columns).
const UPDATE_FIELDS = [
  "page_title",
  "page_url",
  "page_content",
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

export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    connection = await db.getConnection();

    // ---- lookup endpoints for the relation pickers ----
    if (type === "cities") {
      const q = (searchParams.get("q") || "").trim();
      const [rows] = await connection.query(
        `SELECT id, city_name, city_url FROM city_tb
         WHERE city_name LIKE ? OR city_url LIKE ?
         ORDER BY city_name ASC
         LIMIT 20`,
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
      // TODO: confirm your service-type table name. Guessing `service_type_tb`.
      // Wrapped so a wrong name just yields an empty list instead of a 500.
      try {
        const [rows] = await connection.query(
          `SELECT * FROM service_type_tb ORDER BY id ASC`
        );
        return NextResponse.json({ success: true, service_types: rows });
      } catch {
        return NextResponse.json({ success: true, service_types: [] });
      }
    }

    // ---- paginated list ----
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "25", 10))
    );
    const offset = (page - 1) * limit;

    const search = (searchParams.get("search") || "").trim();
    const status = (searchParams.get("status") || "").trim();
    const cityId = (searchParams.get("city_id") || "").trim();
    const categoryId = (searchParams.get("category_id") || "").trim();
    const brandId = (searchParams.get("brand_id") || "").trim();
    const serviceTypeId = (searchParams.get("service_type_id") || "").trim();

    let sortBy = searchParams.get("sortBy") || "id";
    if (!SORTABLE.includes(sortBy)) sortBy = "id";
    let sortDir = (searchParams.get("sortDir") || "DESC").toUpperCase();
    if (!["ASC", "DESC"].includes(sortDir)) sortDir = "DESC";

    const where = [];
    const params = [];

    if (search) {
      where.push("(p.page_title LIKE ? OR p.page_url LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status === "0" || status === "1") {
      where.push("p.status = ?");
      params.push(status);
    }
    if (cityId) {
      where.push("p.city_id = ?");
      params.push(cityId);
    }
    if (categoryId) {
      where.push("p.category_id = ?");
      params.push(categoryId);
    }
    if (brandId) {
      where.push("p.brand_id = ?");
      params.push(brandId);
    }
    if (serviceTypeId) {
      where.push("p.service_type_id = ?");
      params.push(serviceTypeId);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total FROM page_master_tb p ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    // Join the three known relations to show real names. limit/offset are
    // validated ints -> safe to inline.
    const [rows] = await connection.query(
      `SELECT p.*, c.city_name, cat.category_name, b.brand_name
       FROM page_master_tb p
       LEFT JOIN city_tb c       ON p.city_id = c.id
       LEFT JOIN category_tb cat ON p.category_id = cat.id
       LEFT JOIN brand_tb b      ON p.brand_id = b.id
       ${whereSql}
       ORDER BY p.${sortBy} ${sortDir}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return NextResponse.json({
      success: true,
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function PUT(request) {
  let connection;
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing page id" },
        { status: 400 }
      );
    }

    const sets = UPDATE_FIELDS.map((f) => `${f}=?`).join(", ");
    const values = UPDATE_FIELDS.map((f) =>
      body[f] === undefined ? null : body[f]
    );

    connection = await db.getConnection();
    await connection.query(
      `UPDATE page_master_tb SET ${sets}, updated_at=NOW() WHERE id=?`,
      [...values, id]
    );

    return NextResponse.json({
      success: true,
      message: "Page Updated Successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}