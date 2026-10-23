"use client";

import { useRef, useState } from "react";
import { Upload, Trash2, FileText, Loader2, Eye } from "lucide-react";
import { partnerApi } from "./partnerApi";
import { inputCls, labelCls, btnGhost, FieldError, StepNav } from "./ui";
import { BUSINESS_TYPES, DOC_TYPES, validGstin } from "@/lib/partners/validation";

export default function StepBusiness({ app, onSave, onBack, onAppUpdate, onError }) {
  const b = app.business;
  const [f, setF] = useState({
    business_type: b.business_type || "",
    // Individual technicians list under their own name (from step 1) unless they change it.
    business_name: b.business_name || (b.business_type === "individual" ? app.full_name || "" : ""),
    description: b.description || "",
    experience_years: b.experience_years ?? "",
    gstin: b.gstin || "",
    business_email: b.business_email || "",
    operating_hours: b.operating_hours || "",
    contact_preference: b.contact_preference || "",
    // Phone numbers are no longer shown publicly — customers book via "Book now".
    show_phone_publicly: false,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const isIndividual = f.business_type === "individual";

  // Switching to Individual pre-fills the step-1 name; switching away clears it
  // again if it was only that pre-fill, so a shop name is entered instead.
  const changeType = (e) => {
    const type = e.target.value;
    setF((s) => {
      const name = s.business_name.trim();
      let business_name = s.business_name;
      if (type === "individual" && !name) business_name = app.full_name || "";
      else if (type !== "individual" && s.business_type === "individual" && name === (app.full_name || "").trim()) business_name = "";
      return { ...s, business_type: type, business_name };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    const fields = {};
    if (!f.business_type) fields.business_type = "Choose your business type.";
    if (f.business_name.trim().length < 2)
      fields.business_name = isIndividual ? "Technician name is required." : "Business / shop name is required.";
    const g = validGstin(f.gstin);
    if (g.error) fields.gstin = g.error;
    if (Object.keys(fields).length) return setErr({ message: "Please fix the highlighted fields.", fields });
    setBusy(true);
    const error = await onSave(f);
    setBusy(false);
    setErr(error);
  };

  const fe = err?.fields || {};

  return (
    <form onSubmit={submit} noValidate className="mt-4 space-y-5">
      <fieldset>
        <legend className={labelCls}>Business type *</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(BUSINESS_TYPES).map(([v, label]) => (
            <label
              key={v}
              className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border-2 px-3 py-2 text-center text-sm font-medium transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-purple-600 ${
                f.business_type === v ? "border-purple-600 bg-purple-50 text-purple-800" : "border-[var(--line)] text-[var(--ink-soft)] hover:border-purple-300"
              }`}
            >
              <input type="radio" name="business_type" value={v} checked={f.business_type === v} onChange={changeType} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
        <FieldError msg={fe.business_type} />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="bz-name" className={labelCls}>{isIndividual ? "Technician name *" : "Business / shop name *"}</label>
          <input id="bz-name" className={inputCls} value={f.business_name} onChange={set("business_name")} maxLength={150} aria-invalid={!!fe.business_name} />
          {isIndividual && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              This is the name customers will see. We&apos;ve used your name from step 1 — change it if you work under a different name.
            </p>
          )}
          <FieldError msg={fe.business_name} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="bz-desc" className={labelCls}>About your business</label>
          <textarea id="bz-desc" rows={4} className={inputCls} value={f.description} onChange={set("description")} maxLength={1500} placeholder="What you do, your specialities, service promise…" />
          <p className="mt-1 text-right text-xs text-[var(--muted)]">{f.description.length}/1500</p>
          <FieldError msg={fe.description} />
        </div>
        <div>
          <label htmlFor="bz-exp" className={labelCls}>Years of experience</label>
          <input id="bz-exp" type="number" min={0} max={60} inputMode="numeric" className={inputCls} value={f.experience_years} onChange={set("experience_years")} aria-invalid={!!fe.experience_years} />
          <FieldError msg={fe.experience_years} />
        </div>
        <div>
          <label htmlFor="bz-gst" className={labelCls}>GSTIN (optional)</label>
          <input id="bz-gst" className={`${inputCls} uppercase`} value={f.gstin} onChange={set("gstin")} maxLength={15} placeholder="06ABCDE1234F1Z5" aria-invalid={!!fe.gstin} />
          <FieldError msg={fe.gstin} />
        </div>
        <div>
          <label htmlFor="bz-email" className={labelCls}>Business email (optional)</label>
          <input id="bz-email" type="email" className={inputCls} value={f.business_email} onChange={set("business_email")} maxLength={190} aria-invalid={!!fe.business_email} />
          <FieldError msg={fe.business_email} />
        </div>
        <div>
          <label htmlFor="bz-hours" className={labelCls}>Working hours (optional)</label>
          <input id="bz-hours" className={inputCls} value={f.operating_hours} onChange={set("operating_hours")} maxLength={160} placeholder="Mon–Sat, 9 AM – 8 PM" />
          <FieldError msg={fe.operating_hours} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageField label="Logo / profile photo" kind="logo" url={app.logo_url} onAppUpdate={onAppUpdate} onError={onError} />
        <ImageField label="Shop / work photo" kind="shop" url={app.shop_image_url} onAppUpdate={onAppUpdate} onError={onError} />
      </div>

      <Documents app={app} individual={isIndividual} onAppUpdate={onAppUpdate} onError={onError} />

      {err && !err.fields && <FieldError msg={err.message} />}
      <StepNav onBack={onBack} busy={busy} />
    </form>
  );
}

/** Uploads immediately to S3 (partners/{id}/{kind}/) via our API. */
export function ImageField({ label, kind, url, onAppUpdate, onError }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const upload = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setMsg("Image must be 5 MB or smaller.");
    setBusy(true);
    setMsg("");
    const form = new FormData();
    form.append("kind", kind);
    form.append("file", file);
    const r = await partnerApi("/api/partners/me/images", { method: "POST", form });
    setBusy(false);
    if (input.current) input.current.value = "";
    if (r.ok) onAppUpdate(r.data);
    else setMsg(onError(r).message);
  };

  const remove = async () => {
    setBusy(true);
    const r = await partnerApi(`/api/partners/me/images?kind=${kind}`, { method: "DELETE" });
    setBusy(false);
    if (r.ok) onAppUpdate(r.data);
    else setMsg(onError(r).message);
  };

  return (
    <div>
      <span className={labelCls}>{label} (optional)</span>
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[var(--line-strong)] p-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-purple-50">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" width={64} height={64} className="h-full w-full object-cover" />
          ) : (
            <Upload className="h-5 w-5 text-purple-400" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className={`${btnGhost} min-h-10 cursor-pointer px-3 py-1.5 text-sm`}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {url ? "Replace" : "Upload"}
            <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} />
          </label>
          {url && (
            <button type="button" className={`${btnGhost} min-h-10 px-3 py-1.5 text-sm`} onClick={remove} disabled={busy} aria-label={`Remove ${label}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">JPG, PNG or WebP, up to 5 MB. Shown on your public profile after approval.</p>
      <FieldError msg={msg} />
    </div>
  );
}

const fmtSize = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(n / 1024)} KB`);
const REVIEW = { pending: "Awaiting review", verified: "Verified", rejected: "Rejected" };

/** Private documents → S3 partner-docs/ (never public). */
export function Documents({ app, individual, onAppUpdate, onError }) {
  const [type, setType] = useState(individual ? "aadhaar" : "gst_certificate");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const input = useRef(null);

  const upload = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setMsg("File must be 5 MB or smaller.");
    setBusy(true);
    setMsg("");
    const form = new FormData();
    form.append("doc_type", type);
    form.append("file", file);
    const r = await partnerApi("/api/partners/me/documents", { method: "POST", form });
    setBusy(false);
    if (input.current) input.current.value = "";
    if (r.ok) onAppUpdate(r.data);
    else setMsg(onError(r).message);
  };

  const view = async (id) => {
    const r = await partnerApi(`/api/partners/me/documents/${id}`);
    if (r.ok) window.open(r.data.url, "_blank", "noopener,noreferrer");
    else setMsg(r.error.message);
  };

  const remove = async (id) => {
    const r = await partnerApi(`/api/partners/me/documents/${id}`, { method: "DELETE" });
    if (r.ok) onAppUpdate(r.data);
    else setMsg(onError(r).message);
  };

  return (
    <fieldset className="rounded-2xl border border-[var(--line)] p-4">
      <legend className="px-1 text-sm font-semibold text-[var(--ink)]">Verification documents (optional, private)</legend>
      <p className="mb-3 text-xs text-[var(--muted)]">
        Only our verification team can see these. They speed up ID / GST verification badges. PDF, JPG or PNG up to 5 MB.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="doc-type" className="sr-only">Document type</label>
        <select id="doc-type" className={`${inputCls} sm:max-w-xs`} value={type} onChange={(e) => setType(e.target.value)}>
          {Object.entries(DOC_TYPES).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <label className={`${btnGhost} cursor-pointer`}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Upload document
          <input ref={input} type="file" accept="application/pdf,image/jpeg,image/png" className="sr-only" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} />
        </label>
      </div>
      {type === "aadhaar" && (
        <p className="mt-2 text-xs text-[var(--muted)]">
          Tip: upload a <b>masked Aadhaar</b> (only the last 4 digits visible), downloadable from the UIDAI website.
        </p>
      )}
      <FieldError msg={msg} />
      {app.documents.length > 0 && (
        <ul className="mt-3 divide-y divide-[var(--line)]">
          {app.documents.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
              <FileText className="h-4 w-4 text-purple-500" />
              <span className="font-medium">{DOC_TYPES[d.doc_type]}</span>
              <span className="truncate text-[var(--muted)]">{d.original_name} · {fmtSize(d.size_bytes)}</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{REVIEW[d.review_status]}</span>
              <span className="ml-auto flex gap-1">
                <button type="button" className="rounded-lg p-2 hover:bg-purple-50" onClick={() => view(d.id)} aria-label="View document">
                  <Eye className="h-4 w-4" />
                </button>
                <button type="button" className="rounded-lg p-2 hover:bg-red-50" onClick={() => remove(d.id)} aria-label="Remove document">
                  <Trash2 className="h-4 w-4 text-red-600" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}
