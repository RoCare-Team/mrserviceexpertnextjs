"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Star, ArrowRight, Check } from "lucide-react";

/**
 * City landing page: one card per appliance category, linking to the city's
 * category page where the bookable services live. Section ids match the
 * jump chips in pages/Services/AllServices.jsx.
 */
const SERVICES = [
  {
    id: "water-purifier",
    name: "RO Water Purifier",
    image: "/assets/serviceTabIcons/ro repair service.webp",
    link: "ro-water-purifier",
    briefInfo: ["Cleaning of machine and filters", "Complete water purifier check-up", "AMC plans covering filters and membrane", "Service within 24 hours"],
  },
  {
    id: "ac",
    name: "Air Conditioner",
    image: "/assets/serviceTabIcons/ac repair and service.webp",
    link: "ac",
    briefInfo: ["Complete AC check-up incl. gas level", "Foam and jet-spray cleaning of coils and filters", "Installation, uninstallation and gas refill", "10-day warranty after service"],
  },
  {
    id: "washing-machine",
    name: "Washing Machine",
    image: "/assets/serviceTabIcons/washing machine repair and service.webp",
    link: "washing-machine-repair",
    briefInfo: ["Top-load, front-load and semi-automatic", "Visit fee adjusted in the repair quote", "Installation and uninstallation", "Service within 24 hours"],
  },
  {
    id: "refrigerator",
    name: "Refrigerator",
    image: "/assets/serviceTabIcons/refrigerator repair service.webp",
    link: "refrigerator-repair",
    briefInfo: ["Single, double and side-by-side door", "Cooling, gas and compressor issues", "Visit fee adjusted in the repair quote", "Service within 24 hours"],
  },
  {
    id: "gyeser",
    name: "Geyser",
    image: "/assets/serviceTabIcons/geyser repair service.webp",
    link: "geyser-repair",
    briefInfo: ["Instant and storage geysers", "Descaling and element replacement", "Installation and uninstallation", "Service within 24 hours"],
  },
  {
    id: "microwav-repair",
    name: "Microwave",
    image: "/assets/serviceTabIcons/microwave installation.webp",
    link: "microwav-repair",
    briefInfo: ["Not heating or not working", "Buttons and noise issues", "Solo, grill and convection models", "Service within 24 hours"],
  },
  {
    id: "kitchen-chimney",
    name: "Kitchen Chimney",
    image: "/assets/serviceTabIcons/kitchen chimney installaiton.webp",
    link: "kitchen-chimney-repair",
    briefInfo: ["Filter and duct cleaning", "Motor and suction repair", "Installation and uninstallation", "Service within 24 hours"],
  },
  {
    id: "led-tv-repair",
    name: "LED / Smart TV",
    image: "/assets/serviceTabIcons/led tv reapair.webp",
    link: "led-tv-repair",
    briefInfo: ["No display, flicker or sound issues", "Smart TV maintenance", "Wall installation and uninstallation", "Service within 24 hours"],
  },
  {
    id: "vaccum-cleaner",
    name: "Vacuum Cleaner",
    image: "/assets/serviceTabIcons/vaccum cleaner repair service.webp",
    link: "vacuum-cleaner-repair",
    briefInfo: ["Low suction and motor faults", "Diagnostic service", "All leading brands", "Service within 24 hours"],
  },
  {
    id: "air-purifier",
    name: "Air Purifier",
    image: "/assets/serviceTabIcons/air purifier repair service.webp",
    link: "air-purifier-repair",
    briefInfo: ["Filter cleaning and replacement", "Fan and motor repair", "Complete check-up", "Service within 24 hours"],
  },
];

export default function Services() {
  const { city } = useParams();
  return (
    <section id="services" className="scroll-mt-28" aria-labelledby="city-services-h">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 id="city-services-h" className="text-lg font-bold text-[var(--ink)] sm:text-xl">
          Appliance repair and services
        </h2>
        <span className="text-xs font-medium text-[var(--muted)]">Pick an appliance to see prices and book</span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {SERVICES.map((s) => (
          <li key={s.id} id={s.id} className="scroll-mt-36">
            <Link
              href={`/${city}/${s.link}`}
              title={`${s.name} service in ${city}`}
              className="group flex h-full flex-col rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-[var(--shadow-md)]"
            >
              <div className="flex items-center gap-3.5">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--surface-soft)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.image} alt={s.name} width={64} height={64} loading="lazy" className="h-full w-full object-cover" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[15px] font-bold text-[var(--ink)] group-hover:text-purple-800">{s.name}</h3>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-[var(--muted)]">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                    <b className="text-[var(--ink-soft)]">4.7</b> (50K+ reviews)
                  </p>
                </div>
              </div>
              <ul className="mt-3 flex flex-col gap-1.5 text-[13px] text-[var(--body-text)]">
                {s.briefInfo.map((b) => (
                  <li key={b} className="flex items-start gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden="true" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[13px] font-semibold text-purple-700">
                View services and prices <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
