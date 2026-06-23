import { NextResponse } from "next/server";
import db from "@/lib/db";

const SORTABLE = [
  "id",
  "brand_name",
  "brand_url",
  "category_id",
  "status",
  "created_at",
  "updated_at",
];

export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);

    connection = await db.getConnection();

    // ---- categories for the dropdown (filter + edit form) ----
    if (searchParams.get("type") === "categories") {
      const [rows] = await connection.query(
        `SELECT id, category_name FROM category_tb
         WHERE status = '1'
         ORDER BY category_name ASC`
      );
      return NextResponse.json({ success: true, categories: rows });
    }

    // ---- pagination + filters ----
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "25", 10))
    );
    const offset = (page - 1) * limit;

    const search = (searchParams.get("search") || "").trim();
    const status = (searchParams.get("status") || "").trim();
    const categoryId = (searchParams.get("category_id") || "").trim();

    let sortBy = searchParams.get("sortBy") || "id";
    if (!SORTABLE.includes(sortBy)) sortBy = "id";
    let sortDir = (searchParams.get("sortDir") || "DESC").toUpperCase();
    if (!["ASC", "DESC"].includes(sortDir)) sortDir = "DESC";

    const where = [];
    const params = [];

    if (search) {
      where.push("(b.brand_name LIKE ? OR b.brand_url LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status === "0" || status === "1") {
      where.push("b.status = ?");
      params.push(status);
    }
    if (categoryId) {
      where.push("b.category_id = ?");
      params.push(categoryId);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total FROM brand_tb b ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    // Join category_tb so we can show the category name. limit/offset are
    // validated integers -> safe to inline.
    const [rows] = await connection.query(
      `SELECT b.*, c.category_name
       FROM brand_tb b
       LEFT JOIN category_tb c ON b.category_id = c.id
       ${whereSql}
       ORDER BY b.${sortBy} ${sortDir}
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
    const {
      id,
      brand_name,
      category_id,
      brand_url,
      brand_content,
      status,
      icon,
      meta_title,
      meta_keywords,
      meta_description,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing brand id" },
        { status: 400 }
      );
    }

    connection = await db.getConnection();
    await connection.query(
      `UPDATE brand_tb SET
        brand_name=?, category_id=?, brand_url=?, brand_content=?, status=?,
        icon=?, meta_title=?, meta_keywords=?, meta_description=?, updated_at=NOW()
       WHERE id=?`,
      [
        brand_name ?? null,
        category_id ?? null,
        brand_url ?? null,
        brand_content ?? null,
        status ?? "1",
        icon ?? null,
        meta_title ?? null,
        meta_keywords ?? null,
        meta_description ?? null,
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Brand Updated Successfully",
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