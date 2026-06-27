import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, User, ArrowLeft, Tag } from "lucide-react";
import { getPublishedBlogBySlug, recentPublishedBlogs } from "@/lib/blogs";

const FALLBACK_IMG = "/assets/images/blog_14_thumb.webp";

function imgSrc(v) {
  if (!v) return FALLBACK_IMG;
  if (/^https?:\/\//i.test(v) || v.startsWith("/")) return v;
  const base = process.env.NEXT_PUBLIC_BLOG_IMAGE_BASE || "";
  return base ? base.replace(/\/$/, "") + "/" + v.replace(/^\//, "") : FALLBACK_IMG;
}

function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return String(d);
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const blog = await getPublishedBlogBySlug(slug);
  if (!blog) {
    return { title: "Blog not found | Mr. Service Expert", robots: "noindex, nofollow" };
  }
  return {
    title: blog.meta_title || blog.title,
    description: blog.meta_description || "",
    keywords: blog.meta_keywords || "",
    robots: blog.robots || "index, follow",
    alternates: {
      canonical: blog.canonical || `https://www.mrserviceexpert.com/blogs/${blog.blog_url}`,
    },
    openGraph: {
      title: blog.meta_title || blog.title,
      description: blog.meta_description || "",
      images: blog.image ? [imgSrc(blog.image)] : [],
      type: "article",
    },
  };
}

export default async function BlogDetailPage({ params }) {
  const { slug } = await params;
  const blog = await getPublishedBlogBySlug(slug);
  if (!blog) return notFound();

  const recent = await recentPublishedBlogs(blog.id, 4);

  return (
    <div className="bg-gradient-to-b from-purple-50/60 to-white min-h-screen">
      <div className="common-spacing py-8">
        <Link href="/blogs" className="inline-flex items-center gap-1.5 text-sm font-semibold text-purple-700 hover:gap-2.5 transition-all mb-6">
          <ArrowLeft size={16} /> All articles
        </Link>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Article */}
          <article className="w-full lg:w-2/3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="relative h-56 md:h-80 w-full bg-purple-100">
              <img
                src={imgSrc(blog.image)}
                alt={blog.title}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-6 md:p-9">
              {blog.category_name && (
                <Link
                  href={`/blogs?category=${blog.category_url || ""}`}
                  className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full mb-4"
                >
                  <Tag size={12} /> {blog.category_name}
                </Link>
              )}

              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">
                {blog.title}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 pb-6 border-b border-gray-100">
                <span className="flex items-center gap-1.5">
                  <User size={15} className="text-purple-500" /> {blog.author}
                </span>
                {blog.date && (
                  <span className="flex items-center gap-1.5">
                    <Calendar size={15} className="text-purple-500" /> {formatDate(blog.date)}
                  </span>
                )}
              </div>

              {blog.content ? (
                <div
                  className="blog-article-content mt-6"
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                />
              ) : (
                <p className="mt-6 text-gray-500">This article has no content yet.</p>
              )}
            </div>
          </article>

          {/* Sidebar: recent */}
          <aside className="w-full lg:w-1/3 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-800 mb-4">Recent articles</h2>
              <div className="space-y-4">
                {recent.length === 0 && <p className="text-sm text-gray-500">No other articles yet.</p>}
                {recent.map((r) => (
                  <Link key={r.id} href={`/blogs/${r.blog_url}`} className="group flex gap-3 items-start">
                    <img
                      src={imgSrc(r.image)}
                      alt={r.title}
                      className="h-16 w-20 flex-shrink-0 rounded-lg object-cover bg-purple-100"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-purple-700 transition">
                        {r.title}
                      </h3>
                      <span className="text-xs text-gray-400">{formatDate(r.date)}</span>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href="/blogs"
                className="mt-5 block text-center text-sm font-semibold text-purple-700 border border-purple-200 rounded-xl py-2.5 hover:bg-purple-50 transition"
              >
                View all articles
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
