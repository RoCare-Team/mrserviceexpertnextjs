import { NextResponse } from "next/server";
import db from "@/lib/db";

const SORTABLE = [
  "id",
  "category_name",
  "category_url",
  "status",
  "created_at",
  "updated_at",
];

export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "25", 10))
    );
    const offset = (page - 1) * limit;

    const search = (searchParams.get("search") || "").trim();
    const status = (searchParams.get("status") || "").trim(); // '', '0', '1'

    let sortBy = searchParams.get("sortBy") || "id";
    if (!SORTABLE.includes(sortBy)) sortBy = "id";
    let sortDir = (searchParams.get("sortDir") || "DESC").toUpperCase();
    if (!["ASC", "DESC"].includes(sortDir)) sortDir = "DESC";

    const where = [];
    const params = [];

    if (search) {
      where.push("(category_name LIKE ? OR category_url LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status === "0" || status === "1") {
      where.push("status = ?");
      params.push(status);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    connection = await db.getConnection();

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total FROM category_tb ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    // limit/offset are validated integers -> safe to inline.
    const [rows] = await connection.query(
      `SELECT * FROM category_tb ${whereSql}
       ORDER BY ${sortBy} ${sortDir}
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
      category_name,
      category_url,
      category_content,
      status,
      phone,
      banner,
      icon,
      meta_title,
      meta_keywords,
      meta_description,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing category id" },
        { status: 400 }
      );
    }

    connection = await db.getConnection();
    await connection.query(
      `UPDATE category_tb SET
        category_name=?, category_url=?, category_content=?, status=?,
        phone=?, banner=?, icon=?,
        meta_title=?, meta_keywords=?, meta_description=?, updated_at=NOW()
       WHERE id=?`,
      [
        category_name ?? null,
        category_url ?? null,
        category_content ?? null,
        status ?? "1",
        phone ?? null,
        banner ?? null,
        icon ?? null,
        meta_title ?? null,
        meta_keywords ?? null,
        meta_description ?? null,
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Category Updated Successfully",
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