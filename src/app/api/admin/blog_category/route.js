import { NextResponse } from "next/server";
import db from "@/lib/db";


const SORTABLE = ["id", "name", "category_url", "created_at", "updated_at"];

const WRITABLE = [
  "name",
  "contant",
  "category_url",
  "meta_title",
  "canonical",
  "meta_description",
  "meta_keywords",
  "robots",
];

const normalizeSlug = (v = "") =>
  v
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");

// ────────────────────────────────────────────────────────────────────────────
// GET
// ────────────────────────────────────────────────────────────────────────────
export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    connection = await db.getConnection();

    if (type === "check_duplicate") {
      const value = normalizeSlug(searchParams.get("value") || "");
      const excludeId = parseInt(searchParams.get("excludeId") || "0", 10);
      if (!value) return NextResponse.json({ success: true, exists: false });

      const [rows] = await connection.query(
        `SELECT id FROM blog_category WHERE category_url = ? ${
          excludeId ? "AND id <> ?" : ""
        } LIMIT 1`,
        excludeId ? [value, excludeId] : [value]
      );
      return NextResponse.json({ success: true, exists: rows.length > 0 });
    }

    const idParam = searchParams.get("id");
    if (idParam) {
      const id = parseInt(idParam, 10);
      const [rows] = await connection.query(
        `SELECT * FROM blog_category WHERE id = ? LIMIT 1`,
        [id]
      );
      if (!rows.length) {
        return NextResponse.json(
          { success: false, message: "Category not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, category: rows[0] });
    }

    // ---- paginated list ----
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "25", 10))
    );
    const offset = (page - 1) * limit;
    const search = (searchParams.get("search") || "").trim();

    let sortBy = searchParams.get("sortBy") || "id";
    if (!SORTABLE.includes(sortBy)) sortBy = "id";
    let sortDir = (searchParams.get("sortDir") || "DESC").toUpperCase();
    if (!["ASC", "DESC"].includes(sortDir)) sortDir = "DESC";

    const where = [];
    const params = [];
    if (search) {
      where.push("(name LIKE ? OR category_url LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total FROM blog_category ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    // Correlated count of blogs per category — handy in the UI and cheap at this scale.
    const [rows] = await connection.query(
      `SELECT bc.id, bc.name, bc.category_url, bc.meta_title,
              bc.created_at, bc.updated_at,
              (SELECT COUNT(*) FROM blog b WHERE b.blog_cat_id = bc.id) AS blog_count
       FROM blog_category bc
       ${whereSql}
       ORDER BY bc.${sortBy} ${sortDir}
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

// ────────────────────────────────────────────────────────────────────────────
// POST  — create
// ────────────────────────────────────────────────────────────────────────────
export async function POST(request) {
  let connection;
  try {
    const body = await request.json();

    const errors = {};
    const name = (body.name || "").trim();
    let categoryUrl = normalizeSlug(body.category_url || name);

    if (!name) errors.name = "Category name is required.";
    if (!categoryUrl) errors.category_url = "Category URL is required.";
    if (Object.keys(errors).length) {
      return NextResponse.json(
        { success: false, message: "Please fix the errors below.", errors },
        { status: 422 }
      );
    }

    connection = await db.getConnection();

    const [dup] = await connection.query(
      `SELECT id FROM blog_category WHERE category_url = ? LIMIT 1`,
      [categoryUrl]
    );
    if (dup.length) {
      return NextResponse.json(
        {
          success: false,
          message: "A category with this URL already exists.",
          errors: { category_url: "This category URL is already taken." },
        },
        { status: 409 }
      );
    }

    const cleaned = { ...body, name, category_url: categoryUrl };
    const cols = WRITABLE.filter((f) => cleaned[f] !== undefined);
    const values = cols.map((f) => (cleaned[f] === "" ? null : cleaned[f]));

    cols.push("created_at", "updated_at");
    const placeholders = cols
      .map((c) => (["created_at", "updated_at"].includes(c) ? "NOW()" : "?"))
      .join(", ");

    const [result] = await connection.query(
      `INSERT INTO blog_category (${cols.join(", ")}) VALUES (${placeholders})`,
      values
    );

    return NextResponse.json({
      success: true,
      message: "Category created successfully",
      category_id: result.insertId,
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

// ────────────────────────────────────────────────────────────────────────────
// PUT  — update one
// ────────────────────────────────────────────────────────────────────────────
export async function PUT(request) {
  let connection;
  try {
    const body = await request.json();
    const id = parseInt(body.id, 10);
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing category id" },
        { status: 400 }
      );
    }

    const errors = {};
    const name = (body.name || "").trim();
    const categoryUrl = normalizeSlug(body.category_url || name);
    if (!name) errors.name = "Category name is required.";
    if (!categoryUrl) errors.category_url = "Category URL is required.";
    if (Object.keys(errors).length) {
      return NextResponse.json(
        { success: false, message: "Please fix the errors below.", errors },
        { status: 422 }
      );
    }

    connection = await db.getConnection();

    const [dup] = await connection.query(
      `SELECT id FROM blog_category WHERE category_url = ? AND id <> ? LIMIT 1`,
      [categoryUrl, id]
    );
    if (dup.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Another category already uses this URL.",
          errors: { category_url: "This category URL is already taken." },
        },
        { status: 409 }
      );
    }

    const cleaned = { ...body, name, category_url: categoryUrl };
    const cols = WRITABLE.filter((f) => cleaned[f] !== undefined);
    const sets = cols.map((f) => `${f}=?`).join(", ");
    const values = cols.map((f) => (cleaned[f] === "" ? null : cleaned[f]));

    await connection.query(
      `UPDATE blog_category SET ${sets}, updated_at=NOW() WHERE id=?`,
      [...values, id]
    );

    return NextResponse.json({
      success: true,
      message: "Category updated successfully",
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

// ────────────────────────────────────────────────────────────────────────────
// DELETE  ?id=
// ────────────────────────────────────────────────────────────────────────────
export async function DELETE(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0", 10);
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing category id" },
        { status: 400 }
      );
    }

    connection = await db.getConnection();

    // Don't orphan blogs — refuse if any blog still points here.
    const [used] = await connection.query(
      `SELECT COUNT(*) AS c FROM blog WHERE blog_cat_id = ?`,
      [id]
    );
    if (used[0].c > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete: ${used[0].c} blog(s) still use this category.`,
        },
        { status: 409 }
      );
    }

    await connection.query(`DELETE FROM blog_category WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}