"use client";

import Popup from "@/app/components/popup";

/**
 * The same booking form as LeadPopup, shown in place (no modal) in the 2/5
 * column next to the FAQ and page content. The timed popup still opens too.
 */
export default function LeadFormCard() {
  return (
    <div id="book" className="overflow-hidden rounded-2xl border border-[var(--line,#e5e7eb)] bg-white shadow-sm">
      <div className="p-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/mrserviceexpertbanner.webp" alt="Mr. Service Expert offers" loading="lazy" className="h-[110px] w-full rounded-xl object-cover" />
      </div>
      <Popup compact />
    </div>
  );
}
