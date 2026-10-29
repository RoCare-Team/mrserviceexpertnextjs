import Link from "next/link";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { MapPin, Clock, Briefcase, Store, Star, Wrench, Tag, Share2, BadgeCheck, Camera, Images } from "lucide-react";
import { getPublicProfile } from "@/lib/partners/listing";
import { TrustBadges, CategoryIcon, cardCls } from "@/app/components/partners/ui";
import { BUSINESS_TYPES } from "@/lib/partners/validation";
import { getPublicReviews } from "@/lib/partners/reviews";
import { queuePartnerSeo } from "@/lib/partners/seo";
import BookNowButton from "@/app/components/partners/BookNowButton";
import ReviewForm from "@/app/components/partners/ReviewForm";
import ProfileNav from "@/app/components/partners/ProfileNav";

export const dynamic = "force-dynamic"; // status / listing changes apply immediately

const SITE = "https://www.mrserviceexpert.com";

// A profile is indexed once it carries real copy (AI overview or a written
// About) and at least one category with services.
const isIndexable = (p) =>
  ((p.seo_content || "").length >= 200 || (p.description || "").length >= 80) && p.categories.some((c) => c.services.length);

const whereOf = (p) => [p.locality, p.city_name].filter(Boolean).join(", ");

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getPublicProfile(slug);
  if (!p) return { title: "Partner not found | Mr. Service Expert", robots: "noindex, nofollow" };

  const where = whereOf(p);
  const cats = p.categories.map((c) => c.name).join(", ");
  const fallbackDesc = p.seo_content || p.description || `${p.business_name} provides ${cats} services${where ? ` in ${where}` : ""}.`;
  const image = p.shop_image_url || p.logo_url;
  return {
    title: p.meta_title || `${p.business_name}${where ? ` – ${where}` : ""} | Mr. Service Expert Partner`,
    description: (p.meta_description || fallbackDesc).replace(/\s+/g, " ").slice(0, 160),
    keywords: p.meta_keywords || undefined,
    alternates: { canonical: `${SITE}/partners/${p.slug}` },
    robots: isIndexable(p) ? "index, follow" : "noindex, follow",
    openGraph: {
      type: "profile",
      title: p.meta_title || p.business_name,
      description: (p.meta_description || fallbackDesc).slice(0, 200),
      url: `${SITE}/partners/${p.slug}`,
      ...(image ? { images: [image] } : {}),
    },
  };
}

const Paragraphs = ({ text, className = "" }) =>
  String(text || "")
    .split(/\n{2,}/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t, i) => (
      <p key={i} className={`whitespace-pre-line leading-relaxed text-[var(--body-text)] ${i ? "mt-3" : ""} ${className}`}>
        {t}
      </p>
    ));

