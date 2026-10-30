"use client";

import { useState } from "react";

/**
 * Same idea as CollapsibleHtml, for JSX children: everything stays in the
 * DOM (crawlers read it all), readers see the first few lines until they
 * click "Read more".
 */
export default function CollapsibleBlock({ children, className = "", maxHeight = "14em", moreLabel = "Read more", lessLabel = "Show less" }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className={`collapsibleHtml ${open ? "is-open" : ""} ${className}`} style={open ? undefined : { maxHeight }}>
        {children}
      </div>
      <button type="button" className="collapsibleToggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        {open ? lessLabel : moreLabel}
      </button>
    </>
  );
}
