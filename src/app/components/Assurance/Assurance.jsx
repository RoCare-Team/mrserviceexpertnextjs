import React from "react";
import { ShieldCheck, Clock } from "lucide-react";
import { TrustStrip } from "@/app/components/public/ui";

/** "Why book with us" card for the sticky column. */
export default function Assurance() {
  return (
    <section aria-labelledby="assure-h" className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-sm)]">
      <div className="mb-3 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-[0_6px_14px_-6px_rgba(18,147,77,.6)]">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="assure-h" className="text-[15px] font-bold text-[var(--ink)]">
            Mr. Service Expert promise
          </h2>
          <p className="inline-flex items-center gap-1 text-xs text-[var(--muted)]">
            <Clock className="h-3 w-3" aria-hidden="true" /> Doorstep service in 30 minutes
          </p>
        </div>
      </div>
      <TrustStrip compact />
    </section>
  );
}
