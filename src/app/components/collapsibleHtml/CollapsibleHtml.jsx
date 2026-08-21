"use client";

import React, { useState } from "react";

/**
 * Long-form HTML copy clamped to a few lines, with a "Show more" toggle.
 *
 * The FULL html is always in the DOM — only the height is clamped in CSS — so
 * search engines still crawl every word of the copy while readers see a short
 * teaser until they expand it. Never swap this for conditional rendering.
 */
export default function CollapsibleHtml({
  html,
  className = "",
  moreLabel = "Show more",
  lessLabel = "Show less",
}) {
  const [open, setOpen] = useState(false);

  if (typeof html !== "string" || !html.trim()) return null;

  return (
    <>
      <div
        className={`collapsibleHtml${open ? " is-open" : ""} ${className}`.trim()}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <button
        type="button"
        className="collapsibleToggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? lessLabel : moreLabel}
      </button>
    </>
  );
}
