"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "./ui";

/**
 * Icon tiles for a service group (appliances / home care / handyman).
 * Links are relative to the current page, so on /delhi they go to
 * /delhi/{service}. On phones only the first `mobileVisible` show until the
 * reader taps "View all".
 */
export default function IconGrid({ title, eyebrow, subtitle, items = [], mobileVisible = 6, id }) {
  const [all, setAll] = useState(false);
  const path = usePathname();
  const base = !path || path === "/" ? "" : path;

  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined}>
      <SectionHeader id={id ? `${id}-h` : undefined} eyebrow={eyebrow} title={title} subtitle={subtitle} />
      <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5">
        {items.map((s, i) => (
          <li key={s.url} className={!all && i >= mobileVisible ? "hidden sm:block" : ""}>
            <Link
              href={`${base}/${s.url}`}
              title={`${s.name} services`}
              className="group flex h-full flex-col items-center gap-2 rounded-2xl border border-[var(--line)] bg-white p-3 text-center shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-[var(--shadow-md)] sm:p-4"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--surface-soft)] sm:h-20 sm:w-20">
                {s.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.image} alt="" width={72} height={72} loading="lazy" className="h-12 w-12 object-contain sm:h-16 sm:w-16" />
                ) : (
                  <span className="text-3xl" aria-hidden="true">
                    🔧
                  </span>
                )}
              </span>
              <span className="text-[13px] font-semibold leading-tight text-[var(--ink)] group-hover:text-purple-800 sm:text-sm">{s.name}</span>
            </Link>
          </li>
        ))}
      </ul>
      {items.length > mobileVisible && (
        <div className="mt-4 text-center sm:hidden">
          <button
            type="button"
            onClick={() => setAll((v) => !v)}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-purple-200 bg-white px-4 text-sm font-semibold text-purple-800 hover:bg-purple-50"
          >
            {all ? "Show less" : `View all ${items.length}`} <ArrowRight className={`h-4 w-4 transition ${all ? "rotate-90" : ""}`} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}
