"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import Popup from "@/app/components/popup";

/**
 * The booking popup that opens 12 seconds after a service page loads.
 * Shared by the city, category, city+category and city+brand pages.
 */
export default function LeadPopup({ delay = 12000 }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Book a service"
    >
      <div className="hide-scrollbar relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[var(--ink)] shadow-md ring-1 ring-black/5 hover:bg-white"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <div className="p-3 sm:p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mrserviceexpertbanner.webp" alt="Mr. Service Expert offers" className="h-[125px] w-full rounded-2xl object-cover lg:h-[225px]" />
        </div>
        <Popup />
      </div>
    </div>
  );
}
