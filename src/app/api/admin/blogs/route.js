import { NextResponse } from "next/server";
import db from "@/lib/db";

const SORTABLE = [
  "id",
  "blog_title",
  "blog_url",
  "status",
  "blog_cat_id",
  "author_name",
  "publishdate",
  "created_at",
  "updated_at",
];

const WRITABLE = [
  "blog_cat_id",
  "blog_type",
  "blog_url",
  "blog_title",
  "blog_description",
  "blog_name",
  "blog_keywords",
  "blog_content_text",
  "ckeditercontant",
  "blog_image",
  "blog_image_cover",
  "image3",
  "status",
  "Canonical",
  "Robots",
  "author_name",
  "publishdate",
];

const LIST_COLUMNS = `
  b.id, b.blog_cat_id, b.blog_type, b.blog_url, b.blog_title, b.blog_name,
  b.status, b.blog_image, b.author_name, b.publishdate, b.blog_date,
  b.created_at, b.updated_at
`;

const normalizeSlug = (v = "") =>
  v
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-");


const ACTIVE_TOKENS = ["1", "active", "true", "yes", "on"];
const INACTIVE_TOKENS = ["0", "inactive", "false", "no", "off"];

const isActiveStatus = (v) =>
  ACTIVE_TOKENS.includes(String(v ?? "").trim().toLowerCase());

const normalizeStatus = (v) => {
  const s = String(v ?? "").trim().toLowerCase();
  if (ACTIVE_TOKENS.includes(s)) return "active";
  if (INACTIVE_TOKENS.includes(s)) return "inactive";
  return "active";
};

