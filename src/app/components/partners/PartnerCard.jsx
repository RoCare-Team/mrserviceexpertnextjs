import Link from "next/link";
import { MapPin, Clock, Phone, MessageCircle, Briefcase, Store } from "lucide-react";
import { TrustBadges } from "./ui";
import { BUSINESS_TYPES } from "@/lib/partners/validation";

/** One partner in a listing. Works in server and client trees (no hooks). */
export default function PartnerCard({ partner: p }) {
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
          <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-[var(--muted)]">
            {BUSINESS_TYPES[p.business_type] && <span>{BUSINESS_TYPES[p.business_type]}</span>}
            {p.experience_years ? (
              <span className="inline-flex items-center gap-1">
                <Briefcase className="h-3 w-3" aria-hidden="true" /> {p.experience_years}+ yrs
              </span>
            ) : null}
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
        {p.contact?.call && (
          <a href={`tel:+91${p.contact.phone}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 text-sm font-semibold text-white hover:bg-purple-700">
            <Phone className="h-4 w-4" aria-hidden="true" /> Call
          </a>
        )}
        {p.contact?.whatsapp && (
          <a
            href={`https://wa.me/91${p.contact.phone}`}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" /> WhatsApp
          </a>
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
