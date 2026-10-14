"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Loader2, BadgeCheck, CircleAlert } from "lucide-react";
import { partnerApi } from "./partnerApi";
import { btnPrimary, btnGhost, FieldError } from "./ui";
import { BUSINESS_TYPES, CONTACT_PREFERENCES, DOC_TYPES } from "@/lib/partners/validation";

function Section({ title, step, onJump, missing, children }) {
  return (
    <section className="border-b border-[var(--line)] py-4 last:border-0">
      <div className="mb-2 flex items-center gap-2">
        <h3 className="font-semibold text-[var(--ink)]">{title}</h3>
        <button type="button" onClick={() => onJump(step)} className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-purple-700 hover:bg-purple-50">
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </div>
      {missing && (
        <p className="mb-2 flex items-center gap-1.5 text-sm text-red-600">
          <CircleAlert className="h-4 w-4" /> {missing}
        </p>
      )}
      <div className="text-sm text-[var(--body-text)]">{children}</div>
    </section>
  );
}

const Row = ({ k, v }) => (
  <p className="py-0.5">
    <span className="text-[var(--muted)]">{k}: </span>
    {v || <span className="text-[var(--muted)]">—</span>}
  </p>
);

export default function StepReview({ app, onJump, onBack, onSubmitted, onError }) {
  const [consents, setConsents] = useState({ terms: false, privacy: false, public_display: false });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const missing = app.completion.missing;
  const b = app.business;
  const a = app.address;

  const submit = async () => {
    if (!consents.terms || !consents.privacy || !consents.public_display) {
      return setErr({ message: "Please accept all three consents to submit." });
    }
    setBusy(true);
    const r = await partnerApi("/api/partners/me/submit", { method: "POST", body: { consents } });
    setBusy(false);
    if (r.ok) return onSubmitted(r.data);
    setErr(onError(r));
  };

  const set = (k) => (e) => setConsents((c) => ({ ...c, [k]: e.target.checked }));

  // Group areas by city for display.
  const cities = [];
  for (const ar of app.areas) {
    let g = cities.find((x) => x.id === ar.city_id);
    if (!g) cities.push((g = { id: ar.city_id, name: ar.city_name, wide: false, locs: [], primary: false }));
    if (ar.locality_id) g.locs.push(ar.locality_name);
    else g.wide = true;
    if (ar.is_primary) g.primary = true;
  }

  return (
    <div className="mt-2">
      <p className="mb-2 text-sm text-[var(--muted)]">Check everything before you submit. You can go back to any step.</p>

      <Section title="Basic details" step={1} onJump={onJump} missing={missing[1]}>
        <Row k="Name" v={app.full_name} />
        <p className="py-0.5">
          <span className="text-[var(--muted)]">Mobile: </span>+91 {app.mobile}{" "}
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <BadgeCheck className="h-3 w-3" /> Verified
          </span>
        </p>
      </Section>

      <Section title="Categories, services & brands" step={2} onJump={onJump} missing={missing[2] || missing[3] || missing[4]}>
        {app.categories.length === 0 && <p>No categories selected.</p>}
        <ul className="space-y-2">
          {app.categories.map((c) => (
            <li key={c.id}>
              <b className="text-[var(--ink)]">{c.name}</b>
              <Row k="Services" v={(app.services[c.id] || []).map((s) => s.name).join(", ")} />
              <Row
                k="Brands"
                v={(app.brands[c.id] || []).map((x) => (x.custom ? `${x.name} (pending review)` : x.name)).join(", ")}
              />
            </li>
          ))}
        </ul>
        <div className="mt-1 flex gap-3 text-xs">
          <button type="button" className="text-purple-700 underline" onClick={() => onJump(3)}>Edit services</button>
          <button type="button" className="text-purple-700 underline" onClick={() => onJump(4)}>Edit brands</button>
        </div>
      </Section>

      <Section title="Business" step={5} onJump={onJump} missing={missing[5]}>
        <Row k="Type" v={BUSINESS_TYPES[b.business_type]} />
        <Row k="Name" v={b.business_name} />
        <Row k="Experience" v={b.experience_years != null && b.experience_years !== "" ? `${b.experience_years} years` : null} />
        <Row k="GSTIN" v={b.gstin ? `${b.gstin} (format checked, not yet verified)` : null} />
        <Row k="Email" v={b.business_email} />
        <Row k="Hours" v={b.operating_hours} />
        <Row k="Public contact" v={b.show_phone_publicly ? CONTACT_PREFERENCES[b.contact_preference] : "Not shown"} />
        <Row k="Images" v={[app.logo_url && "Logo", app.shop_image_url && "Shop photo"].filter(Boolean).join(", ")} />
        <Row
          k="Documents"
          v={app.documents.length ? app.documents.map((d) => DOC_TYPES[d.doc_type]).join(", ") : "None uploaded (optional)"}
        />
      </Section>

      <Section title="Address & service areas" step={6} onJump={onJump} missing={missing[6]}>
        <Row k="Address" v={[a.line, a.locality, a.city_name, a.state_name, a.pincode].filter(Boolean).join(", ")} />
        <ul className="mt-1 space-y-1">
          {cities.map((g) => (
            <li key={g.id}>
              <b className="text-[var(--ink)]">{g.name}</b>
              {g.primary && <span className="ml-1 text-xs text-purple-700">(primary)</span>}:{" "}
              {[g.wide && "Entire city", g.locs.length && g.locs.join(", ")].filter(Boolean).join(" + ")}
            </li>
          ))}
        </ul>
        {app.location_requests.filter((r) => r.status === "pending").length > 0 && (
          <Row
            k="Requested localities"
            v={app.location_requests.filter((r) => r.status === "pending").map((r) => `${r.requested_name} (${r.city_name})`).join(", ")}
          />
        )}
      </Section>

      <fieldset className="mt-4 space-y-3 rounded-2xl bg-purple-50/60 p-4 text-sm text-[var(--ink-soft)]">
        <legend className="sr-only">Consent</legend>
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-purple-600" checked={consents.terms} onChange={set("terms")} />
          <span>
            I agree to the{" "}
            <Link href="/terms-and-conditions" target="_blank" className="text-purple-700 underline">partner terms and conditions</Link>.
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-purple-600" checked={consents.privacy} onChange={set("privacy")} />
          <span>
            I have read the{" "}
            <Link href="/privacy-and-policy" target="_blank" className="text-purple-700 underline">privacy policy</Link>.
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-purple-600" checked={consents.public_display} onChange={set("public_display")} />
          <span>
            After approval, Mr. Service Expert may show my business name, description, categories, services, brands, locality,
            service areas, images{b.show_phone_publicly ? " and mobile number" : ""} on its website.
          </span>
        </label>
      </fieldset>

      {err && (
        <div className="mt-3">
          <FieldError msg={err.message} />
          {err.fields?.steps && (
            <ul className="mt-1 list-inside list-disc text-sm text-red-600">
              {Object.entries(err.fields.steps).map(([s, m]) => (
                <li key={s}>
                  <button type="button" className="underline" onClick={() => onJump(Number(s))}>Step {s}</button>: {m}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:justify-between">
        <button type="button" className={btnGhost} onClick={onBack} disabled={busy}>Back</button>
        <button type="button" className={btnPrimary} onClick={submit} disabled={busy || !app.completion.ready}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit application
        </button>
      </div>
    </div>
  );
}