export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    connection = await db.getConnection();

    // ---- categories for the dropdown ----
    if (type === "categories") {
      const [rows] = await connection.query(
        `SELECT id, name, category_url FROM blog_category ORDER BY name ASC`
      );
      return NextResponse.json({ success: true, categories: rows });
    }

    // ---- duplicate blog_url check (excludeId lets edit ignore itself) ----
    if (type === "check_duplicate") {
      const value = normalizeSlug(searchParams.get("value") || "");
      const excludeId = parseInt(searchParams.get("excludeId") || "0", 10);
      if (!value) return NextResponse.json({ success: true, exists: false });

      const [rows] = await connection.query(
        `SELECT id FROM blog WHERE blog_url = ? ${
          excludeId ? "AND id <> ?" : ""
        } LIMIT 1`,
        excludeId ? [value, excludeId] : [value]
      );
      return NextResponse.json({ success: true, exists: rows.length > 0 });
    }

    // ---- single blog (full row) for the edit screen ----
    const idParam = searchParams.get("id");
    if (idParam) {
      const id = parseInt(idParam, 10);
      const [rows] = await connection.query(
        `SELECT b.*, bc.name AS category_name
         FROM blog b
         LEFT JOIN blog_category bc ON b.blog_cat_id = bc.id
         WHERE b.id = ? LIMIT 1`,
        [id]
      );
      if (!rows.length) {
        return NextResponse.json(
          { success: false, message: "Blog not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, blog: rows[0] });
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
    const blogCatId = (searchParams.get("blog_cat_id") || "").trim();

    let sortBy = searchParams.get("sortBy") || "id";
    if (!SORTABLE.includes(sortBy)) sortBy = "id";
    let sortDir = (searchParams.get("sortDir") || "DESC").toUpperCase();
    if (!["ASC", "DESC"].includes(sortDir)) sortDir = "DESC";

    const where = [];
    const params = [];

    if (search) {
      where.push("(b.blog_title LIKE ? OR b.blog_url LIKE ? OR b.author_name LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    // Status filter accepts "1"/"0" or "active"/"inactive" from the UI and
    // matches rows stored in either form (legacy "1"/"0" or text).
    if (status) {
      const wantActive = isActiveStatus(status);
      where.push("(LOWER(b.status) = ? OR b.status = ?)");
      params.push(wantActive ? "active" : "inactive", wantActive ? "1" : "0");
    }
    if (blogCatId) {
      where.push("b.blog_cat_id = ?");
      params.push(blogCatId);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Count + page run as two queries against the same WHERE.
    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total FROM blog b ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    // limit/offset are validated ints, safe to inline. sortBy/sortDir are whitelisted.
    const [rows] = await connection.query(
      `SELECT ${LIST_COLUMNS}, bc.name AS category_name
       FROM blog b
       LEFT JOIN blog_category bc ON b.blog_cat_id = bc.id
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

// ────────────────────────────────────────────────────────────────────────────
// POST  — create
// ────────────────────────────────────────────────────────────────────────────
export async function POST(request) {
  let connection;
  try {
    const body = await request.json();

    // Validate + normalize.
    const errors = {};
    const blogTitle = (body.blog_title || "").trim();
    const blogUrl = normalizeSlug(body.blog_url || "");

    if (!blogTitle) errors.blog_title = "Blog title is required.";
    if (!blogUrl) errors.blog_url = "Blog URL is required.";

    if (Object.keys(errors).length) {
      return NextResponse.json(
        { success: false, message: "Please fix the errors below.", errors },
        { status: 422 }
      );
    }

    connection = await db.getConnection();

    // Duplicate guard (race-safe-ish; a UNIQUE index on blog_url is still recommended).
    const [dup] = await connection.query(
      `SELECT id FROM blog WHERE blog_url = ? LIMIT 1`,
      [blogUrl]
    );
    if (dup.length) {
      return NextResponse.json(
        {
          success: false,
          message: "A blog with this URL already exists.",
          errors: { blog_url: "This blog URL is already taken." },
        },
        { status: 409 }
      );
    }

    // Build column list from the whitelist, forcing the normalized slug and
    // canonical status text.
    const cleaned = { ...body, blog_title: blogTitle, blog_url: blogUrl };
    if (body.status !== undefined) cleaned.status = normalizeStatus(body.status);
    const cols = WRITABLE.filter((f) => cleaned[f] !== undefined);
    const values = cols.map((f) => (cleaned[f] === "" ? null : cleaned[f]));

    // Server-managed timestamps.
    cols.push("created_at", "updated_at", "blog_date", "update_time");
    const placeholders = cols
      .map((c) =>
        ["created_at", "updated_at", "blog_date", "update_time"].includes(c)
          ? "NOW()"
          : "?"
      )
      .join(", ");

    const [result] = await connection.query(
      `INSERT INTO blog (${cols.join(", ")}) VALUES (${placeholders})`,
      values
    );

    return NextResponse.json({
      success: true,
      message: "Blog created successfully",
      blog_id: result.insertId,
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
        { success: false, message: "Missing blog id" },
        { status: 400 }
      );
    }

    const errors = {};
    const blogTitle = (body.blog_title || "").trim();
    const blogUrl = normalizeSlug(body.blog_url || "");
    if (!blogTitle) errors.blog_title = "Blog title is required.";
    if (!blogUrl) errors.blog_url = "Blog URL is required.";
    if (Object.keys(errors).length) {
      return NextResponse.json(
        { success: false, message: "Please fix the errors below.", errors },
        { status: 422 }
      );
    }

    connection = await db.getConnection();

    // Duplicate guard excluding the current row.
    const [dup] = await connection.query(
      `SELECT id FROM blog WHERE blog_url = ? AND id <> ? LIMIT 1`,
      [blogUrl, id]
    );
    if (dup.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Another blog already uses this URL.",
          errors: { blog_url: "This blog URL is already taken." },
        },
        { status: 409 }
      );
    }

    const cleaned = { ...body, blog_title: blogTitle, blog_url: blogUrl };
    if (body.status !== undefined) cleaned.status = normalizeStatus(body.status);
    const cols = WRITABLE.filter((f) => cleaned[f] !== undefined);
    if (!cols.length) {
      return NextResponse.json(
        { success: false, message: "Nothing to update." },
        { status: 400 }
      );
    }
    const sets = cols.map((f) => `${f}=?`).join(", ");
    const values = cols.map((f) => (cleaned[f] === "" ? null : cleaned[f]));

    await connection.query(
      `UPDATE blog SET ${sets}, updated_at=NOW(), update_time=NOW() WHERE id=?`,
      [...values, id]
    );

    return NextResponse.json({
      success: true,
      message: "Blog updated successfully",
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
        { success: false, message: "Missing blog id" },
        { status: 400 }
      );
    }
    connection = await db.getConnection();
    await connection.query(`DELETE FROM blog WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, message: "Blog deleted" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}