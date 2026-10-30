"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { SectionHeader } from "@/app/components/public/ui";

const BRANDS = [
  { id: 1, src: "/assets/images/All Logos/kent logo.webp", name: "Kent" },
  { id: 2, src: "/assets/images/All Logos/unilever pure.webp", name: "Pureit" },
  { id: 3, src: "/assets/images/All Logos/aqua smart.webp", name: "AquaSmart" },
  { id: 4, src: "/assets/images/All Logos/livpure logo.webp", name: "Livpure" },
  { id: 6, src: "/assets/images/All Logos/blue star.webp", name: "Blue Star" },
  { id: 7, src: "/assets/images/BrandLogos/rkAqua.jpg", name: "RK Aqua" },
  { id: 8, src: "/assets/images/All Logos/nasaka.webp", name: "Nasaka" },
  { id: 9, src: "/assets/images/All Logos/tata swach.webp", name: "Tata Swach" },
  { id: 10, src: "/assets/images/All Logos/nexus.webp", name: "Nexus" },
  { id: 12, src: "/assets/images/All Logos/mi.webp", name: "Mi" },
];

const MOBILE_VISIBLE = 6;

/** "Top brands we repair" logo wall. */
export default function RepairView() {
  const [all, setAll] = useState(false);
  return (
    <section
      aria-labelledby="brands-h"
      className="relative overflow-hidden rounded-3xl border border-[var(--line)] p-5 shadow-[var(--shadow-sm)] sm:p-8"
      style={{ background: "radial-gradient(760px 300px at 90% -10%, rgba(246,162,30,0.10), transparent 55%), linear-gradient(160deg, #FBFAFE 0%, #EFEAFB 100%)" }}
    >
      <SectionHeader
        id="brands-h"
        eyebrow="300+ brands"
        title="Top brands we repair"
        subtitle="No matter where you bought it, we can fix it. We service most major brands, makes and models."
      />
      <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-5">
        {BRANDS.map((b, i) => (
          <li key={b.id} className={!all && i >= MOBILE_VISIBLE ? "hidden sm:block" : ""}>
            <div
              title={b.name}
              className="flex h-20 items-center justify-center rounded-2xl border border-[var(--line)] bg-white p-3 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-[var(--shadow-md)] sm:h-24"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.src} alt={b.name} width={128} height={48} loading="lazy" className="max-h-full max-w-[85%] object-contain" />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-center sm:hidden">
        <button
          type="button"
          onClick={() => setAll((v) => !v)}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-purple-200 bg-white px-4 text-sm font-semibold text-purple-800 hover:bg-purple-50"
        >
          {all ? "Show less" : "View all brands"} <ArrowRight className={`h-4 w-4 transition ${all ? "rotate-90" : ""}`} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
