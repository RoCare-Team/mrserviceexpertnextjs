import Link from "next/link";
import { MapPin, Clock, Briefcase, Store, Star, Wrench } from "lucide-react";
import BookNowButton from "./BookNowButton";
import { TrustBadges } from "./ui";
import { BUSINESS_TYPES } from "@/lib/partners/validation";

/**
 * One partner in a listing. Works in server and client trees (no hooks).
 * bookingContext: { categories, defaultCategory, brandName, cityName } from the page.
 */
export default function PartnerCard({ partner: p, bookingContext }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-[var(--line)] bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-purple-50">
          {p.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.logo_url} alt="" width={56} height={56} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <Store className="h-6 w-6 text-purple-400" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-snug text-[var(--ink)]">
            <Link href={`/partners/${p.slug}`} className="hover:text-purple-700">
              {p.business_name}
            </Link>
          </h3>
          {p.rating?.count > 0 && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-[var(--ink-soft)]">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
              <b>{p.rating.average.toFixed(1)}</b>
              <span className="text-[var(--muted)]">({p.rating.count} review{p.rating.count === 1 ? "" : "s"})</span>
            </p>
          )}
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-[var(--muted)]">
            {BUSINESS_TYPES[p.business_type] && <span>{BUSINESS_TYPES[p.business_type]}</span>}
            {p.experience_years ? (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3 w-3" aria-hidden="true" /> {p.experience_years}+ yrs
              </span>
            ) : null}
            {p.work_done && (
              <span className="inline-flex items-center gap-1 font-semibold text-purple-700" title="Jobs completed through Mr. Service Expert">
                <Wrench className="h-3 w-3" aria-hidden="true" /> {p.work_done} jobs done
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <TrustBadges verification={{ mobile: true, identity: p.identity_verified, gst: p.gst_verified }} compact />
      </div>

      {p.services.length > 0 && (
        <p className="mt-3 text-sm text-[var(--body-text)]">
          <span className="font-medium text-[var(--ink-soft)]">Services: </span>
          {p.services.join(", ")}
        </p>
      )}
      {p.brands?.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1" aria-label="Brands serviced">
          {p.brands.slice(0, 6).map((b) => (
            <li key={b} className="rounded-full border border-[var(--line)] bg-[var(--surface-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink-soft)]">{b}</li>
          ))}
          {p.brands.length > 6 && <li className="px-1 py-0.5 text-[11px] text-[var(--muted)]">+{p.brands.length - 6} more</li>}
        </ul>
      )}
      {p.areas.length > 0 && (
        <p className="mt-1.5 flex items-start gap-1 text-sm text-[var(--muted)]">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {p.areas.join(", ")}
        </p>
      )}
      {p.operating_hours && (
        <p className="mt-1 flex items-center gap-1 text-sm text-[var(--muted)]">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {p.operating_hours}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {p.is_available === false ? (
          <span className="inline-flex min-h-10 items-center rounded-xl bg-gray-100 px-3.5 text-sm font-medium text-gray-500">Currently unavailable</span>
        ) : (
          <BookNowButton booking={bookingContext ? { ...bookingContext, partner: { slug: p.slug, name: p.business_name } } : null} />
        )}
        <Link
          href={`/partners/${p.slug}`}
          className="inline-flex min-h-10 items-center rounded-xl border border-[var(--line-strong)] px-3.5 text-sm font-semibold text-[var(--ink-soft)] hover:bg-purple-50"
        >
          View profile
        </Link>
      </div>
    </article>
  );
}
