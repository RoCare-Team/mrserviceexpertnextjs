"use client";

import { useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { partnerApi } from "../partnerApi";
import { useCatalog, LoadState } from "../StepSelections";
import { inputCls, labelCls, btnPrimary, btnGhost, FieldError, CategoryIcon } from "../ui";
import { BUSINESS_TYPES, validGstin } from "@/lib/partners/validation";

const toggle = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

function Chip({ on, onClick, children }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onClick}
      className={`inline-flex min-h-9 items-center gap-1 rounded-full border px-3 py-1 text-sm ${on ? "border-purple-600 bg-purple-600 text-white" : "border-[var(--line-strong)] text-[var(--ink-soft)]"}`}
    >
      {on && <Check className="h-3.5 w-3.5" />} {children}
    </button>
  );
}

/**
 * Business identity + catalogue changes for an approved partner. Submitted
 * as a change request; the live profile is unchanged until an admin approves.
 */
export default function ChangeRequestForm({ app, onDone, onCancel }) {
  const [f, setF] = useState({
    business_type: app.business.business_type || "",
    business_name: app.business.business_name || "",
    gstin: app.business.gstin || "",
  });
  const [cats, setCats] = useState(app.categories.map((c) => c.id));
  const [svc, setSvc] = useState(() => Object.fromEntries(app.categories.map((c) => [c.id, (app.services[c.id] || []).map((s) => s.id)])));
  const [brands, setBrands] = useState(() =>
    Object.fromEntries(app.categories.map((c) => [c.id, (app.brands[c.id] || []).filter((b) => b.brand_id).map((b) => b.brand_id)]))
  );
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const allCats = useCatalog("/api/partner-catalog/categories");
  const ids = cats.join(",");
  const services = useCatalog(ids ? `/api/partner-catalog/services?categoryIds=${ids}` : null);
  const brandList = useCatalog(ids ? `/api/partner-catalog/brands?categoryIds=${ids}` : null);
  const byCat = (list) => {
    const m = {};
    for (const x of list || []) (m[x.category_id] ||= []).push(x);
    return m;
  };
  const svcByCat = useMemo(() => byCat(services.data), [services.data]);
  const brandByCat = useMemo(() => byCat(brandList.data), [brandList.data]);
  const catName = (id) => allCats.data?.find((c) => c.id === id);

  const submit = async (e) => {
    e.preventDefault();
    const fields = {};
    if (!f.business_type) fields.business_type = "Choose a business type.";
    if (f.business_name.trim().length < 2) fields.business_name = "Name is required.";
    const g = validGstin(f.gstin);
    if (g.error) fields.gstin = g.error;
    if (!cats.length) fields.categories = "Select at least one category.";
    for (const c of cats) if (!(svc[c] || []).length) fields[`services.${c}`] = "Select at least one service.";
    if (Object.keys(fields).length) return setErr({ message: "Please fix the highlighted fields.", fields });

    setBusy(true);
    setErr(null);
    const r = await partnerApi("/api/partners/me/change-requests", {
      method: "POST",
      body: {
        ...f,
        category_ids: cats,
        services: Object.fromEntries(cats.map((c) => [c, (svc[c] || []).filter((id) => (svcByCat[c] || []).some((s) => s.id === id))])),
        brands: Object.fromEntries(cats.map((c) => [c, { brand_ids: brands[c] || [], other: null }])),
      },
    });
    setBusy(false);
    if (r.ok) onDone(r.data);
    else setErr(r.error);
  };

  const fe = err?.fields || {};

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <p className="rounded-xl bg-purple-50 px-3 py-2 text-sm text-purple-900">
        These changes are reviewed by our team. Your profile stays live with the current details until they&apos;re approved.
      </p>
      <fieldset>
        <legend className={labelCls}>Business type</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(BUSINESS_TYPES).map(([v, label]) => (
            <label key={v} className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border-2 px-2 text-center text-sm ${f.business_type === v ? "border-purple-600 bg-purple-50" : "border-[var(--line)]"}`}>
              <input type="radio" className="sr-only" name="cr-type" checked={f.business_type === v} onChange={() => setF((s) => ({ ...s, business_type: v }))} />
              {label}
            </label>
          ))}
        </div>
        <FieldError msg={fe.business_type} />
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="cr-name" className={labelCls}>{f.business_type === "individual" ? "Technician name" : "Business / shop name"}</label>
          <input id="cr-name" className={inputCls} maxLength={150} value={f.business_name} onChange={(e) => setF((s) => ({ ...s, business_name: e.target.value }))} />
          <FieldError msg={fe.business_name} />
        </div>
        <div>
          <label htmlFor="cr-gst" className={labelCls}>GSTIN (optional)</label>
          <input id="cr-gst" className={`${inputCls} uppercase`} maxLength={15} value={f.gstin} onChange={(e) => setF((s) => ({ ...s, gstin: e.target.value }))} />
          <FieldError msg={fe.gstin} />
        </div>
      </div>

      <fieldset>
        <legend className={labelCls}>Categories</legend>
        <LoadState {...allCats} />
        <div className="flex flex-wrap gap-2">
          {(allCats.data || []).map((c) => (
            <Chip key={c.id} on={cats.includes(c.id)} onClick={() => setCats((x) => toggle(x, c.id))}>{c.name}</Chip>
          ))}
        </div>
        <FieldError msg={fe.categories} />
      </fieldset>

      {cats.map((c) => (
        <fieldset key={c} className="rounded-2xl border border-[var(--line)] p-3">
          <legend className="flex items-center gap-2 px-1 font-semibold text-[var(--ink)]">
            <CategoryIcon url={catName(c)?.url} className="h-4 w-4 text-purple-600" /> {catName(c)?.name || "Category"}
          </legend>
          <p className="mb-1 text-xs text-[var(--muted)]">Services</p>
          <div className="flex flex-wrap gap-2">
            {(svcByCat[c] || []).map((s) => (
              <Chip key={s.id} on={(svc[c] || []).includes(s.id)} onClick={() => setSvc((m) => ({ ...m, [c]: toggle(m[c] || [], s.id) }))}>{s.name}</Chip>
            ))}
          </div>
          <FieldError msg={fe[`services.${c}`]} />
          <p className="mb-1 mt-3 text-xs text-[var(--muted)]">Brands (optional)</p>
          <div className="flex flex-wrap gap-2">
            {(brandByCat[c] || []).map((b) => (
              <Chip key={b.id} on={(brands[c] || []).includes(b.id)} onClick={() => setBrands((m) => ({ ...m, [c]: toggle(m[c] || [], b.id) }))}>{b.name}</Chip>
            ))}
          </div>
        </fieldset>
      ))}

      {err && !err.fields && <FieldError msg={err.message} />}
      {err?.fields && <FieldError msg={err.message} />}
      <div className="flex gap-2">
        <button type="submit" className={btnPrimary} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />} Send for approval</button>
        <button type="button" className={btnGhost} onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
