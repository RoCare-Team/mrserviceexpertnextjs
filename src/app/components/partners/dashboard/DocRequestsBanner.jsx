"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { partnerApi } from "../partnerApi";

const MAX = 5 * 1024 * 1024;
const fmtDate = (d) => (d ? new Date(`${d}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "");

function RequestRow({ r, setApp }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file) => {
    setError("");
    if (!file) return;
    if (file.size > MAX) return setError("File must be 5 MB or smaller.");
    if (!/\.(pdf|jpe?g|png)$/i.test(file.name)) return setError("Upload a PDF, JPG or PNG file.");
    const form = new FormData();
    form.append("request_id", String(r.id));
    form.append("file", file);
    setBusy(true);
    const res = await partnerApi("/api/partners/me/documents", { method: "POST", form });
    setBusy(false);
    if (input.current) input.current.value = "";
    if (res.ok) setApp(res.data);
    else setError(res.error?.message || "Upload failed. Please try again.");
  };

  if (r.status === "submitted") {
    return (
      <li className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2 text-sm text-emerald-800">
        <CheckCircle2 className="h-4 w-4 shrink-0" /> <b>{r.label}</b> uploaded — our team is reviewing it.
      </li>
    );
  }

  const overdue = r.due_date && r.due_date < new Date().toISOString().slice(0, 10);
  return (
    <li className="rounded-xl bg-white px-3 py-3 text-sm shadow-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[var(--ink)]">{r.label}</p>
          {r.note && <p className="text-[var(--body-text)]">{r.note}</p>}
          {r.due_date && (
            <p className={`text-xs ${overdue ? "font-semibold text-red-700" : "text-[var(--muted)]"}`}>
              {overdue ? "Overdue — was due" : "Upload by"} {fmtDate(r.due_date)}
            </p>
          )}
          {r.review_note && <p className="mt-1 text-xs text-red-700">Previous upload not accepted: {r.review_note}</p>}
        </div>
        <input
          ref={input}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={(e) => upload(e.target.files?.[0])}
          aria-label={`Upload ${r.label}`}
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} {busy ? "Uploading…" : "Upload"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-medium text-red-700">{error}</p>}
      <p className="mt-1 text-[11px] text-[var(--muted)]">PDF, JPG or PNG · max 5 MB · stored privately</p>
    </li>
  );
}

/** Documents the admin asked for — shown on every dashboard tab until uploaded. */
export default function DocRequestsBanner({ app, setApp }) {
  const list = (app.doc_requests || []).filter((r) => r.status === "open" || r.status === "submitted");
  if (!list.length) return null;
  const open = list.filter((r) => r.status === "open").length;
  return (
    <section className={`mb-4 rounded-2xl border p-4 ${open ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`} aria-label="Documents requested">
      {open > 0 && (
        <h2 className="mb-3 flex items-center gap-2 font-bold text-amber-900">
          <AlertTriangle className="h-5 w-5" /> Action needed: please upload {open === 1 ? "this document" : `these ${open} documents`}
        </h2>
      )}
      <ul className="space-y-2">
        {list.map((r) => <RequestRow key={r.id} r={r} setApp={setApp} />)}
      </ul>
    </section>
  );
}
