import Link from "next/link";
import { Search, User, Calendar, ArrowRight, FileText, Layers } from "lucide-react";
import { listPublishedBlogs, listBlogCategories } from "@/lib/blogs";

export const metadata = {
  title: "Blog — Home Appliance Care, Repair Tips & Guides",
  description:
    "Practical guides, maintenance tips and service know-how for ACs, water purifiers, refrigerators and home appliances from the Mr. Service Expert team.",
  alternates: { canonical: "https://www.mrserviceexpert.com/blogs" },
};

const PER_PAGE = 8;
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
  return dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// Build a URL that keeps the current filters but overrides given keys.
function buildHref(current, overrides) {
  const sp = new URLSearchParams();
  const merged = { ...current, ...overrides };
  Object.entries(merged).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length) sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `/blogs?${qs}` : "/blogs";
}

export default async function BlogsPage({ searchParams }) {
  const sp = (await searchParams) || {};
  const category = (sp.category || "").trim();
  const search = (sp.search || "").trim();
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);

  const current = { category, search };

  let categories = [];
  let result = { data: [], total: 0, page: 1, totalPages: 1 };
  try {
    [categories, result] = await Promise.all([
      listBlogCategories(),
      listPublishedBlogs({ page, limit: PER_PAGE, category, search }),
    ]);
  } catch {
    // DB unreachable → render empty state instead of crashing the route.
  }

  const { data: blogs, total, totalPages } = result;
  const activeCat = categories.find(
    (c) => String(c.category_url) === category || String(c.id) === category
  );

  return (
    <div className="bg-[#f7f5fb] min-h-screen">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <header className="relative overflow-hidden bg-gradient-to-br from-[#2a0a52] via-[#5b13a8] to-[#7c3aed] text-white">
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #fff 0, transparent 38%), radial-gradient(circle at 80% 70%, #fff 0, transparent 32%)",
          }}
        />
        <div className="relative common-spacing !py-14 md:!py-20 max-w-6xl mx-auto">
          <span className="inline-block text-xs font-bold tracking-[0.18em] uppercase text-purple-200/90">
            Mr. Service Expert Blog
          </span>
          <h1 className="mt-3 text-3xl md:text-5xl font-extrabold leading-[1.1] max-w-3xl">
            {activeCat ? activeCat.name : "Care tips, repair guides & service know-how"}
          </h1>
          <p className="mt-4 text-purple-100/90 text-base md:text-lg max-w-2xl">
            {activeCat
              ? `Articles in ${activeCat.name}.`
              : "Honest, practical advice to keep your appliances running longer — straight from the technicians who fix them every day."}
          </p>

          {/* Search */}
          <form action="/blogs" method="GET" className="mt-7 max-w-lg">
            {category && <input type="hidden" name="category" value={category} />}
            <div className="flex items-center gap-2 bg-white rounded-full p-1.5 pl-5 shadow-lg shadow-purple-900/30">
              <Search size={18} className="text-purple-500 shrink-0" />
              <input
                name="search"
                defaultValue={search}
                placeholder="Search articles…"
                className="flex-1 bg-transparent text-gray-800 text-sm outline-none placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="bg-[#6e11b0] hover:bg-[#5b0f93] transition text-white text-sm font-semibold px-5 py-2.5 rounded-full"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </header>

      {/* ── Body ─────────────────────────────────────────────── */}
      <div className="common-spacing !py-10 max-w-7xl mx-auto">
        <div className="flex flex-col-reverse lg:flex-row gap-8 items-start">
          {/* Main column */}
          <main className="w-full lg:w-2/3">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-800">
                {search
                  ? `Results for “${search}”`
                  : activeCat
                  ? activeCat.name
                  : "Latest articles"}
              </h2>
              <span className="text-sm text-gray-400">
                {total} {total === 1 ? "post" : "posts"}
              </span>
            </div>

            {blogs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 px-6 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center text-purple-400 mb-4">
                  <FileText size={26} />
                </div>
                <p className="font-semibold text-gray-700">No articles found</p>
                <p className="text-sm text-gray-400 mt-1">
                  Try a different search, or browse another category.
                </p>
                {(search || category) && (
                  <Link
                    href="/blogs"
                    className="inline-block mt-5 text-sm font-semibold text-[#6e11b0] hover:underline"
                  >
                    Clear filters
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {blogs.map((blog) => (
                  <Link
                    key={blog.id}
                    href={`/blogs/${blog.blog_url}`}
                    className="group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-purple-100 hover:-translate-y-1 transition-all duration-300 flex flex-col"
                  >
                    <div className="relative h-44 w-full overflow-hidden bg-purple-50">
                      <img
                        src={imgSrc(blog.image)}
                        alt={blog.title}
                        loading="lazy"
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {blog.category_name && (
                        <span className="absolute top-3 left-3 bg-white/95 backdrop-blur text-[#6e11b0] text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shadow-sm">
                          {blog.category_name}
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-900 leading-snug line-clamp-2 group-hover:text-[#6e11b0] transition">
                        {blog.title}
                      </h3>
                      {blog.excerpt && (
                        <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                          {blog.excerpt}
                        </p>
                      )}
                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400 mt-auto">
                        <span className="flex items-center gap-1.5 truncate">
                          <User size={13} className="text-purple-400 shrink-0" />
                          <span className="truncate">{blog.author}</span>
                        </span>
                        {blog.date && (
                          <span className="flex items-center gap-1.5 shrink-0">
                            <Calendar size={13} className="text-purple-400" />
                            {formatDate(blog.date)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <nav className="mt-10 flex items-center justify-center gap-1.5">
                <PageLink
                  disabled={page <= 1}
                  href={buildHref(current, { page: page - 1 })}
                  label="Prev"
                />
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((n) => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
                  .map((n, idx, arr) => (
                    <span key={n} className="flex items-center">
                      {idx > 0 && n - arr[idx - 1] > 1 && (
                        <span className="px-1.5 text-gray-300">…</span>
                      )}
                      <Link
                        href={buildHref(current, { page: n })}
                        className={`min-w-9 h-9 px-3 inline-flex items-center justify-center rounded-lg text-sm font-semibold transition ${
                          n === page
                            ? "bg-[#6e11b0] text-white shadow-md shadow-purple-200"
                            : "bg-white text-gray-600 border border-gray-200 hover:border-purple-300 hover:text-[#6e11b0]"
                        }`}
                      >
                        {n}
                      </Link>
                    </span>
                  ))}
                <PageLink
                  disabled={page >= totalPages}
                  href={buildHref(current, { page: page + 1 })}
                  label="Next"
                />
              </nav>
            )}
          </main>

          {/* Sidebar */}
          <aside className="w-full lg:w-1/3 lg:sticky lg:top-6 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h2 className="flex items-center gap-2 font-bold text-gray-800 mb-4">
                <Layers size={18} className="text-[#6e11b0]" /> Categories
              </h2>
              <ul className="space-y-1.5">
                <li>
                  <Link
                    href={buildHref({ search }, { category: "" })}
                    className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                      !category
                        ? "bg-purple-50 text-[#6e11b0] font-semibold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-gray-600">All articles</span>
                    <ArrowRight size={15} className="opacity-50" />
                  </Link>
                </li>
                {categories.map((c) => {
                  const on =
                    String(c.category_url) === category || String(c.id) === category;
                  return (
                    <li key={c.id}>
                      <Link
                        href={buildHref(
                          { search },
                          { category: c.category_url || c.id }
                        )}
                        className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                          on
                            ? "bg-purple-50 text-[#6e11b0] font-semibold"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <span className="text-gray-600">{c.name}</span>
                        <span
                          className={`ml-2 shrink-0 text-xs px-2 py-0.5 rounded-full ${
                            on ? "bg-[#6e11b0] text-white" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {c.blog_count ?? 0}
                        </span>
                      </Link>
                    </li>
                  );
                })}
                {categories.length === 0 && (
                  <li className="text-sm text-gray-400 px-3 py-2">No categories yet.</li>
                )}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#6e11b0] to-[#8429d8] rounded-2xl p-6 text-white shadow-lg shadow-purple-200">
              <h3 className="font-bold text-lg">Appliance acting up?</h3>
              <p className="text-sm text-purple-100 mt-1.5">
                Book a trusted technician near you in minutes.
              </p>
              <Link
                href="/booking"
                className="mt-4 inline-flex items-center gap-1.5 bg-white text-gray-600 hover:text-[#6e11b0] text-sm font-bold px-4 py-2.5 rounded-full hover:gap-2.5 transition-all"
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

function PageLink({ href, label, disabled }) {
  if (disabled) {
    return (
      <span className="h-9 px-3 inline-flex items-center rounded-lg text-sm font-semibold text-gray-300 bg-gray-50 border border-gray-100 cursor-not-allowed">
        {label}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="h-9 px-3 inline-flex items-center rounded-lg text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:border-purple-300 hover:text-[#6e11b0] transition"
    >
      {label}
    </Link>
  );
}
