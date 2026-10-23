"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { CalendarCheck } from "lucide-react";

// The modal is only downloaded when someone actually clicks "Book now".
const BookPartnerModal = dynamic(() => import("./BookPartnerModal"), { ssr: false });

/**
 * booking: { partner: { slug, name }, categories: [{ url, name }],
 *            defaultCategory?, brandName?, cityName? }
 */
export default function BookNowButton({ booking, className = "", label = "Book now" }) {
  const [open, setOpen] = useState(false);
  if (!booking?.categories?.length) return null;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-purple-600 px-4 text-sm font-semibold text-white hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${className}`}
      >
        <CalendarCheck className="h-4 w-4" aria-hidden="true" /> {label}
      </button>
      {open && <BookPartnerModal {...booking} onClose={() => setOpen(false)} />}
    </>
  );
}
