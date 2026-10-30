import React from "react";
import { MapPin, Clock, Phone, Navigation, Store } from "lucide-react";
import { SectionHeader } from "@/app/components/public/ui";

/**
 * Store locator section for a city (or city + category) page.
 * Renders the physical Mr Service Expert branches linked to this city
 * (stores, populated by getStoresByCityId in lib/storeLocatorData.js).
 * Pass `category` on a city/category page to make the heading category-aware.
 */
const StoreLocator = ({ stores = [], city = "", category = "" }) => {
  if (!stores || stores.length === 0) return null;

  return (
    <section aria-labelledby="stores-h">
      <SectionHeader
        id="stores-h"
        eyebrow="Visit us"
        title={`Mr. Service Expert ${category ? `${category} ` : ""}store${stores.length > 1 ? "s" : ""} in ${city}`}
        subtitle="Walk in for a quick check-up, spare parts or to book a technician visit."
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((s) => {
          const mapsQuery = encodeURIComponent(`${s.business_name}, ${s.address}`);
          const telHref = `tel:${(s.phone || "").replace(/[^+\d]/g, "")}`;
          return (
            <li
              key={s.id}
              className="flex h-full flex-col rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-sm)] transition hover:border-purple-200 hover:shadow-[var(--shadow-md)]"
              itemScope
              itemType="https://schema.org/LocalBusiness"
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                  <Store className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-[15px] font-bold leading-snug text-[var(--ink)]" itemProp="name">
                    {s.business_name}
                  </h3>
                  {s.locality && (
                    <p className="text-xs text-[var(--muted)]">
                      {s.locality}
                      {s.state ? `, ${s.state}` : ""}
                    </p>
                  )}
                </div>
              </div>
              <dl className="mt-3 flex flex-col gap-1.5 text-[13.5px] text-[var(--body-text)]">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" aria-hidden="true" />
                  <dd itemProp="address">{s.address}</dd>
                </div>
                {s.hours && (
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" aria-hidden="true" />
                    <dd>{s.hours}</dd>
                  </div>
                )}
                {s.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" aria-hidden="true" />
                    <dd>
                      <a href={telHref} className="font-semibold text-purple-700 hover:underline" itemProp="telephone">
                        {s.phone}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
              <div className="mt-auto flex flex-wrap gap-2 pt-4">
                {s.phone && (
                  <a href={telHref} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 text-[13px] font-semibold text-white hover:bg-purple-700">
                    <Phone className="h-3.5 w-3.5" aria-hidden="true" /> Call now
                  </a>
                )}
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--line-strong)] bg-white px-3.5 text-[13px] font-semibold text-[var(--ink-soft)] hover:bg-purple-50"
                >
                  <Navigation className="h-3.5 w-3.5" aria-hidden="true" /> Get directions
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default StoreLocator;
