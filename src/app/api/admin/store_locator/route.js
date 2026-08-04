import { NextResponse } from "next/server";
import db from "@/lib/db";

// Only these columns may be used for ORDER BY (prevents SQL injection via sortBy).
const SORTABLE = [
  "id",
  "store_code",
  "business_name",
  "locality",
  "state",
  "postal_code",
  "status",
  "created_at",
  "updated_at",
];

// Columns the client may write. Kept in one place so POST and PUT stay in sync.
const WRITABLE = [
  "store_code",
  "business_name",
  "city_id",
  "city_url",
  "locality",
  "state",
  "address",
  "postal_code",
  "phone",
  "website",
  "primary_category",
  "additional_categories",
  "latitude",
  "longitude",
  "hours",
  "description",
];

const clean = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
};

// latitude / longitude are nullable decimals — an empty box must stay NULL.
const num = (v) => {
  const s = clean(v);
  if (s === null) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const buildValues = (body) =>
  WRITABLE.map((col) => {
    if (col === "latitude" || col === "longitude") return num(body[col]);
    if (col === "city_id") {
      const n = parseInt(body.city_id, 10);
      return Number.isFinite(n) ? n : null;
    }
    if (col === "city_url") return clean(body.city_url)?.toLowerCase() ?? null;
    return clean(body[col]);
  });

export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    connection = await db.getConnection();

    // ---- distinct states for the dropdown filter ----
    if (searchParams.get("type") === "states") {
      const [rows] = await connection.query(
        `SELECT DISTINCT state FROM store_locator
         WHERE state IS NOT NULL AND state <> ''
         ORDER BY state ASC`
      );
      return NextResponse.json({
        success: true,
        states: rows.map((r) => r.state),
      });
    }

    // ---- active cities, so the form can link a store to a city page ----
    if (searchParams.get("type") === "cities") {
      const [rows] = await connection.query(
        `SELECT id, city_name, city_url, state FROM city_tb
         WHERE status = '1'
         ORDER BY city_name ASC`
      );
      return NextResponse.json({ success: true, cities: rows });
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
    const cityUrl = (searchParams.get("city_url") || "").trim();

    let sortBy = searchParams.get("sortBy") || "id";
    if (!SORTABLE.includes(sortBy)) sortBy = "id";
    let sortDir = (searchParams.get("sortDir") || "DESC").toUpperCase();
    if (!["ASC", "DESC"].includes(sortDir)) sortDir = "DESC";

    const where = [];
    const params = [];

    if (search) {
      where.push(
        `(business_name LIKE ? OR store_code LIKE ? OR locality LIKE ?
          OR city_url LIKE ? OR address LIKE ? OR postal_code LIKE ? OR phone LIKE ?)`
      );
      const like = `%${search}%`;
      params.push(like, like, like, like, like, like, like);
    }
    if (status === "0" || status === "1") {
      where.push("status = ?");
      params.push(status);
    }
    if (state) {
      where.push("state = ?");
      params.push(state);
    }
    if (cityUrl) {
      where.push("LOWER(city_url) = ?");
      params.push(cityUrl.toLowerCase());
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total FROM store_locator ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    // limit/offset are validated integers, so they're safe to inline
    // (avoids the prepared-statement LIMIT placeholder issue in MySQL).
    const [rows] = await connection.query(
      `SELECT * FROM store_locator ${whereSql}
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

// POST — add a new store location
export async function POST(request) {
  let connection;
  try {
    const body = await request.json();

    if (!clean(body.business_name)) {
      return NextResponse.json(
        { success: false, message: "Business name is required." },
        { status: 400 }
      );
    }
    if (!clean(body.address)) {
      return NextResponse.json(
        { success: false, message: "Address is required." },
        { status: 400 }
      );
    }
    if (!clean(body.city_url)) {
      return NextResponse.json(
        { success: false, message: "City is required — it links the store to its city page." },
        { status: 400 }
      );
    }

    connection = await db.getConnection();

    // store_code is the human-facing identifier; keep it unique when supplied.
    const storeCode = clean(body.store_code);
    if (storeCode) {
      const [dup] = await connection.query(
        `SELECT id FROM store_locator WHERE store_code = ? LIMIT 1`,
        [storeCode]
      );
      if (dup.length) {
        return NextResponse.json(
          {
            success: false,
            message: `Store code "${storeCode}" is already used by store ID ${dup[0].id}.`,
          },
          { status: 409 }
        );
      }
    }

    const values = buildValues(body);
    const status = String(body.status) === "0" ? "0" : "1";

    const [result] = await connection.query(
      `INSERT INTO store_locator
        (${WRITABLE.join(", ")}, status, created_at, updated_at)
       VALUES (${WRITABLE.map(() => "?").join(", ")}, ?, NOW(), NOW())`,
      [...values, status]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Store created successfully.",
        storeId: result.insertId,
      },
      { status: 201 }
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

// PUT — update an existing store location
export async function PUT(request) {
  let connection;
  try {
    const body = await request.json();
    const id = parseInt(body.id, 10);

    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { success: false, message: "Missing store id" },
        { status: 400 }
      );
    }
    if (!clean(body.business_name)) {
      return NextResponse.json(
        { success: false, message: "Business name is required." },
        { status: 400 }
      );
    }
    if (!clean(body.address)) {
      return NextResponse.json(
        { success: false, message: "Address is required." },
        { status: 400 }
      );
    }

    connection = await db.getConnection();

    const storeCode = clean(body.store_code);
    if (storeCode) {
      const [dup] = await connection.query(
        `SELECT id FROM store_locator WHERE store_code = ? AND id <> ? LIMIT 1`,
        [storeCode, id]
      );
      if (dup.length) {
        return NextResponse.json(
          {
            success: false,
            message: `Store code "${storeCode}" is already used by store ID ${dup[0].id}.`,
          },
          { status: 409 }
        );
      }
    }

    const values = buildValues(body);
    const status = String(body.status) === "0" ? "0" : "1";

    const [result] = await connection.query(
      `UPDATE store_locator SET
        ${WRITABLE.map((c) => `${c}=?`).join(", ")}, status=?, updated_at=NOW()
       WHERE id=?`,
      [...values, status, id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: `No store found with ID ${id}.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Store updated successfully.",
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

// DELETE — ?id=
export async function DELETE(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id"), 10);

    if (!Number.isFinite(id)) {
      return NextResponse.json(
        { success: false, message: "Missing store id" },
        { status: 400 }
      );
    }

    connection = await db.getConnection();
    const [result] = await connection.query(
      `DELETE FROM store_locator WHERE id = ?`,
      [id]
    );

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { success: false, message: `No store found with ID ${id}.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Store deleted." });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
