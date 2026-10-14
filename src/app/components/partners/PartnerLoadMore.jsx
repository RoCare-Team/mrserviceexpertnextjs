"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import PartnerCard from "./PartnerCard";

/** Appends further pages of partners in place (no new URLs for SEO pages). */
export default function PartnerLoadMore({ query, startPage }) {
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(startPage);
  const [more, setMore] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setBusy(true);
    setError("");
    try {
      const qs = new URLSearchParams({ cityId: query.cityId, categoryId: query.categoryId, page });
      if (query.brandId) qs.set("brandId", query.brandId);
      const res = await fetch(`/api/public/partners?${qs}`);
      const json = await res.json();
      if (!json.success) throw new Error();
      setItems((xs) => [...xs, ...json.data.items.filter((p) => !xs.some((x) => x.slug === p.slug))]);
      setMore(json.data.hasMore);
      setPage((n) => n + 1);
    } catch {
      setError("Couldn't load more partners. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {items.map((p) => (
        <li key={p.slug}>
          <PartnerCard partner={p} />
        </li>
      ))}
      {more && (
        <li className="flex flex-col items-center justify-center gap-2 sm:col-span-2 lg:col-span-3">
          <button
            type="button"
            onClick={load}
            disabled={busy}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[var(--line-strong)] bg-white px-5 text-sm font-semibold text-[var(--ink-soft)] hover:bg-purple-50 disabled:opacity-60"
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Show more partners
          </button>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        </li>
      )}
    </>
  );
}
