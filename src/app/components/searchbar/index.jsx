"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Wrench, Sparkles, Hammer, ArrowRight } from "lucide-react";
import { HOME_CARE_SERVICES, HANDYMAN_SERVICES } from "@/lib/homeCare";

const APPLIANCES = [
  { name: "RO Water Purifier", url: "ro-water-purifier" },
  { name: "AC Repair & Service", url: "ac" },
  { name: "Washing Machine Repair", url: "washing-machine-repair" },
  { name: "Refrigerator Repair", url: "refrigerator-repair" },
  { name: "Geyser Repair", url: "geyser-repair" },
  { name: "Microwave Repair", url: "microwav-repair" },
  { name: "LED TV Repair", url: "led-tv-repair" },
  { name: "Kitchen Chimney Repair", url: "kitchen-chimney-repair" },
  { name: "Air Purifier Repair", url: "air-purifier-repair" },
  { name: "Vacuum Cleaner Repair", url: "vacuum-cleaner-repair" },
];

const GROUPS = [
  { label: "Appliance repair", icon: Wrench, items: APPLIANCES },
  { label: "Home care", icon: Sparkles, items: HOME_CARE_SERVICES },
  { label: "Handyman", icon: Hammer, items: HANDYMAN_SERVICES },
];

/**
 * Header search: type to filter every service, Enter / click to open its
 * page. With an empty box it lists the popular appliance services.
 */
export default function SearchBar({ autoFocus = false, onNavigate, className = "" }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const router = useRouter();
  const rootRef = useRef(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return GROUPS.map((g) => ({ ...g, items: g.items.slice(0, g.label === "Appliance repair" ? 5 : 3) }));
    return GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.name.toLowerCase().includes(s)) })).filter((g) => g.items.length);
  }, [q]);
  const flat = results.flatMap((g) => g.items);

  useEffect(() => {
    const onDown = (e) => rootRef.current && !rootRef.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  useEffect(() => setActive(0), [q]);

  const go = (item) => {
    setOpen(false);
    setQ("");
    onNavigate?.();
    router.push(`/${item.url}`);
  };

  const onKey = (e) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && flat[active]) {
      e.preventDefault();
      go(flat[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  let idx = -1;
  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <label className="flex h-10 items-center gap-2 rounded-full border border-[var(--line-strong)] bg-white px-3.5 transition focus-within:border-purple-500 focus-within:ring-2 focus-within:ring-purple-100">
        <Search className="h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
        <input
          type="search"
          value={q}
          autoFocus={autoFocus}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKey}
          placeholder="Search for services…"
          aria-label="Search for services"
          aria-expanded={open}
          className="w-full min-w-0 bg-transparent text-[14px] text-[var(--ink)] outline-none placeholder:text-[var(--muted)] [&::-webkit-search-cancel-button]:hidden"
        />
      </label>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-[70vh] overflow-y-auto rounded-2xl border border-[var(--line)] bg-white p-1.5 shadow-[var(--shadow-lg)]">
          {flat.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-[var(--muted)]">No services found for “{q}”. Try “AC” or “cleaning”.</p>
          ) : (
            results.map((g) => (
              <div key={g.label} className="py-1">
                <p className="flex items-center gap-1.5 px-3 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                  <g.icon className="h-3 w-3" aria-hidden="true" /> {g.label}
                </p>
                <ul>
                  {g.items.map((item) => {
                    idx += 1;
                    const i = idx;
                    return (
                      <li key={item.url}>
                        <button
                          type="button"
                          onMouseEnter={() => setActive(i)}
                          onClick={() => go(item)}
                          className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[14px] font-medium text-[var(--ink)] ${i === active ? "bg-purple-50 text-purple-800" : ""}`}
                        >
                          {item.name}
                          <ArrowRight className={`h-3.5 w-3.5 ${i === active ? "text-purple-600" : "text-transparent"}`} aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
