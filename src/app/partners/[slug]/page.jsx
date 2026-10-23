import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Clock, Briefcase, Store, Star } from "lucide-react";
import { getPublicProfile } from "@/lib/partners/listing";
import { TrustBadges, CategoryIcon, cardCls } from "@/app/components/partners/ui";
import { BUSINESS_TYPES } from "@/lib/partners/validation";
import { getPublicReviews } from "@/lib/partners/reviews";
import BookNowButton from "@/app/components/partners/BookNowButton";
import ReviewForm from "@/app/components/partners/ReviewForm";

export const dynamic = "force-dynamic"; // status / listing changes apply immediately

const SITE = "https://www.mrserviceexpert.com";

// Thin profiles stay out of the index until they have real content.
const isIndexable = (p) => (p.description || "").length >= 80 && p.categories.some((c) => c.services.length);

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getPublicProfile(slug);
  if (!p) return { title: "Partner not found | Mr. Service Expert", robots: "noindex, nofollow" };

  const where = [p.locality, p.city_name].filter(Boolean).join(", ");
  const cats = p.categories.map((c) => c.name).join(", ");
  return {
    title: `${p.business_name}${where ? ` – ${where}` : ""} | Mr. Service Expert Partner`,
    description: (p.description || `${p.business_name} provides ${cats} services${where ? ` in ${where}` : ""}.`).slice(0, 160),
    alternates: { canonical: `${SITE}/partners/${p.slug}` },
    robots: isIndexable(p) ? "index, follow" : "noindex, follow",
    openGraph: p.shop_image_url || p.logo_url ? { images: [p.shop_image_url || p.logo_url] } : undefined,
  };
}

