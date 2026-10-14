"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { partnerApi } from "./partnerApi";
import { CategoryIcon, FieldError, StepNav, inputCls } from "./ui";

/** Fetch a catalogue resource; returns { data, loading, error, retry }. */
export function useCatalog(url) {
  const [state, setState] = useState({ data: null, loading: !!url, error: null });
  const [nonce, setNonce] = useState(0);
  useEffect(() => {
    if (!url) return;
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    partnerApi(url).then((r) => {
      if (!alive) return;
      setState(r.ok ? { data: r.data, loading: false, error: null } : { data: null, loading: false, error: r.error.message });
    });
    return () => {
      alive = false;
    };
  }, [url, nonce]);
  return { ...state, retry: () => setNonce((n) => n + 1) };
}

export function LoadState({ loading, error, retry }) {
  if (loading)
    return (
      <p className="flex items-center gap-2 py-8 text-sm text-[var(--muted)]">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
      </p>
    );
  if (error)
    return (
      <p className="py-6 text-sm text-red-600">
        {error}{" "}
        <button type="button" className="underline" onClick={retry}>
          Try again
        </button>
      </p>
    );
  return null;
}

/** Toggleable pill used for services and brands. */
function Chip({ on, onClick, children }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={onClick}
      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-purple-600 ${
        on ? "border-purple-600 bg-purple-600 text-white" : "border-[var(--line-strong)] bg-white text-[var(--ink-soft)] hover:border-purple-400"
      }`}
    >
      {on && <Check className="h-3.5 w-3.5" />} {children}
    </button>
  );
}

const toggle = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

function useSubmit(onSave) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const run = async (data) => {
    setBusy(true);
    const e = await onSave(data);
    setBusy(false);
    setErr(e);
  };
  return { busy, err, setErr, run };
}

/* ── Step 2 ─────────────────────────────────────────────────────────── */

export function StepCategories({ app, onSave, onBack }) {
  const cats = useCatalog("/api/partner-catalog/categories");
  const [selected, setSelected] = useState(() => app.categories.map((c) => c.id));
  const { busy, err, setErr, run } = useSubmit(onSave);

  const submit = (e) => {
    e.preventDefault();
    if (!selected.length) return setErr({ message: "Select at least one category." });
    run({ category_ids: selected });
  };

  const removed = app.categories.filter((c) => !selected.includes(c.id));

  return (
    <form onSubmit={submit} noValidate>
      <p className="mb-5 text-sm text-[var(--muted)]">Which appliances do you service? Select all that apply.</p>
      <LoadState {...cats} />
      {cats.data && (
        <div role="group" aria-label="Appliance categories" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {cats.data.map((c) => {
            const on = selected.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => setSelected((s) => toggle(s, c.id))}
                className={`relative flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 ${
                  on ? "border-purple-600 bg-purple-50 text-purple-800" : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-purple-300"
                }`}
              >
                {on && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white">
                    <Check className="h-3 w-3" />
                  </span>
                )}
                <CategoryIcon url={c.url} className="h-8 w-8" />
                <span className="text-sm font-semibold leading-tight">{c.name}</span>
              </button>
            );
          })}
        </div>
      )}
      {removed.length > 0 && (
        <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Removing {removed.map((c) => c.name).join(", ")} will also clear its saved services and brands.
        </p>
      )}
      <FieldError msg={err?.message} />
      <StepNav onBack={onBack} busy={busy} disabled={!cats.data} />
    </form>
  );
}

/* ── Step 3 ─────────────────────────────────────────────────────────── */

export function StepServices({ app, onSave, onBack }) {
  const ids = app.categories.map((c) => c.id).join(",");
  const svc = useCatalog(ids ? `/api/partner-catalog/services?categoryIds=${ids}` : null);
  const [picked, setPicked] = useState(() =>
    Object.fromEntries(app.categories.map((c) => [c.id, (app.services[c.id] || []).map((s) => s.id)]))
  );
  const { busy, err, setErr, run } = useSubmit(onSave);

  const byCat = useMemo(() => {
    const m = {};
    for (const s of svc.data || []) (m[s.category_id] ||= []).push(s);
    return m;
  }, [svc.data]);

  const submit = (e) => {
    e.preventDefault();
    const fields = {};
    for (const c of app.categories) if (!picked[c.id]?.length) fields[`services.${c.id}`] = "Select at least one service.";
    if (Object.keys(fields).length) return setErr({ message: "Select at least one service for every category.", fields });
    // Only send ids that are still offered (drops any deactivated service).
    const services = Object.fromEntries(
      app.categories.map((c) => [c.id, picked[c.id].filter((id) => (byCat[c.id] || []).some((s) => s.id === id))])
    );
    run({ services });
  };

  return (
    <form onSubmit={submit} noValidate>
      <p className="mb-5 text-sm text-[var(--muted)]">Choose the services you offer for each category.</p>
      <LoadState {...svc} />
      {svc.data && (
        <div className="space-y-6">
          {app.categories.map((c) => (
            <fieldset key={c.id}>
              <legend className="mb-2 flex items-center gap-2 font-semibold text-[var(--ink)]">
                <CategoryIcon url={c.url} className="h-5 w-5 text-purple-600" /> {c.name}
                <button
                  type="button"
                  className="ml-2 text-xs font-medium text-purple-700 underline"
                  onClick={() => setPicked((p) => ({ ...p, [c.id]: (byCat[c.id] || []).map((s) => s.id) }))}
                >
                  Select all
                </button>
              </legend>
              <div className="flex flex-wrap gap-2">
                {(byCat[c.id] || []).map((s) => (
                  <Chip key={s.id} on={picked[c.id]?.includes(s.id)} onClick={() => setPicked((p) => ({ ...p, [c.id]: toggle(p[c.id] || [], s.id) }))}>
                    {s.name}
                  </Chip>
                ))}
              </div>
              <FieldError msg={err?.fields?.[`services.${c.id}`]} />
            </fieldset>
          ))}
        </div>
      )}
      {err && !err.fields && <FieldError msg={err.message} />}
      <StepNav onBack={onBack} busy={busy} disabled={!svc.data} />
    </form>
  );
}

/* ── Step 4 ─────────────────────────────────────────────────────────── */

export function StepBrands({ app, onSave, onBack }) {
  const ids = app.categories.map((c) => c.id).join(",");
  const br = useCatalog(ids ? `/api/partner-catalog/brands?categoryIds=${ids}` : null);
  const [picked, setPicked] = useState(() =>
    Object.fromEntries(
      app.categories.map((c) => [c.id, (app.brands[c.id] || []).filter((b) => b.brand_id).map((b) => b.brand_id)])
    )
  );
  const [other, setOther] = useState(() =>
    Object.fromEntries(app.categories.map((c) => [c.id, (app.brands[c.id] || []).find((b) => b.custom)?.name || ""]))
  );
  const [otherOpen, setOtherOpen] = useState(() =>
    Object.fromEntries(app.categories.map((c) => [c.id, !!(app.brands[c.id] || []).find((b) => b.custom)]))
  );
  const { busy, err, setErr, run } = useSubmit(onSave);

  const byCat = useMemo(() => {
    const m = {};
    for (const b of br.data || []) (m[b.category_id] ||= []).push(b);
    return m;
  }, [br.data]);

  const submit = (e) => {
    e.preventDefault();
    const fields = {};
    const brands = {};
    for (const c of app.categories) {
      const custom = otherOpen[c.id] ? other[c.id].trim() : "";
      if (!picked[c.id]?.length && !custom) fields[`brands.${c.id}`] = "Select at least one brand, or enter one under Other.";
      brands[c.id] = { brand_ids: picked[c.id] || [], other: custom || null };
    }
    if (Object.keys(fields).length) return setErr({ message: "Select brands for every category.", fields });
    run({ brands });
  };

  return (
    <form onSubmit={submit} noValidate>
      <p className="mb-5 text-sm text-[var(--muted)]">Which brands do you service in each category?</p>
      <LoadState {...br} />
      {br.data && (
        <div className="space-y-6">
          {app.categories.map((c) => (
            <fieldset key={c.id}>
              <legend className="mb-2 flex items-center gap-2 font-semibold text-[var(--ink)]">
                <CategoryIcon url={c.url} className="h-5 w-5 text-purple-600" /> {c.name}
              </legend>
              <div className="flex flex-wrap gap-2">
                {(byCat[c.id] || []).map((b) => (
                  <Chip key={b.id} on={picked[c.id]?.includes(b.id)} onClick={() => setPicked((p) => ({ ...p, [c.id]: toggle(p[c.id] || [], b.id) }))}>
                    {b.name}
                  </Chip>
                ))}
                <Chip on={!!otherOpen[c.id]} onClick={() => setOtherOpen((o) => ({ ...o, [c.id]: !o[c.id] }))}>
                  Other
                </Chip>
              </div>
              {otherOpen[c.id] && (
                <div className="mt-3 max-w-sm">
                  <label htmlFor={`other-${c.id}`} className="sr-only">Other brand for {c.name}</label>
                  <input
                    id={`other-${c.id}`}
                    className={inputCls}
                    placeholder="Brand name (reviewed by our team)"
                    value={other[c.id]}
                    maxLength={60}
                    onChange={(e) => setOther((o) => ({ ...o, [c.id]: e.target.value }))}
                  />
                </div>
              )}
              <FieldError msg={err?.fields?.[`brands.${c.id}`]} />
            </fieldset>
          ))}
        </div>
      )}
      {err && !err.fields && <FieldError msg={err.message} />}
      <StepNav onBack={onBack} busy={busy} disabled={!br.data} />
    </form>
  );
}
