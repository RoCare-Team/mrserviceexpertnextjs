import { NextResponse } from "next/server";
import db from "@/lib/db";

/**
 * GET /api/get-blogs
 *
 * Public, read-only blog listing. Returns each blog with its full,
 * absolute public URL in this format:
 *
 *   https://www.mrserviceexpert.com/blogs/{blog_url}
 *
 * Optional query params:
 *   ?page=1            page number (default 1)
 *   ?limit=20          page size (1-100, default 20)
 *   ?search=text       matches blog_title / blog_name / blog_url
 *   ?blog_cat_id=3     filter by category id
 *   ?category=ac-tips  filter by category_url (slug)
 *   ?status=active     active | inactive (defaults to active/published only)
 *   ?all=1             ignore the published filter (admin use)
 */

// Public site base — keep in env if you ever move domains.
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.mrserviceexpert.com"
).replace(/\/$/, "");

const ACTIVE_TOKENS = ["1", "active", "true", "yes", "on"];
const isActive = (v) =>
  ACTIVE_TOKENS.includes(String(v ?? "").trim().toLowerCase());

// Build the full public URL for a blog.
const buildBlogUrl = (slug) =>
  slug ? `${SITE_URL}/blogs/${String(slug).replace(/^\/+/, "")}` : null;

const shapeRow = (r) => ({
  id: r.id,
  blog_cat_id: r.blog_cat_id ?? null,
  category_name: r.category_name || null,
  category_url: r.category_url || null,
  blog_title: r.blog_title || r.blog_name || "Untitled",
  blog_name: r.blog_name || "",
  blog_description: r.blog_description || "",
  blog_keywords: r.blog_keywords || "",
  blog_image: r.blog_image || null,
  blog_image_cover: r.blog_image_cover || r.blog_image || null,
  author_name: r.author_name || "Mr. Service Expert",
  status: r.status ?? null,
  blog_date: r.blog_date || null,
  publishdate: r.publishdate || null,
  created_at: r.created_at || null,
  // The raw slug, plus the full absolute URL the user asked for.
  blog_slug: r.blog_url,
  blog_url: buildBlogUrl(r.blog_url),
});

export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "20", 10))
    );
    const offset = (page - 1) * limit;

    const search = (searchParams.get("search") || "").trim();
    const blogCatId = (searchParams.get("blog_cat_id") || "").trim();
    const category = (searchParams.get("category") || "").trim();
    const status = (searchParams.get("status") || "").trim();
    const all = searchParams.get("all");

    connection = await db.getConnection();

    const where = [];
    const params = [];

    // Default to published-only unless ?all=1 is passed.
    if (!all) {
      if (status) {
        const wantActive = isActive(status);
        where.push("(LOWER(b.status) = ? OR b.status = ?)");
        params.push(wantActive ? "active" : "inactive", wantActive ? "1" : "0");
      } else {
        where.push("(b.status = '1' OR LOWER(b.status) = 'active')");
      }
    } else if (status) {
      const wantActive = isActive(status);
      where.push("(LOWER(b.status) = ? OR b.status = ?)");
      params.push(wantActive ? "active" : "inactive", wantActive ? "1" : "0");
    }

    if (search) {
      where.push("(b.blog_title LIKE ? OR b.blog_name LIKE ? OR b.blog_url LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (blogCatId) {
      where.push("b.blog_cat_id = ?");
      params.push(blogCatId);
    }
    if (category) {
      where.push("bc.category_url = ?");
      params.push(category);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM blog b
       LEFT JOIN blog_category bc ON b.blog_cat_id = bc.id
       ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await connection.query(
      `SELECT b.id, b.blog_cat_id, b.blog_url, b.blog_title, b.blog_name,
              b.blog_description, b.blog_keywords, b.blog_image, b.blog_image_cover,
              b.author_name, b.status, b.blog_date, b.publishdate, b.created_at,
              bc.name AS category_name, bc.category_url
       FROM blog b
       LEFT JOIN blog_category bc ON b.blog_cat_id = bc.id
       ${whereSql}
       ORDER BY COALESCE(b.publishdate, b.blog_date, b.created_at) DESC, b.id DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return NextResponse.json({
      success: true,
      data: rows.map(shapeRow),
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