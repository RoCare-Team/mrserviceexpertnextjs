"use client";

import Popup from "@/app/components/popup";

/**
 * The same booking form as LeadPopup, shown in place (no modal) in the 2/5
 * column next to the FAQ and page content. The timed popup still opens too.
 */
export default function LeadFormCard() {
  return (
    <div id="book" className="overflow-hidden rounded-2xl border border-[var(--line,#e5e7eb)] bg-white shadow-sm">
      <h2 className="px-6 pt-5 text-xl font-bold text-[var(--ink,#111827)]">Book Service</h2>
      <Popup compact />
    </div>
  );
}
