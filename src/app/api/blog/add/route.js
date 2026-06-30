import { NextResponse } from "next/server";
import db from "@/lib/db";

/**
 * POST /api/blog/add
 *
 * Create a new blog post.
 *
 * Expected JSON payload (the * marked ones are required):
 *   blog_title         *   blog headline
 *   blog_url           *   slug (auto-normalized; must be UNIQUE)
 *   blog_cat_id        *   category id (must exist in blog_category)
 *   author_name            author display name
 *   blog_image             main image (url / key)
 *   blog_image_cover       listing-card cover image (optional)
 *   blog_name              short name
 *   blog_keywords          meta keywords
 *   blog_description       meta / excerpt
 *   blog_content_text      body (HTML)
 *   blog_date              publish date (YYYY-MM-DD); defaults to today
 *   status                 active | inactive (default active)
 *
 * Validation:
 *   - blog_title, blog_url, blog_cat_id are required
 *   - blog_url is normalized to a clean slug and must NOT already exist
 *     (no duplicate URLs)
 *   - blog_cat_id must reference a real category row
 */

// Whitelist of columns we allow the client to write.
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

const normalizeSlug = (v = "") =>
  v
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const ACTIVE_TOKENS = ["1", "active", "true", "yes", "on"];
const INACTIVE_TOKENS = ["0", "inactive", "false", "no", "off"];
const normalizeStatus = (v) => {
  const s = String(v ?? "").trim().toLowerCase();
  if (INACTIVE_TOKENS.includes(s)) return "inactive";
  if (ACTIVE_TOKENS.includes(s)) return "active";
  return "active";
};

// Accept YYYY-MM-DD (or anything Date can parse) -> YYYY-MM-DD, else null.
const normalizeDate = (v) => {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

export async function POST(request) {
  let connection;
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body." },
        { status: 400 }
      );
    }

    // ---- validate + normalize ----
    const errors = {};
    const blogTitle = (body.blog_title || "").trim();
    const blogUrl = normalizeSlug(body.blog_url || body.blog_title || "");
    const blogCatId = parseInt(body.blog_cat_id, 10);

    if (!blogTitle) errors.blog_title = "Blog title is required.";
    if (!blogUrl) errors.blog_url = "Blog URL is required.";
    if (!blogCatId) errors.blog_cat_id = "Blog category is required.";

    if (Object.keys(errors).length) {
      return NextResponse.json(
        { success: false, message: "Please fix the errors below.", errors },
        { status: 422 }
      );
    }

    connection = await db.getConnection();

    // ---- category must exist (FK relation: blog.blog_cat_id -> blog_category.id) ----
    const [cat] = await connection.query(
      `SELECT id FROM blog_category WHERE id = ? LIMIT 1`,
      [blogCatId]
    );
    if (!cat.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Selected category does not exist.",
          errors: { blog_cat_id: "Invalid category." },
        },
        { status: 422 }
      );
    }

    // ---- duplicate URL guard (no two blogs with the same blog_url) ----
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

    // ---- build the insert from the whitelist ----
    const cleaned = {
      ...body,
      blog_title: blogTitle,
      blog_url: blogUrl,
      blog_cat_id: blogCatId,
      status: normalizeStatus(body.status),
    };

    const cols = WRITABLE.filter((f) => cleaned[f] !== undefined);
    const values = cols.map((f) => (cleaned[f] === "" ? null : cleaned[f]));

    // blog_date: use payload value if valid, else NOW().
    const blogDate = normalizeDate(body.blog_date);

    // Server-managed timestamp columns.
    cols.push("created_at", "updated_at", "update_time", "blog_date");
    const placeholders = cols
      .map((c) => {
        if (["created_at", "updated_at", "update_time"].includes(c)) return "NOW()";
        if (c === "blog_date") return blogDate ? "?" : "NOW()";
        return "?";
      })
      .join(", ");
    if (blogDate) values.push(blogDate);

    const [result] = await connection.query(
      `INSERT INTO blog (${cols.join(", ")}) VALUES (${placeholders})`,
      values
    );

    return NextResponse.json({
      success: true,
      message: "Blog created successfully.",
      blog_id: result.insertId,
      blog_url: blogUrl,
      url: `${(process.env.NEXT_PUBLIC_SITE_URL || "https://www.mrserviceexpert.com").replace(
        /\/$/,
        ""
      )}/blogs/${blogUrl}`,
    });
  } catch (error) {
    // Duplicate-key race (if a UNIQUE index exists on blog_url).
    if (error && error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        {
          success: false,
          message: "A blog with this URL already exists.",
          errors: { blog_url: "This blog URL is already taken." },
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