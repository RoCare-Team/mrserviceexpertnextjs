
import { NextResponse } from "next/server";
import db from "@/lib/db";

// Only these columns may be used for ORDER BY (prevents SQL injection via sortBy).
const SORTABLE = [
  "id",
  "city_name",
  "city_url",
  "state",
  "status",
  "created_at",
  "updated_at",
];

export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);

    connection = await db.getConnection();

    // ---- distinct states for the dropdown filter ----
    if (searchParams.get("type") === "states") {
      const [rows] = await connection.query(
        `SELECT DISTINCT state FROM city_tb
         WHERE state IS NOT NULL AND state <> ''
         ORDER BY state ASC`
      );
      return NextResponse.json({
        success: true,
        states: rows.map((r) => r.state),
      });
    }

    // ---- pagination + filters ----
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "25", 10))
    );
    const offset = (page - 1) * limit;

    const search = (searchParams.get("search") || "").trim();
    const status = (searchParams.get("status") || "").trim(); // '', '0', '1'
    const state = (searchParams.get("state") || "").trim();

    let sortBy = searchParams.get("sortBy") || "id";
    if (!SORTABLE.includes(sortBy)) sortBy = "id";
    let sortDir = (searchParams.get("sortDir") || "DESC").toUpperCase();
    if (!["ASC", "DESC"].includes(sortDir)) sortDir = "DESC";

    const where = [];
    const params = [];

    if (search) {
      where.push("(city_name LIKE ? OR city_url LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    if (status === "0" || status === "1") {
      where.push("status = ?");
      params.push(status);
    }
    if (state) {
      where.push("state = ?");
      params.push(state);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Total (for pagination) + page rows.
    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total FROM city_tb ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    // limit/offset are validated integers, so they're safe to inline
    // (avoids the prepared-statement LIMIT placeholder issue in MySQL).
    const [rows] = await connection.query(
      `SELECT * FROM city_tb ${whereSql}
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
      city_name,
      city_url,
      city_content,
      state,
      status,
      meta_title,
      meta_keywords,
      meta_description,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing city id" },
        { status: 400 }
      );
    }

    connection = await db.getConnection();
    await connection.query(
      `UPDATE city_tb SET
        city_name=?, city_url=?, city_content=?, state=?, status=?,
        meta_title=?, meta_keywords=?, meta_description=?, updated_at=NOW()
       WHERE id=?`,
      [
        city_name ?? null,
        city_url ?? null,
        city_content ?? null,
        state ?? null,
        status ?? "1",
        meta_title ?? null,
        meta_keywords ?? null,
        meta_description ?? null,
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "City Updated Successfully",
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