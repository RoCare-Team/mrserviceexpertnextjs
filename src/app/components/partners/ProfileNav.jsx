"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sticky in-page navigation for the public partner profile.
 *
 * Sits directly under the site header: the header's real height is measured
 * at runtime (MUI toolbar is 56px on phones, 64px on larger screens, and can
 * change with font/zoom), so the bar never floats or hides under it.
 * Highlights the section in view, scrolls the active pill into view on
 * narrow screens, and gets a shadow once it is actually stuck.
 */
export default function ProfileNav({ items }) {
  const [active, setActive] = useState(items[0]?.id);
  const [top, setTop] = useState(64);
  const [stuck, setStuck] = useState(false);
  const barRef = useRef(null);
  const sentinelRef = useRef(null);

  // Header height → sticky offset, re-measured on resize.
  useEffect(() => {
    const header = document.querySelector("header.MuiAppBar-root, header");
    const measure = () => setTop(header ? Math.round(header.getBoundingClientRect().height) : 0);
    measure();
    const ro = typeof ResizeObserver !== "undefined" && header ? new ResizeObserver(measure) : null;
    ro?.observe(header);
    window.addEventListener("resize", measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Sections carry scroll-margin; here we only track which one is in view.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = items.map((i) => document.getElementById(i.id)).filter(Boolean);
    const offset = top + 56; // header + this bar
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: `-${offset}px 0px -60% 0px`, threshold: [0, 0.1] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items, top]);

  // A 1px sentinel just above the bar tells us when it is stuck.
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined" || !sentinelRef.current) return;
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { rootMargin: `-${top + 1}px 0px 0px 0px`, threshold: 0 });
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [top]);

  // Keep the active pill visible when the list scrolls horizontally.
  useEffect(() => {
    const el = barRef.current?.querySelector(`[data-id="${active}"]`);
    el?.scrollIntoView?.({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [active]);

  const go = (e, id) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    const y = el.getBoundingClientRect().top + window.scrollY - top - 56 - 8;
    window.scrollTo({ top: y, behavior: "smooth" });
    setActive(id);
    history.replaceState(null, "", `#${id}`);
  };

  return (
    <>
      <div ref={sentinelRef} aria-hidden="true" className="mt-4 h-px w-full sm:mt-5" />
      <nav
        ref={barRef}
        aria-label="Profile sections"
        style={{ top }}
        className={`sticky z-20 -mx-4 border-b border-[var(--line)] bg-white/95 backdrop-blur transition-shadow sm:mx-0 sm:rounded-2xl sm:border ${
          stuck ? "shadow-md sm:rounded-t-none" : "shadow-sm"
        }`}
      >
        <ul className="flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((i) => (
            <li key={i.id} className="shrink-0">
              <a
                href={`#${i.id}`}
                data-id={i.id}
                onClick={(e) => go(e, i.id)}
                aria-current={active === i.id ? "location" : undefined}
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3.5 text-sm font-semibold transition ${
                  active === i.id ? "bg-purple-600 text-white shadow-sm" : "text-[var(--ink-soft)] hover:bg-purple-50"
                }`}
              >
                {i.label}
                {i.count ? (
                  <span className={`rounded-full px-1.5 text-[11px] leading-5 ${active === i.id ? "bg-white/20" : "bg-purple-100 text-purple-800"}`}>{i.count}</span>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
