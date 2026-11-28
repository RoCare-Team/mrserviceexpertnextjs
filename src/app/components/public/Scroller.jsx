"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Horizontal card scroller: swipe on touch, arrow buttons on larger screens.
 * Children should be <li> elements; give them a width (see itemCls).
 */
export const itemCls = "pub-scroll-item"; // widths in globals.css

export default function Scroller({ children, label = "Scroll", className = "" }) {
  const ref = useRef(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = () => {
    const el = ref.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft <= 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  };

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const go = (dir) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.9, behavior: "smooth" });
  const btn =
    "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[var(--ink)] shadow-md ring-1 ring-black/5 transition hover:bg-purple-50 disabled:opacity-0 sm:inline-flex";

  return (
    <div className={`relative ${className}`}>
      <button type="button" aria-label={`${label}: previous`} className={`${btn} -left-3`} disabled={edge.start} onClick={() => go(-1)}>
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <ul
        ref={ref}
        onScroll={update}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </ul>
      <button type="button" aria-label={`${label}: next`} className={`${btn} -right-3`} disabled={edge.end} onClick={() => go(1)}>
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