function SectionCard({ id, title, icon: Icon, children, aside }) {
  return (
    <section id={id} className={`${cardCls} scroll-mt-[124px] rounded-3xl sm:scroll-mt-[132px]`} aria-labelledby={`${id}-h`}>
      <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-[var(--line)] pb-4">
        <h2 id={`${id}-h`} className="flex items-center gap-2.5 text-lg font-bold text-[var(--ink)] sm:text-xl">
          {Icon && (
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[0_6px_14px_-6px_rgba(98,41,205,.6)]">
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
          {title}
        </h2>
        {aside && <div className="ml-auto rounded-full bg-[var(--surface-soft)] px-3 py-1 text-xs font-medium text-[var(--muted)]">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

function Stat({ value, label, icon: Icon, tone = "purple", href }) {
  const tones = {
    purple: "bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[0_6px_14px_-6px_rgba(98,41,205,.6)]",
    amber: "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_6px_14px_-6px_rgba(224,137,0,.6)]",
    green: "bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_6px_14px_-6px_rgba(18,147,77,.6)]",
  };
  const Inner = (
    <>
      <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 leading-tight">
        <b className="block truncate text-xl font-extrabold tracking-tight text-[var(--ink)]">{value}</b>
        <span className="block truncate text-xs font-medium text-[var(--muted)]">{label}</span>
      </span>
    </>
  );
  return (
    <li className="min-w-0">
      {href ? (
        <a href={href} className="flex h-full items-center gap-3 px-4 py-4 transition hover:bg-white sm:px-5">{Inner}</a>
      ) : (
        <div className="flex h-full items-center gap-3 px-4 py-4 sm:px-5">{Inner}</div>
      )}
    </li>
  );
}

export default async function PartnerProfilePage({ params }) {
  const { slug } = await params;
  const p = await getPublicProfile(slug);
  if (!p) notFound();
  const reviews = await getPublicReviews(p.id);

  // Approved before this feature shipped (or generation failed): write the
  // copy in the background so the next visit — and the crawler — gets it.
  if (!p.seo_content) after(() => queuePartnerSeo(p.id));

  const where = whereOf(p);
  const photos = [p.shop_image_url, ...p.photos].filter(Boolean);
  const allBrands = [...new Set(p.categories.flatMap((c) => c.brands))];
  const url = `${SITE}/partners/${p.slug}`;
  const shareText = `${p.business_name}${where ? ` – ${where}` : ""} on Mr. Service Expert: ${url}`;

  const nav = [
    p.seo_content && { id: "overview", label: "Overview" },
    p.description && { id: "about", label: "About" },
    { id: "services", label: "Services & brands", count: p.categories.length },
    { id: "areas", label: "Service areas", count: p.coverage.length },
    photos.length > 0 && { id: "photos", label: "Photos", count: photos.length },
    { id: "reviews", label: "Reviews", count: reviews.count || null },
  ].filter(Boolean);

  // Only facts we actually hold.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${url}#business`,
      name: p.business_name,
      url,
      ...(p.seo_content || p.description ? { description: (p.meta_description || p.seo_content || p.description).slice(0, 300) } : {}),
      ...(p.logo_url ? { logo: p.logo_url } : {}),
      ...(photos.length ? { image: photos.slice(0, 4) } : {}),
      ...(p.operating_hours ? { openingHours: p.operating_hours } : {}),
      ...(allBrands.length ? { brand: allBrands.map((b) => ({ "@type": "Brand", name: b })) } : {}),
      ...(p.categories.length ? { knowsAbout: p.categories.map((c) => c.name) } : {}),
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
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE },
        { "@type": "ListItem", position: 2, name: "Partners", item: `${SITE}/join-as-partner` },
        { "@type": "ListItem", position: 3, name: p.business_name, item: url },
      ],
    },
  ];

  const bookBtn = p.is_available ? (
    <BookNowButton
      className="min-h-11 w-full px-5 text-base sm:w-auto"
      booking={{
        partner: { slug: p.slug, name: p.business_name },
        categories: p.bookable,
        defaultCategory: p.bookable[0]?.url,
        cityName: p.city_name,
      }}
    />
  ) : (
    <span className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gray-100 px-5 font-medium text-gray-500 sm:w-auto">Currently unavailable</span>
  );

  return (
    <main className="bg-[var(--bg)] px-4 pb-12 pt-5 sm:pt-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-5xl">
        <nav aria-label="Breadcrumb" className="mb-3 text-xs text-[var(--muted)]">
          <ol className="flex flex-wrap items-center gap-1">
            <li><Link href="/" className="hover:underline">Home</Link></li>
            <li aria-hidden="true">/</li>
            {p.coverage[0] && p.categories[0] && (
              <>
                <li><Link href={`/${p.coverage[0].city_url}/${p.categories[0].url}`} className="hover:underline">{p.categories[0].name} in {p.coverage[0].city_name}</Link></li>
                <li aria-hidden="true">/</li>
              </>
            )}
            <li className="text-[var(--ink-soft)]" aria-current="page">{p.business_name}</li>
          </ol>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <header className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-[var(--shadow-md)]">
          {/* Cover with identity overlaid — reads like a storefront, not a form */}
          <div className="relative h-52 sm:h-64">
            {p.shop_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.shop_image_url} alt={`${p.business_name} shop`} className="h-full w-full object-cover" width={1200} height={520} />
            ) : (
              <div className="h-full w-full" style={{ background: "var(--grad-ink)" }} aria-hidden="true">
                <div className="absolute -left-10 -top-16 h-56 w-56 rounded-full bg-purple-500/40 blur-3xl" />
                <div className="absolute -right-6 top-6 h-40 w-40 rounded-full bg-amber-400/30 blur-3xl" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#140B33]/95 via-[#140B33]/45 to-[#140B33]/5" aria-hidden="true" />

            {/* Status chips */}
            <div className="absolute right-3 top-3 flex flex-wrap justify-end gap-1.5 sm:right-5 sm:top-5">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur ${p.is_available ? "bg-emerald-500/90 text-white" : "bg-white/85 text-gray-700"}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${p.is_available ? "bg-white" : "bg-gray-400"}`} /> {p.is_available ? "Available for booking" : "Currently unavailable"}
              </span>
              {p.work_done && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-purple-800 backdrop-blur">
                  <Wrench className="h-3 w-3" aria-hidden="true" /> {p.work_done} jobs done
                </span>
              )}
            </div>

            {/* Identity */}
            <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-4 sm:gap-5 sm:p-6">
              <div className="flex h-[84px] w-[84px] shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-lg)] ring-4 ring-white/90 sm:h-[108px] sm:w-[108px]">
                {p.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logo_url} alt={`${p.business_name} logo`} width={108} height={108} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-purple-50"><Store className="h-10 w-10 text-purple-400" aria-hidden="true" /></span>
                )}
              </div>
              <div className="min-w-0 flex-1 pb-1 text-white">
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight drop-shadow-sm sm:text-[34px]">{p.business_name}</h1>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-white/85 sm:text-sm">
                  {BUSINESS_TYPES[p.business_type] && <span className="font-medium text-white">{BUSINESS_TYPES[p.business_type]}</span>}
                  {p.full_name && p.full_name !== p.business_name && <span>by {p.full_name}</span>}
                  {where && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {[p.locality, p.city_name].filter(Boolean).join(", ")}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Trust + actions */}
          <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {reviews.count > 0 && (
                  <a href="#reviews" className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 ring-1 ring-amber-200">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" /> {reviews.average.toFixed(1)}
                    <span className="font-medium text-amber-700/80">({reviews.count})</span>
                  </a>
                )}
                <TrustBadges verification={p.verification} />
              </div>
              <p className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[var(--muted)]">
                {p.operating_hours && (
                  <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4 text-purple-600" aria-hidden="true" /> {p.operating_hours}</span>
                )}
                {p.coverage.length > 0 && (
                  <a href="#areas" className="inline-flex items-center gap-1.5 hover:text-purple-700"><MapPin className="h-4 w-4 text-purple-600" aria-hidden="true" /> Serves {p.coverage.map((g) => g.city_name).slice(0, 3).join(", ")}{p.coverage.length > 3 ? ` +${p.coverage.length - 3}` : ""}</a>
                )}
              </p>
            </div>
            <div className="flex gap-2 lg:shrink-0">
              <div className="flex-1 lg:flex-none [&>*]:w-full [&>*]:shadow-[var(--shadow-cta)] lg:[&>*]:min-w-[170px]">{bookBtn}</div>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--line-strong)] bg-white px-4 text-sm font-semibold text-[var(--ink-soft)] transition hover:border-purple-300 hover:bg-purple-50"
              >
                <Share2 className="h-4 w-4" aria-hidden="true" /> Share
              </a>
            </div>
          </div>

          {/* Stats strip */}
          {(reviews.count > 0 || p.work_done || p.experience_years || allBrands.length > 0) && (
            <ul className="grid grid-cols-2 divide-y divide-[var(--line)] border-t border-[var(--line)] bg-[var(--surface-soft)] sm:grid-cols-4 sm:divide-y-0 sm:divide-x [&>li:nth-child(odd)]:border-r [&>li:nth-child(odd)]:border-[var(--line)] sm:[&>li:nth-child(odd)]:border-r-0">
              {reviews.count > 0 && <Stat href="#reviews" icon={Star} tone="amber" value={`${reviews.average.toFixed(1)} / 5`} label={`${reviews.count} customer review${reviews.count === 1 ? "" : "s"}`} />}
              {p.work_done && <Stat icon={Wrench} tone="green" value={`${p.work_done} jobs`} label="completed via Mr. Service Expert" />}
              {p.experience_years ? <Stat icon={Briefcase} value={`${p.experience_years}+ years`} label="of experience" /> : null}
              {allBrands.length > 0 && <Stat href="#services" icon={Tag} value={`${allBrands.length} brand${allBrands.length === 1 ? "" : "s"}`} label="serviced" />}
            </ul>
          )}
        </header>

        {/* Direct child of the page container on purpose: a sticky element only
            sticks inside its parent's box, so a wrapper div would release it
            as soon as the user scrolled past the wrapper. */}
        <ProfileNav items={nav} />

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            {p.seo_content && (
              <SectionCard id="overview" title={`${p.business_name} at a glance`} icon={BadgeCheck}>
                <Paragraphs text={p.seo_content} />
              </SectionCard>
            )}

            {p.description && (
              <SectionCard id="about" title={`About ${p.business_name}`} icon={Store}>
                <Paragraphs text={p.description} />
              </SectionCard>
            )}

            <SectionCard id="services" title="Services & brands" icon={Wrench} aside={`${p.categories.length} categor${p.categories.length === 1 ? "y" : "ies"}`}>
              <ul className="grid gap-3 sm:grid-cols-2">
                {p.categories.map((c) => (
                  <li key={c.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] p-4">
                    <h3 className="flex items-center gap-2 font-semibold text-[var(--ink)]">
                      <CategoryIcon url={c.url} className="h-5 w-5 text-purple-600" /> {c.name}
                    </h3>
                    {c.services.length > 0 && (
                      <ul className="mt-2.5 flex flex-wrap gap-1.5" aria-label={`${c.name} services`}>
                        {c.services.map((s) => (
                          <li key={s} className="rounded-full bg-purple-50 px-3 py-1 text-sm text-purple-800">{s}</li>
                        ))}
                      </ul>
                    )}
                    {c.brands.length > 0 && (
                      <>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Brands</p>
                        <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label={`${c.name} brands`}>
                          {c.brands.map((b) => (
                            <li key={b} className="rounded-full border border-[var(--line-strong)] bg-white px-2.5 py-0.5 text-xs font-medium text-[var(--ink-soft)]">{b}</li>
                          ))}
                        </ul>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </SectionCard>

            <SectionCard id="areas" title="Service areas" icon={MapPin}>
              <ul className="space-y-4">
                {p.coverage.map((g) => (
                  <li key={g.city_id} className="text-sm">
                    <p className="font-semibold text-[var(--ink)]">
                      {g.city_name}
                      {g.city_wide && <span className="ml-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">entire city</span>}
                    </p>
                    {g.localities.length > 0 && (
                      <ul className="mt-1.5 flex flex-wrap gap-1.5">
                        {g.localities.map((l) => (
                          <li key={l.url} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-[var(--ink-soft)]">{l.name}</li>
                        ))}
                      </ul>
                    )}
                    {/* Existing /{city}/{category} pages (rendered for every city_tb × category_tb pair). */}
                    <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                      {p.categories.map((c) => (
                        <Link key={c.id} href={`/${g.city_url}/${c.url}`} className="text-purple-700 underline">
                          {c.name} in {g.city_name}
                        </Link>
                      ))}
                    </p>
                  </li>
                ))}
              </ul>
            </SectionCard>

            {photos.length > 0 && (
              <SectionCard id="photos" title="Photos" icon={Images} aside={`${photos.length} photo${photos.length === 1 ? "" : "s"}`}>
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map((src, i) => (
                    <li key={src} className={i === 0 ? "col-span-2 sm:col-span-3" : ""}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`${p.business_name} photo ${i + 1}`}
                        loading="lazy"
                        width={i === 0 ? 800 : 400}
                        height={i === 0 ? 450 : 300}
                        className={`w-full rounded-2xl object-cover ${i === 0 ? "aspect-video" : "aspect-[4/3]"}`}
                      />
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}

            <SectionCard
              id="reviews"
              title="Customer reviews"
              icon={Star}
              aside={reviews.count > 0 ? `${reviews.average.toFixed(1)} ★ · ${reviews.count} review${reviews.count === 1 ? "" : "s"}` : null}
            >
              <ReviewForm partnerSlug={p.slug} partnerName={p.business_name} />
              {reviews.count === 0 && <p className="mt-4 text-sm text-[var(--muted)]">No reviews yet. Be the first to share your experience.</p>}
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
                    {r.reply && (
                      <div className="mt-2 rounded-xl bg-purple-50/70 px-3 py-2 text-sm">
                        <b className="text-purple-800">Reply from {p.business_name}:</b>{" "}
                        <span className="whitespace-pre-line text-[var(--body-text)]">{r.reply}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </SectionCard>
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────── */}
          <aside className="space-y-4 lg:sticky lg:top-[124px] lg:self-start">
            <div className="overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-sm">
              <div className="px-5 pb-4 pt-5 text-white" style={{ background: "var(--grad-brand)" }}>
                <p className="text-base font-bold">Book {p.business_name}</p>
                <p className="mt-1 text-sm text-white/85">Confirmed technician visit, booked through Mr. Service Expert.</p>
              </div>
              <div className="p-5">
              <div className="[&>*]:w-full">{bookBtn}</div>
              <dl className="mt-4 space-y-2 text-sm">
                {where && (
                  <div className="flex gap-2"><dt className="shrink-0 text-[var(--muted)]"><MapPin className="h-4 w-4" aria-hidden="true" /></dt><dd>{[p.locality, p.city_name].filter(Boolean).join(", ")}</dd></div>
                )}
                {p.operating_hours && (
                  <div className="flex gap-2"><dt className="shrink-0 text-[var(--muted)]"><Clock className="h-4 w-4" aria-hidden="true" /></dt><dd>{p.operating_hours}</dd></div>
                )}
                {p.experience_years ? (
                  <div className="flex gap-2"><dt className="shrink-0 text-[var(--muted)]"><Briefcase className="h-4 w-4" aria-hidden="true" /></dt><dd>{p.experience_years}+ years experience</dd></div>
                ) : null}
                {p.work_done && (
                  <div className="flex gap-2"><dt className="shrink-0 text-[var(--muted)]"><Wrench className="h-4 w-4" aria-hidden="true" /></dt><dd>{p.work_done} jobs completed</dd></div>
                )}
                {photos.length > 0 && (
                  <div className="flex gap-2"><dt className="shrink-0 text-[var(--muted)]"><Camera className="h-4 w-4" aria-hidden="true" /></dt><dd><a href="#photos" className="underline">{photos.length} photo{photos.length === 1 ? "" : "s"}</a></dd></div>
                )}
              </dl>
              </div>
            </div>
            {allBrands.length > 0 && (
              <div className={`${cardCls} rounded-3xl`}>
                <p className="text-sm font-semibold text-[var(--ink)]">Brands serviced</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {allBrands.map((b) => (
                    <li key={b} className="rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--ink-soft)]">{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--muted)]">
          {p.business_name} is an independent business listed on Mr. Service Expert. Badges show only what our team has checked.
        </p>
      </div>
    </main>
  );
}