export default async function PartnerProfilePage({ params }) {
  const { slug } = await params;
  const p = await getPublicProfile(slug);
  if (!p) notFound();
  const reviews = await getPublicReviews(p.id);

  // Only facts we actually hold — no ratings or reviews.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: p.business_name,
    url: `${SITE}/partners/${p.slug}`,
    ...(p.description ? { description: p.description } : {}),
    ...(p.logo_url ? { logo: p.logo_url } : {}),
    ...(p.shop_image_url ? { image: p.shop_image_url } : {}),
    ...(reviews.count
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: reviews.average, reviewCount: reviews.count, bestRating: 5, worstRating: 1 } }
      : {}),
    address: {
      "@type": "PostalAddress",
      ...(p.locality ? { streetAddress: p.locality } : {}),
      ...(p.city_name ? { addressLocality: p.city_name } : {}),
      ...(p.state_name ? { addressRegion: p.state_name } : {}),
      addressCountry: "IN",
    },
    areaServed: p.coverage.map((g) => ({ "@type": "City", name: g.city_name })),
  };

  return (
    <main className="bg-[var(--bg)] px-4 py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-4xl space-y-5">
        <section className={cardCls}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-purple-50">
              {p.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.logo_url} alt={`${p.business_name} logo`} width={80} height={80} className="h-full w-full object-cover" />
              ) : (
                <Store className="h-8 w-8 text-purple-400" aria-hidden="true" />
              )}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-[var(--ink)] sm:text-3xl">{p.business_name}</h1>
              <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
                {BUSINESS_TYPES[p.business_type] && <span>{BUSINESS_TYPES[p.business_type]}</span>}
                {(p.locality || p.city_name) && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {[p.locality, p.city_name, p.state_name].filter(Boolean).join(", ")}
                  </span>
                )}
                {p.experience_years ? (
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {p.experience_years}+ years experience</span>
                ) : null}
                {p.operating_hours && (
                  <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {p.operating_hours}</span>
                )}
              </p>
              <div className="mt-3">
                <TrustBadges verification={p.verification} />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <BookNowButton
              className="min-h-11 px-5 text-base"
              booking={{
                partner: { slug: p.slug, name: p.business_name },
                categories: p.bookable,
                defaultCategory: p.bookable[0]?.url,
                cityName: p.city_name,
              }}
            />
            {reviews.count > 0 && (
              <a href="#reviews" className="inline-flex items-center gap-1 text-sm text-[var(--ink-soft)]">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> <b>{reviews.average.toFixed(1)}</b>
                <span className="text-[var(--muted)]">({reviews.count} review{reviews.count === 1 ? "" : "s"})</span>
              </a>
            )}
          </div>

          {p.description && <p className="mt-5 whitespace-pre-line leading-relaxed text-[var(--body-text)]">{p.description}</p>}

          {p.shop_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.shop_image_url}
              alt={`${p.business_name} shop`}
              loading="lazy"
              width={800}
              height={450}
              className="mt-5 aspect-video w-full rounded-2xl object-cover"
            />
          )}
        </section>

        <section className={cardCls}>
          <h2 className="mb-4 text-xl font-bold text-[var(--ink)]">Services & brands</h2>
          <ul className="space-y-4">
            {p.categories.map((c) => (
              <li key={c.id}>
                <h3 className="flex items-center gap-2 font-semibold text-[var(--ink)]">
                  <CategoryIcon url={c.url} className="h-5 w-5 text-purple-600" /> {c.name}
                </h3>
                {c.services.length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {c.services.map((s) => (
                      <li key={s} className="rounded-full bg-purple-50 px-3 py-1 text-sm text-purple-800">{s}</li>
                    ))}
                  </ul>
                )}
                {c.brands.length > 0 && <p className="mt-2 text-sm text-[var(--muted)]">Brands: {c.brands.join(", ")}</p>}
              </li>
            ))}
          </ul>
        </section>

        <section className={cardCls}>
          <h2 className="mb-4 text-xl font-bold text-[var(--ink)]">Service areas</h2>
          <ul className="space-y-3">
            {p.coverage.map((g) => (
              <li key={g.city_id} className="text-sm">
                <p className="font-semibold text-[var(--ink)]">
                  <MapPin className="mr-1 inline h-4 w-4 text-purple-600" />
                  {g.city_name}
                  {g.city_wide && <span className="ml-1 font-normal text-[var(--muted)]">(entire city)</span>}
                </p>
                {g.localities.length > 0 && <p className="ml-5 text-[var(--muted)]">{g.localities.map((l) => l.name).join(", ")}</p>}
                {/* Existing /{city}/{category} pages (rendered for every city_tb × category_tb pair). */}
                <p className="ml-5 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  {p.categories.map((c) => (
                    <Link key={c.id} href={`/${g.city_url}/${c.url}`} className="text-purple-700 underline">
                      {c.name} in {g.city_name}
                    </Link>
                  ))}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section id="reviews" className={cardCls} aria-labelledby="reviews-h">
          <h2 id="reviews-h" className="mb-4 text-xl font-bold text-[var(--ink)]">
            Customer reviews
            {reviews.count > 0 && (
              <span className="ml-2 text-base font-normal text-[var(--muted)]">
                {reviews.average.toFixed(1)} ★ · {reviews.count}
              </span>
            )}
          </h2>
          <ReviewForm partnerSlug={p.slug} partnerName={p.business_name} />
          {reviews.count === 0 && <p className="mt-4 text-sm text-[var(--muted)]">No reviews yet.</p>}
          <ul className="mt-4 divide-y divide-[var(--line)]">
            {reviews.items.map((r) => (
              <li key={r.id} className="py-3">
                <p className="flex items-center gap-2 text-sm">
                  <span className="flex" aria-label={`${r.rating} out of 5 stars`}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} aria-hidden="true" />
                    ))}
                  </span>
                  <b className="text-[var(--ink-soft)]">{r.author}</b>
                  <span className="text-xs text-[var(--muted)]">
                    {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {r.edited ? " · edited" : ""}
                  </span>
                </p>
                {r.comment && <p className="mt-1 whitespace-pre-line text-sm text-[var(--body-text)]">{r.comment}</p>}
              </li>
            ))}
          </ul>
        </section>

        <p className="text-center text-xs text-[var(--muted)]">
          {p.business_name} is an independent business listed on Mr. Service Expert. Badges show only what our team has checked.
        </p>
      </div>
    </main>
  );
}
