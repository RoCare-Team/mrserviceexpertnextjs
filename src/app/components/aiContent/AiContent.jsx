"use client";

import React from "react";
import { Sparkles } from "lucide-react";
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
    <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-sm)] sm:p-6" aria-labelledby="ai-content-h">
      {title ? (
        <div className="mb-4 flex items-center gap-3 border-b border-[var(--line)] pb-3.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[0_6px_14px_-6px_rgba(98,41,205,.6)]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 id="ai-content-h" className="text-[17px] font-bold leading-snug text-[var(--ink)] sm:text-lg">
            {title}
          </h2>
        </div>
      ) : null}
      <CollapsibleHtml html={html} className="prose-site" />
    </section>
  );
}
