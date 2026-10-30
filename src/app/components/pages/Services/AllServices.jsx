"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { filterHiddenServices } from "@/lib/hiddenServices";
import { leadTypeFor } from "@/lib/serviceLeadType";

// Fallback when the API has no list for this page (city landing pages):
// the ids match the section ids rendered by pages/Services/Services.jsx.
const FALLBACK = [
  { id: "water-purifier", service_name: "RO Water Purifier", image: "/assets/serviceTabIcons/ro installation.webp" },
  { id: "ac", service_name: "Air Conditioner", image: "/assets/serviceTabIcons/ac uninstalltion.webp" },
  { id: "washing-machine", service_name: "Washing Machine", image: "/assets/serviceTabIcons/washing machine installation.webp" },
  { id: "microwav-repair", service_name: "Microwave", image: "/assets/serviceTabIcons/microwave installation.webp" },
  { id: "gyeser", service_name: "Geyser", image: "/assets/serviceTabIcons/geyser uninstallation.webp" },
  { id: "refrigerator", service_name: "Refrigerator", image: "/assets/serviceTabIcons/refrigerator installation.webp" },
  { id: "led-tv-repair", service_name: "LED TV", image: "/assets/serviceTabIcons/led tv reapair.webp" },
  { id: "vaccum-cleaner", service_name: "Vacuum Cleaner", image: "/assets/serviceTabIcons/vaccum cleaner repair service.webp" },
  { id: "kitchen-chimney", service_name: "Kitchen Chimney", image: "/assets/serviceTabIcons/kitchen chimney repair and service.webp" },
  { id: "air-purifier", service_name: "Air Purifier", image: "/assets/serviceTabIcons/air purifier repair service.webp" },
];

// Header (56/64px) + the sticky chip bar + a little breathing room.
const SCROLL_OFFSET = 150;

/**
 * Horizontal "jump to" chips for the service list: one chip per service
 * family (AMC, Installation, Repair…) that scrolls to that row. Sticky under
 * the site header inside the 2/3 column.
 */
export default function ServiceTabs({ cater, cat: catProp }) {
  const { city, cat } = useParams();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const lead_type = leadTypeFor(cat, city, cater, catProp);
    const cid = localStorage.getItem("customer_id");

    fetch("/api/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cid, lead_type }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!alive) return;
        if (data.error == "false") {
          const grouped = {};
          filterHiddenServices(data.service_details).forEach((item) => {
            let base = item.service_name;
            if (/^AMC Plan/i.test(base)) base = "AMC";
            else base = base.replace(/\s*\(.*?\)/g, "").trim();
            if (!grouped[base]) grouped[base] = { id: item.id, service_name: base, image: item.image };
          });
          setList(Object.values(grouped));
        } else {
          setList(FALLBACK);
        }
      })
      .catch(() => alive && setList(FALLBACK))
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [cat, city, cater, catProp]);

  const go = (id) => {
    const el = document.getElementById(String(id));
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - SCROLL_OFFSET;
    window.scrollTo({ top: y, behavior: "smooth" });
    setActive(id);
  };

  return (
    <nav
      aria-label="Jump to a service"
      className="sticky top-[64px] z-10 -mx-4 border-y border-[var(--line)] bg-white/95 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:shadow-[var(--shadow-sm)]"
    >
      <ul className="no-scrollbar flex gap-1.5 overflow-x-auto px-3 py-2">
        {loading
          ? [1, 2, 3, 4, 5].map((i) => <li key={i} className="h-10 w-28 shrink-0 animate-pulse rounded-xl bg-gray-100" aria-hidden="true" />)
          : list.map((s) => (
              <li key={s.id} className="shrink-0">
                <button
                  type="button"
                  title={s.service_name}
                  onClick={() => go(s.id)}
                  className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-[13px] font-semibold transition ${
                    active === s.id
                      ? "border-purple-600 bg-purple-600 text-white shadow-sm"
                      : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-purple-300 hover:bg-purple-50"
                  }`}
                >
                  {s.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.image}
                      alt=""
                      width={22}
                      height={22}
                      loading="lazy"
                      className={`h-[22px] w-[22px] rounded-md object-contain ${active === s.id ? "bg-white/90 p-px" : ""}`}
                    />
                  )}
                  <span className="max-w-[9.5rem] truncate">{s.service_name}</span>
                </button>
              </li>
            ))}
      </ul>
    </nav>
  );
}
