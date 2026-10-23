"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Copy, Share2, Upload, Trash2, Loader2, Clock3, CheckCircle2, CircleAlert } from "lucide-react";
import { partnerApi } from "../partnerApi";
import { cardCls, inputCls, labelCls, btnPrimary, btnGhost, FieldError, CategoryIcon } from "../ui";
import { ImageField, Documents } from "../StepBusiness";
import StepLocations from "../StepLocations";
import ChangeRequestForm from "./ChangeRequestForm";
import { BUSINESS_TYPES } from "@/lib/partners/validation";

function Section({ title, hint, children }) {
  return (
    <section className={cardCls}>
      <h2 className="text-lg font-bold text-[var(--ink)]">{title}</h2>
      {hint && <p className="mb-4 mt-0.5 text-sm text-[var(--muted)]">{hint}</p>}
      {children}
    </section>
  );
}

function LiveDetails({ app, setApp }) {
  const b = app.business;
  const [f, setF] = useState({
    description: b.description || "",
    operating_hours: b.operating_hours || "",
    experience_years: b.experience_years ?? "",
    business_email: b.business_email || "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await partnerApi("/api/partners/me/profile", { method: "PATCH", body: { kind: "details", data: f } });
    setBusy(false);
    if (r.ok) {
      setApp(r.data);
      setMsg({ ok: true, text: "Saved — your public profile is updated." });
    } else setMsg({ ok: false, text: r.error.message, fields: r.error.fields });
  };

  return (
    <form onSubmit={save} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="pf-desc" className={labelCls}>About your business</label>
        <textarea id="pf-desc" rows={4} maxLength={1500} className={inputCls} value={f.description} onChange={set("description")} />
        <p className="mt-1 text-right text-xs text-[var(--muted)]">{f.description.length}/1500</p>
        <FieldError msg={msg?.fields?.description} />
      </div>
      <div>
        <label htmlFor="pf-hours" className={labelCls}>Working hours</label>
        <input id="pf-hours" className={inputCls} maxLength={160} placeholder="Mon–Sat, 9 AM – 8 PM" value={f.operating_hours} onChange={set("operating_hours")} />
      </div>
      <div>
        <label htmlFor="pf-exp" className={labelCls}>Years of experience</label>
        <input id="pf-exp" type="number" min={0} max={60} className={inputCls} value={f.experience_years} onChange={set("experience_years")} />
        <FieldError msg={msg?.fields?.experience_years} />
      </div>
      <div>
        <label htmlFor="pf-email" className={labelCls}>Business email</label>
        <input id="pf-email" type="email" className={inputCls} value={f.business_email} onChange={set("business_email")} />
        <FieldError msg={msg?.fields?.business_email} />
      </div>
      <div className="flex items-end gap-3 sm:col-span-2">
        <button type="submit" className={btnPrimary} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Save details</button>
        {msg && <span className={`text-sm ${msg.ok ? "text-emerald-700" : "text-red-600"}`}>{msg.text}</span>}
      </div>
    </form>
  );
}

function Gallery({ app, setApp }) {
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const upload = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return setMsg("Each photo must be 5 MB or smaller.");
    setBusy(true);
    setMsg("");
    const form = new FormData();
    form.append("file", file);
    const r = await partnerApi("/api/partners/me/photos", { method: "POST", form });
    setBusy(false);
    if (input.current) input.current.value = "";
    if (r.ok) setApp(r.data);
    else setMsg(r.error.message);
  };
  const remove = async (id) => {
    const r = await partnerApi(`/api/partners/me/photos/${id}`, { method: "DELETE" });
    if (r.ok) setApp(r.data);
    else setMsg(r.error.message);
  };

  return (
    <div>
      <p className={labelCls}>Work gallery ({app.photos?.length || 0}/8)</p>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {(app.photos || []).map((ph) => (
          <li key={ph.id} className="group relative aspect-square overflow-hidden rounded-xl bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ph.url} alt="" className="h-full w-full object-cover" loading="lazy" />
            <button onClick={() => remove(ph.id)} className="absolute right-1 top-1 rounded-full bg-white/90 p-1.5 shadow" aria-label="Remove photo">
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          </li>
        ))}
        {(app.photos?.length || 0) < 8 && (
          <li>
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[var(--line-strong)] text-xs text-[var(--muted)] hover:bg-purple-50">
              {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />} Add photo
              <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e) => upload(e.target.files?.[0])} />
            </label>
          </li>
        )}
      </ul>
      <FieldError msg={msg} />
    </div>
  );
}

