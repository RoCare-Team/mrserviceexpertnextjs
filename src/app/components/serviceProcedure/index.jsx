import React from "react";
import { ListChecks } from "lucide-react";

const STEPS = ["Choose your service", "Expert consultation and quote", "Approval and easy scheduling", "Service at your doorstep", "Secure payment on completion", "Share your feedback"];

/** "How it works" steps for the sticky column. */
export default function ServiceProcedure() {
  return (
    <section aria-labelledby="process-h" className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-sm)]">
      <div className="mb-3 flex items-center gap-3">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_6px_14px_-6px_rgba(224,137,0,.6)]">
          <ListChecks className="h-4 w-4" aria-hidden="true" />
        </span>
        <h2 id="process-h" className="text-[15px] font-bold text-[var(--ink)]">
          How it works
        </h2>
      </div>
      <ol className="relative ml-3 flex flex-col gap-3 border-l-2 border-purple-100 pl-5">
        {STEPS.map((s, i) => (
          <li key={s} className="relative text-[13.5px] text-[var(--body-text)]">
            <span className="absolute -left-[29px] top-0 inline-flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white ring-4 ring-white">
              {i + 1}
            </span>
            {s}
          </li>
        ))}
      </ol>
    </section>
  );
}
