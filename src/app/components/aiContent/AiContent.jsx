"use client";

import React from "react";
import CollapsibleHtml from "@/app/components/collapsibleHtml/CollapsibleHtml";

/**
 * Renders the AI-generated copy stored in `ai_content` for the current URL.
 *
 * Renders NOTHING when the page has no generated copy, so a URL like
 * /mumbai/ro-water-purifier stays exactly as it is until content is generated
 * for it.
 */
export default function AiContent({ html, title }) {
  if (typeof html !== "string" || !html.trim()) return null;

  return (
    <section className="aiContentCard">
      {title ? <h2 className="aiContentTitle">{title}</h2> : null}

      <CollapsibleHtml html={html} className="serviceContentStyle aiContentBody" />
    </section>
  );
}