const CR_STATUS = {
  pending: { label: "Waiting for approval", cls: "bg-amber-50 text-amber-800", icon: Clock3 },
  approved: { label: "Approved", cls: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  rejected: { label: "Not approved", cls: "bg-red-50 text-red-700", icon: CircleAlert },
};

export default function ProfileTab({ app, setApp }) {
  const [copied, setCopied] = useState(false);
  const [requests, setRequests] = useState(null);
  const [editing, setEditing] = useState(false);
  const [areasMsg, setAreasMsg] = useState("");
  const url = app.slug ? `https://www.mrserviceexpert.com/partners/${app.slug}` : null;
  const listed = app.status === "approved" && app.is_listed && app.slug;
  const pending = requests?.find((r) => r.status === "pending");

  useEffect(() => {
    partnerApi("/api/partners/me/change-requests").then((r) => setRequests(r.ok ? r.data : []));
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const saveAreas = async (data) => {
    setAreasMsg("");
    const r = await partnerApi("/api/partners/me/profile", { method: "PATCH", body: { kind: "locations", data } });
    if (!r.ok) return r.error;
    setApp(r.data);
    setAreasMsg("Service areas updated — listing pages now show your new coverage.");
    return null;
  };

  // Live edits work for approved / suspended profiles; otherwise use the application form.
  if (!["approved", "suspended"].includes(app.status)) {
    return (
      <section className={cardCls}>
        <h2 className="text-lg font-bold text-[var(--ink)]">Your profile is {app.status_label.toLowerCase()}</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {app.status === "pending" ? "Our team is reviewing your changes. You'll be notified once it's done." : "Finish and submit your application to make changes live."}
        </p>
        {app.status !== "pending" && <a href="/partner/profile" className={`${btnPrimary} mt-4`}>Open application form</a>}
      </section>
    );
  }

  return (
    <div className="space-y-5">
      <Section title="Public profile" hint={listed ? "Share your profile with customers to get direct bookings." : "Your profile is not public right now."}>
        {url && (
          <div className="flex flex-wrap items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-xl bg-gray-50 px-3 py-2.5 text-sm">{url}</code>
            {listed && (
              <>
                <a href={url} target="_blank" rel="noreferrer" className={btnGhost}><ExternalLink className="h-4 w-4" /> Preview</a>
                <button className={btnGhost} onClick={copy}><Copy className="h-4 w-4" /> {copied ? "Copied!" : "Copy"}</button>
                <a
                  className={`${btnPrimary} bg-emerald-600 hover:bg-emerald-700`}
                  href={`https://wa.me/?text=${encodeURIComponent(`Book ${app.business.business_name} on Mr. Service Expert: ${url}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Share2 className="h-4 w-4" /> Share on WhatsApp
                </a>
              </>
            )}
          </div>
        )}
      </Section>

      <Section title="Details (update instantly)" hint="These changes appear on your profile right away.">
        <LiveDetails app={app} setApp={setApp} />
      </Section>

      <Section title="Photos" hint="Good photos get more bookings. JPG, PNG or WebP up to 5 MB each.">
        <div className="grid gap-4 sm:grid-cols-2">
          <ImageField label="Logo / profile photo" kind="logo" url={app.logo_url} onAppUpdate={setApp} onError={(r) => r.error} />
          <ImageField label="Main shop / work photo" kind="shop" url={app.shop_image_url} onAppUpdate={setApp} onError={(r) => r.error} />
        </div>
        <div className="mt-5"><Gallery app={app} setApp={setApp} /></div>
      </Section>

      <Section title="Address & service areas (update instantly)" hint="Add or remove cities and localities you serve. Listing pages update immediately.">
        {areasMsg && <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{areasMsg}</p>}
        <StepLocations app={app} onSave={saveAreas} submitLabel="Save address & areas" />
      </Section>

      <Section title="Verification documents" hint="Private — only our verification team sees them.">
        <Documents app={app} individual={app.business.business_type === "individual"} onAppUpdate={setApp} onError={(r) => r.error} />
      </Section>

      <Section title="Business identity & services (needs approval)" hint="Changes here are checked by our team. Your profile stays live meanwhile.">
        {!editing && (
          <>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div><dt className="text-[var(--muted)]">Business type</dt><dd className="font-medium">{BUSINESS_TYPES[app.business.business_type] || "—"}</dd></div>
              <div><dt className="text-[var(--muted)]">Name</dt><dd className="font-medium">{app.business.business_name || "—"}</dd></div>
              <div><dt className="text-[var(--muted)]">GSTIN</dt><dd className="font-medium">{app.business.gstin || "—"}</dd></div>
            </dl>
            <ul className="mt-4 space-y-2 text-sm">
              {app.categories.map((c) => (
                <li key={c.id}>
                  <p className="flex items-center gap-2 font-semibold"><CategoryIcon url={c.url} className="h-4 w-4 text-purple-600" /> {c.name}</p>
                  <p className="text-[var(--body-text)]">{(app.services[c.id] || []).map((s) => s.name).join(", ")}</p>
                  {(app.brands[c.id] || []).length > 0 && (
                    <p className="text-xs text-[var(--muted)]">Brands: {app.brands[c.id].map((b) => b.name).join(", ")}</p>
                  )}
                </li>
              ))}
            </ul>
            {pending ? (
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                <Clock3 className="h-4 w-4" /> A change request is waiting for approval (sent {new Date(pending.created_at).toLocaleDateString("en-IN")}). Sending a new one replaces it.
              </p>
            ) : null}
            <button className={`${btnPrimary} mt-4`} onClick={() => setEditing(true)}>Request a change</button>
          </>
        )}
        {editing && (
          <ChangeRequestForm
            app={app}
            onCancel={() => setEditing(false)}
            onDone={(list) => {
              setRequests(list);
              setEditing(false);
            }}
          />
        )}
        {requests?.length > 0 && (
          <div className="mt-5 border-t border-[var(--line)] pt-4">
            <p className="mb-2 text-sm font-semibold text-[var(--ink-soft)]">Recent requests</p>
            <ul className="space-y-1.5 text-sm">
              {requests.map((r) => {
                const s = CR_STATUS[r.status];
                return (
                  <li key={r.id} className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${s.cls}`}><s.icon className="h-3.5 w-3.5" /> {s.label}</span>
                    <span className="text-xs text-[var(--muted)]">{new Date(r.created_at).toLocaleDateString("en-IN")}</span>
                    {r.reason && <span className="text-xs text-[var(--body-text)]">— {r.reason}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Section>
    </div>
  );
}
