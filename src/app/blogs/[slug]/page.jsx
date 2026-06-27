import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar, User, ArrowLeft, ArrowRight, Tag, Clock } from "lucide-react";
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

// Rough reading time from the HTML content.
function readingTime(html = "") {
  const words = String(html).replace(/<[^>]*>/g, " ").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
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
  const mins = readingTime(blog.content);
  const keywords = (blog.meta_keywords || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 6);

  return (
    <div className="bg-[#f7f5fb] min-h-screen">
      {/* ── Hero band ──────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#2a0a52] via-[#5b13a8] to-[#7c3aed] text-white">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 20%, #fff 0, transparent 35%), radial-gradient(circle at 85% 80%, #fff 0, transparent 30%)",
          }}
        />
        <div className="relative common-spacing !py-10 md:!py-14 max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-purple-200/80 mb-5">
            <Link href="/" className="hover:text-white transition">Home</Link>
            <span>/</span>
            <Link href="/blogs" className="hover:text-white transition">Blog</Link>
            {blog.category_name && (
              <>
                <span>/</span>
                <Link
                  href={`/blogs?category=${blog.category_url || ""}`}
                  className="hover:text-white transition truncate max-w-[140px]"
                >
                  {blog.category_name}
                </Link>
              </>
            )}
          </nav>

          {blog.category_name && (
            <Link
              href={`/blogs?category=${blog.category_url || ""}`}
              className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 hover:bg-white/25 transition"
            >
              <Tag size={12} /> {blog.category_name}
            </Link>
          )}

          <h1 className="text-2xl md:text-4xl font-extrabold leading-tight max-w-3xl">
            {blog.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-purple-100/90">
            <span className="flex items-center gap-1.5">
              <User size={15} /> {blog.author}
            </span>
            {blog.date && (
              <span className="flex items-center gap-1.5">
                <Calendar size={15} /> {formatDate(blog.date)}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <Clock size={15} /> {mins} min read
            </span>
          </div>
        </div>
      </header>

      {/* ── Body ──────────────────────────────────────────────── */}
      <div className="common-spacing !py-10 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Article */}
          <article className="w-full lg:w-2/3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="relative h-56 md:h-[22rem] w-full bg-purple-100">
              <img
                src={imgSrc(blog.image)}
                alt={blog.title}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-6 md:p-10">
              {blog.content ? (
                <div
                  className="blog-article-content"
                  dangerouslySetInnerHTML={{ __html: blog.content }}
                />
              ) : (
                <p className="text-gray-500">This article has no content yet.</p>
              )}

              {keywords.length > 0 && (
                <div className="mt-9 pt-6 border-t border-gray-100 flex flex-wrap gap-2">
                  {keywords.map((k) => (
                    <span
                      key={k}
                      className="text-xs font-medium text-[#6e11b0] bg-purple-50 px-3 py-1.5 rounded-full"
                    >
                      #{k}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-100">
                <Link
                  href="/blogs"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6e11b0] hover:gap-2.5 transition-all"
                >
                  <ArrowLeft size={16} /> Back to all articles
                </Link>
              </div>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="w-full lg:w-1/3 lg:sticky lg:top-6 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="font-bold text-gray-800 mb-4">Recent articles</h2>
              <div className="space-y-4">
                {recent.length === 0 && (
                  <p className="text-sm text-gray-400">No other articles yet.</p>
                )}
                {recent.map((r) => (
                  <Link
                    key={r.id}
                    href={`/blogs/${r.blog_url}`}
                    className="group flex gap-3 items-start"
                  >
                    <img
                      src={imgSrc(r.image)}
                      alt={r.title}
                      className="h-16 w-20 flex-shrink-0 rounded-lg object-cover bg-purple-100"
                    />
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-[#6e11b0] transition">
                        {r.title}
                      </h3>
                      <span className="text-xs text-gray-400">{formatDate(r.date)}</span>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href="/blogs"
                className="mt-5 block text-center text-sm font-semibold text-[#6e11b0] border border-purple-200 rounded-xl py-2.5 hover:bg-purple-50 transition"
              >
                View all articles
              </Link>
            </div>

            <div className="bg-gradient-to-br from-[#6e11b0] to-[#8429d8] rounded-2xl p-6 text-white shadow-lg shadow-purple-200">
              <h3 className="font-bold text-lg">Need a technician?</h3>
              <p className="text-sm text-purple-100 mt-1.5">
                Book a verified expert for AC, RO, fridge & more.
              </p>
              <Link
                href="/booking"
                className="mt-4 inline-flex items-center gap-1.5 bg-white text-[#6e11b0] text-sm font-bold px-4 py-2.5 rounded-full hover:gap-2.5 transition-all"
              >
                Book a service <ArrowRight size={15} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
