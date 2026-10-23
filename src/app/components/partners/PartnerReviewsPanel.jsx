"use client";

import { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { partnerApi } from "./partnerApi";
import { cardCls } from "./ui";

/** Reviews on the partner's own profile, with remove. */
export default function PartnerReviewsPanel() {
  const [rows, setRows] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    partnerApi("/api/partners/me/reviews").then((r) => setRows(r.ok ? r.data : []));
  }, []);

  const remove = async (id) => {
    const r = await partnerApi(`/api/partners/me/reviews/${id}`, { method: "DELETE" });
    setConfirm(null);
    if (r.ok) setRows(r.data);
    else setMsg(r.error.message);
  };

  const live = rows?.filter((r) => r.status === "published") || [];

  return (
    <section className={cardCls} aria-labelledby="rev-h">
      <h2 id="rev-h" className="mb-3 text-lg font-bold text-[var(--ink)]">Reviews ({live.length})</h2>
      {msg && <p className="mb-2 text-sm text-red-600">{msg}</p>}
      {rows?.length === 0 && <p className="text-sm text-[var(--muted)]">No reviews yet.</p>}
      <ul className="divide-y divide-[var(--line)]">
        {rows?.map((r) => (
          <li key={r.id} className={`py-3 text-sm ${r.status === "removed" ? "opacity-50" : ""}`}>
            <div className="flex items-center gap-2">
              <span className="flex">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-4 w-4 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                ))}
              </span>
              <b>{r.author}</b>
              {r.status === "removed" && <span className="text-xs">(removed by {r.removed_by})</span>}
              {r.status === "published" &&
                (confirm === r.id ? (
                  <span className="ml-auto flex gap-2 text-xs">
                    <button className="font-semibold text-red-700 underline" onClick={() => remove(r.id)}>Remove</button>
                    <button className="underline" onClick={() => setConfirm(null)}>Cancel</button>
                  </span>
                ) : (
                  <button className="ml-auto rounded-lg p-1.5 hover:bg-red-50" onClick={() => setConfirm(r.id)} aria-label="Remove review">
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                ))}
            </div>
            {r.comment && <p className="mt-1 text-[var(--body-text)]">{r.comment}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
