import { NextResponse } from "next/server";
import db from "@/lib/db";

/**
 * GET /api/blog/categories
 *
 * Returns all blog categories along with how many PUBLISHED blogs each one has.
 *
 * RELATION between the two tables:
 *   blog.blog_cat_id  ->  blog_category.id   (many blogs : one category)
 *
 * So every blog points to exactly one category via `blog_cat_id`, and a
 * category can have many blogs. We LEFT JOIN on that key and COUNT the
 * published blogs per category (categories with 0 blogs still show up).
 *
 * Optional query params:
 *   ?all=1   include blogs of any status in blog_count (default: published only)
 */

export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all");

    connection = await db.getConnection();

    // Count only published blogs unless ?all=1.
    const publishedFilter = all
      ? ""
      : "AND (b.status = '1' OR LOWER(b.status) = 'active')";

    const [rows] = await connection.query(
      `SELECT c.id,
              c.name,
              c.category_url,
              c.meta_title,
              c.meta_description,
              c.created_at,
              c.updated_at,
              COUNT(b.id) AS blog_count
       FROM blog_category c
       LEFT JOIN blog b
              ON b.blog_cat_id = c.id ${publishedFilter}
       GROUP BY c.id, c.name, c.category_url, c.meta_title,
                c.meta_description, c.created_at, c.updated_at
       ORDER BY c.name ASC`
    );

    return NextResponse.json({
      success: true,
      relation: "blog.blog_cat_id -> blog_category.id (many blogs : one category)",
      total: rows.length,
      categories: rows,
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