"use client";

import { useEffect, useState } from "react";
import { Star, Trash2, Loader2, MessageSquareReply } from "lucide-react";
import { partnerApi } from "../partnerApi";
import { cardCls, inputCls, btnPrimary, btnGhost } from "../ui";

function Stars({ n, size = "h-4 w-4" }) {
  return (
    <span className="flex" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`${size} ${i <= n ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} aria-hidden="true" />)}
    </span>
  );
}

function ReviewItem({ r, onChange }) {
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState(r.reply || "");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const call = async (method, body) => {
    setBusy(true);
    setMsg("");
    const res = await partnerApi(`/api/partners/me/reviews/${r.id}`, { method, body });
    setBusy(false);
    if (res.ok) {
      onChange(res.data);
      setReplying(false);
      setConfirm(false);
    } else setMsg(res.error.message);
  };

  const removed = r.status === "removed";
  return (
    <li className={`py-4 ${removed ? "opacity-50" : ""}`}>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Stars n={r.rating} />
        <b className="text-[var(--ink-soft)]">{r.author}</b>
        <span className="text-xs text-[var(--muted)]">{new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        {removed && <span className="text-xs">(removed by {r.removed_by})</span>}
      </div>
      {r.comment && <p className="mt-1 text-sm text-[var(--body-text)]">{r.comment}</p>}
      {r.reply && !replying && (
        <p className="mt-2 rounded-xl bg-purple-50/70 px-3 py-2 text-sm"><b className="text-purple-800">Your reply:</b> {r.reply}</p>
      )}
      {!removed && (
        <div className="mt-2 flex flex-wrap gap-3 text-sm">
          <button className="inline-flex items-center gap-1 text-purple-700 underline" onClick={() => (setReplying((v) => !v), setText(r.reply || ""))}>
            <MessageSquareReply className="h-4 w-4" /> {r.reply ? "Edit reply" : "Reply"}
          </button>
          {confirm ? (
            <span className="flex gap-2">
              <button className="font-semibold text-red-700 underline" disabled={busy} onClick={() => call("DELETE")}>Remove review</button>
              <button className="underline" onClick={() => setConfirm(false)}>Cancel</button>
            </span>
          ) : (
            <button className="inline-flex items-center gap-1 text-[var(--muted)] underline" onClick={() => setConfirm(true)}>
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          )}
        </div>
      )}
      {replying && (
        <div className="mt-2 space-y-2">
          <textarea aria-label="Your public reply" rows={2} maxLength={1000} className={inputCls} value={text} onChange={(e) => setText(e.target.value)} placeholder="Thank the customer or respond politely — shown publicly." />
          <div className="flex gap-2">
            <button className={btnPrimary} disabled={busy} onClick={() => call("POST", { reply: text })}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} {text.trim() ? "Post reply" : "Remove reply"}
            </button>
            <button className={btnGhost} onClick={() => setReplying(false)}>Cancel</button>
          </div>
        </div>
      )}
      {msg && <p className="mt-1 text-sm text-red-600">{msg}</p>}
    </li>
  );
}

export default function ReviewsTab() {
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState(0);

  useEffect(() => {
    partnerApi("/api/partners/me/reviews").then((r) => setRows(r.ok ? r.data : []));
  }, []);

  const live = (rows || []).filter((r) => r.status === "published");
  const avg = live.length ? live.reduce((a, r) => a + r.rating, 0) / live.length : 0;
  const dist = [5, 4, 3, 2, 1].map((s) => ({ s, n: live.filter((r) => r.rating === s).length }));
  const shown = (rows || []).filter((r) => !filter || r.rating === filter);

  return (
    <div className="space-y-5">
      <section className={`${cardCls} grid gap-6 sm:grid-cols-[auto_1fr]`}>
        <div className="text-center">
          <p className="text-5xl font-bold text-[var(--ink)]">{live.length ? avg.toFixed(1) : "—"}</p>
          <div className="mt-1 flex justify-center"><Stars n={Math.round(avg)} size="h-5 w-5" /></div>
          <p className="mt-1 text-sm text-[var(--muted)]">{live.length} review{live.length === 1 ? "" : "s"}</p>
        </div>
        <ul className="space-y-1.5">
          {dist.map(({ s, n }) => (
            <li key={s}>
              <button onClick={() => setFilter(filter === s ? 0 : s)} className={`flex w-full items-center gap-2 rounded-lg px-1 text-sm ${filter === s ? "bg-purple-50" : ""}`}>
                <span className="w-6 text-right">{s}★</span>
                <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <span className="block h-full bg-amber-400" style={{ width: `${live.length ? (n / live.length) * 100 : 0}%` }} />
                </span>
                <span className="w-6 text-[var(--muted)]">{n}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={cardCls}>
        <h2 className="text-lg font-bold text-[var(--ink)]">{filter ? `${filter}★ reviews` : "All reviews"}</h2>
        <p className="text-xs text-[var(--muted)]">Replying politely — even to bad reviews — builds trust with new customers.</p>
        {rows === null && <p className="mt-3 flex items-center gap-2 text-sm text-[var(--muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>}
        {rows?.length === 0 && <p className="mt-3 text-sm text-[var(--muted)]">No reviews yet. Ask happy customers to review you on your public profile.</p>}
        <ul className="divide-y divide-[var(--line)]">{shown.map((r) => <ReviewItem key={r.id} r={r} onChange={setRows} />)}</ul>
      </section>
    </div>
  );
}
