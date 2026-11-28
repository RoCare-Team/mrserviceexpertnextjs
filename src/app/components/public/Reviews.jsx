import { Star, Quote, BadgeCheck } from "lucide-react";
import { SectionHeader, SITE } from "./ui";

/**
 * Review cards. Used by the homepage testimonials (static list) and by the
 * service pages (admin-managed, per URL — lib/pageReviews.js).
 * reviews: [{ name, city?, service?, rating, text, date? }]
 */
export function ReviewCards({ reviews = [], title, subtitle, eyebrow, id = "reviews" }) {
  if (!reviews.length) return null;
  const avg = averageRating(reviews);
  return (
    <section id={id} aria-labelledby={`${id}-h`}>
      <SectionHeader
        id={`${id}-h`}
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        action={
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-[13px] font-bold text-amber-800 ring-1 ring-amber-200">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
            {avg} / 5 · {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </span>
        }
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r, i) => (
          <li key={i} className="flex flex-col rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-sm)]">
            <div className="flex items-center justify-between gap-2">
              <span className="flex gap-0.5" aria-label={`Rated ${r.rating} out of 5`}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} aria-hidden="true" />
                ))}
              </span>
              <Quote className="h-5 w-5 text-purple-200" aria-hidden="true" />
            </div>
            <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-[var(--ink-soft)]">{r.text}</p>
            <div className="mt-4 flex items-center gap-3 border-t border-[var(--line)] pt-3">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[14px] font-bold text-purple-800" aria-hidden="true">
                {initials(r.name)}
              </span>
              <span className="min-w-0 leading-tight">
                <b className="flex items-center gap-1 truncate text-[14px] text-[var(--ink)]">
                  {r.name} <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-green-600" aria-hidden="true" />
                </b>
                <span className="block truncate text-[12px] text-[var(--muted)]">
                  {[r.service, r.city, formatDate(r.date)].filter(Boolean).join(" · ")}
                </span>
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Product + AggregateRating + Review JSON-LD built only from the reviews shown
 * on the page, so the stars Google reads match what visitors see.
 */
export function reviewSchema({ reviews = [], name, path, description }) {
  if (!reviews.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    ...(description ? { description } : {}),
    url: `${SITE}/${String(path || "").replace(/^\//, "")}`,
    image: `${SITE}/assets/images/serviceLogo.webp`,
    brand: { "@type": "Brand", name: "Mr Service Expert" },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: averageRating(reviews),
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.slice(0, 10).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.name },
      ...(r.date ? { datePublished: r.date } : {}),
      reviewBody: r.text,
      reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
    })),
  };
}

/** Drop the old fixed rating from a page's schemas once it has its own reviews. */
export function withoutFixedRatings(schemas) {
  return schemas.map((s) => {
    if (!s || typeof s !== "object") return s;
    // eslint-disable-next-line no-unused-vars
    const { aggregateRating, review, ...rest } = s;
    return rest;
  });
}

function averageRating(reviews) {
  const sum = reviews.reduce((t, r) => t + (Number(r.rating) || 0), 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "?";
}

function formatDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt) ? "" : dt.toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}
