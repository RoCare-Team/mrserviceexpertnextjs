import { NextResponse } from "next/server";
import {
  listPublishedBlogs,
  listBlogCategories,
  getPublishedBlogBySlug,
} from "@/lib/blogs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public blogs API.
 *   GET /api/blogs?type=categories        → categories (with counts)
 *   GET /api/blogs?slug=my-blog           → single published blog (full)
 *   GET /api/blogs?page=1&limit=9&...     → paginated published list
 *       optional: &category=<id|slug> &search=<text>
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "categories") {
      const categories = await listBlogCategories();
      return NextResponse.json({ success: true, categories });
    }

    const slug = searchParams.get("slug");
    if (slug) {
      const blog = await getPublishedBlogBySlug(slug);
      if (!blog) {
        return NextResponse.json(
          { success: false, message: "Blog not found." },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, blog });
    }

    const result = await listPublishedBlogs({
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 9,
      category: searchParams.get("category") || "",
      search: searchParams.get("search") || "",
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message, data: [] },
      { status: 500 }
    );
  }
}
