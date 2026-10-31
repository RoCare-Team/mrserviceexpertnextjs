import React from "react";

/** Placeholder rows while /api/services loads — same shape as ServicesList rows. */
export default function ServicesSkeleton() {
  return (
    <section id="services" className="scroll-mt-28" aria-busy="true" aria-label="Loading services">
      <div className="mb-3 h-6 w-48 animate-pulse rounded bg-gray-200" />
      <ul className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="rounded-2xl border border-[var(--line)] bg-white p-4">
            <div className="flex items-start gap-4">
              <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-gray-200" />
              <div className="flex-1 space-y-2.5">
                <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-3.5 w-28 animate-pulse rounded bg-gray-200" />
                <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-10 w-20 animate-pulse rounded-xl bg-gray-200" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
