"use client";

import React, { useState } from "react";

/**
 * Renders the AI-generated copy stored in `ai_content` for the current URL.
 *
 * Renders NOTHING when the page has no generated copy, so a URL like
 * /mumbai/ro-water-purifier stays exactly as it is until content is generated
 * for it.
 */
export default function AiContent({ html, title }) {
  const [open, setOpen] = useState(false);

  if (typeof html !== "string" || !html.trim()) return null;

  return (
    <section className="aiContentCard">
      {title ? <h2 className="aiContentTitle">{title}</h2> : null}

      <div
        className={`serviceContentStyle aiContentBody${open ? " is-open" : ""}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <button
        type="button"
        className="aiContentToggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? "Show less" : "Show more"}
      </button>
    </section>
  );
}
