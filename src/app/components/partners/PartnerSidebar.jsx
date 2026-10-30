import Link from "next/link";
import { Store, Star, MapPin, Wrench, Users, ArrowRight } from "lucide-react";
import BookNowButton from "./BookNowButton";
import { TrustBadges } from "./ui";

export const SIDEBAR_MAX = 4;

/**
 * Compact partner list for the sticky 1/3 column of a service page.
 * `data` comes from getPagePartners(); renders nothing without partners.
 * When there are more than SIDEBAR_MAX, links to the full grid (#partners).
 */
export default function PartnerSidebar({ data }) {
  if (!data?.first?.total) return null;
  const { first, bookingContext, cityName, categoryName } = data;
  const items = first.items.slice(0, SIDEBAR_MAX);
  const more = first.total - items.length;

  return (
    <section aria-labelledby="partners-side-h" className="rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-3 border-b border-[var(--line)] px-4 py-3.5">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[0_6px_14px_-6px_rgba(98,41,205,.6)]">
          <Users className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="partners-side-h" className="truncate text-[15px] font-bold text-[var(--ink)]">
            Service partners in {cityName}
          </h2>
          <p className="truncate text-xs text-[var(--muted)]">
            {first.total} approved {categoryName} expert{first.total === 1 ? "" : "s"} near you
          </p>
        </div>
      </div>

      <ul className="divide-y divide-[var(--line)]">
        {items.map((p) => (
          <li key={p.slug} className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--line)] bg-purple-50">
                {p.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.logo_url} alt="" width={48} height={48} loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <Store className="h-5 w-5 text-purple-400" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[15px] font-bold leading-snug text-[var(--ink)]">
                  <Link href={`/partners/${p.slug}`} className="hover:text-purple-700">
                    {p.business_name}
                  </Link>
                </h3>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs text-[var(--muted)]">
                  {p.rating?.count > 0 && (
                    <span className="inline-flex items-center gap-1 font-semibold text-[var(--ink-soft)]">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                      {p.rating.average.toFixed(1)} <span className="font-normal text-[var(--muted)]">({p.rating.count})</span>
                    </span>
                  )}
                  {p.work_done && (
                    <span className="inline-flex items-center gap-1 font-semibold text-purple-700" title="Jobs completed through Mr. Service Expert">
                      <Wrench className="h-3 w-3" aria-hidden="true" /> {p.work_done} jobs
                    </span>
                  )}
                  {p.experience_years ? <span>{p.experience_years}+ yrs</span> : null}
                </p>
                {p.areas?.length > 0 && (
                  <p className="mt-1 flex items-start gap-1 text-xs text-[var(--muted)]">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
                    <span className="line-clamp-1">{p.areas.join(", ")}</span>
                  </p>
                )}
              </div>
            </div>
            <div className="mt-2.5">
              <TrustBadges verification={{ mobile: true, identity: p.identity_verified, gst: p.gst_verified }} compact />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {p.is_available === false ? (
                <span className="inline-flex min-h-9 items-center rounded-lg bg-gray-100 px-3 text-xs font-medium text-gray-500">Currently unavailable</span>
              ) : (
                <BookNowButton
                  className="!min-h-9 !px-3.5 !text-[13px]"
                  booking={bookingContext ? { ...bookingContext, partner: { slug: p.slug, name: p.business_name } } : null}
                />
              )}
              <Link
                href={`/partners/${p.slug}`}
                className="inline-flex min-h-9 items-center rounded-lg border border-[var(--line-strong)] px-3.5 text-[13px] font-semibold text-[var(--ink-soft)] hover:bg-purple-50"
              >
                View profile
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--line)] px-4 py-3">
        {more > 0 ? (
          <a href="#partners" className="inline-flex items-center gap-1 text-[13px] font-semibold text-purple-700 hover:underline">
            See all {first.total} partners <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        ) : (
          <span />
        )}
        <Link href="/join-as-partner" className="text-xs font-medium text-[var(--muted)] hover:text-purple-700">
          Are you a technician? Join
        </Link>
      </div>
    </section>
  );
}
