import Link from "next/link";
import { ArrowRight, Calendar } from "lucide-react";
import { listPublishedBlogs } from "@/lib/blogs";
import { SectionHeader } from "./ui";

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
  return isNaN(dt) ? "" : dt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}

/** The newest published blogs as cards. Renders nothing if there are none or the DB is unreachable. */
export default async function LatestBlogs({ limit = 3, title = "Latest insights", subtitle = "Tips, guides and know-how from our appliance experts" }) {
  let blogs = [];
  try {
    blogs = (await listPublishedBlogs({ page: 1, limit })).data || [];
  } catch (err) {
    console.error("[latest-blogs]", err?.message);
  }
  if (!blogs.length) return null;

  return (
    <section aria-labelledby="latest-blogs-h">
      <SectionHeader
        id="latest-blogs-h"
        eyebrow="From our blog"
        title={title}
        subtitle={subtitle}
        action={
          <Link href="/blogs" className="inline-flex items-center gap-1 text-[14px] font-semibold text-purple-700 hover:text-purple-900">
            View all blogs <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {blogs.map((b) => (
          <li key={b.id}>
            <Link href={`/blogs/${b.blog_url}`} className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-sm)] transition hover:shadow-[var(--shadow-md)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imgSrc(b.image)} alt={b.title} loading="lazy" className="aspect-[16/9] w-full object-cover" />
              <div className="flex flex-1 flex-col p-4">
                {b.category_name && <span className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-700">{b.category_name}</span>}
                <h3 className="line-clamp-2 text-[16px] font-bold leading-snug text-[var(--ink)] group-hover:text-purple-800">{b.title}</h3>
                {b.excerpt && <p className="mt-1.5 line-clamp-2 text-[13.5px] text-[var(--muted)]">{b.excerpt}</p>}
                {b.date && (
                  <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[12px] text-[var(--muted)]">
                    <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> {formatDate(b.date)}
                  </span>
                )}
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
