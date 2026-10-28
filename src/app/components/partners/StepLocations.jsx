"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapPin, Plus, X, Loader2 } from "lucide-react";
import { partnerApi } from "./partnerApi";
import { useCatalog, LoadState } from "./StepSelections";
import { inputCls, labelCls, btnGhost, FieldError, StepNav } from "./ui";

/** Debounced city typeahead over /api/partner-catalog/cities. */
export function CitySearch({ stateId, onPick, placeholder = "Type a city name…", label, excludeIds = [] }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(0);
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!open) return;
    timer.current = setTimeout(async () => {
      setBusy(true);
      const qs = new URLSearchParams({ q: q.trim() });
      if (stateId) qs.set("stateId", stateId);
      const r = await partnerApi(`/api/partner-catalog/cities?${qs}`);
      setBusy(false);
      setItems(r.ok ? r.data.filter((c) => !excludeIds.includes(c.id)) : []);
      setActive(0);
    }, 250);
    return () => clearTimeout(timer.current);
    // excludeIds is compared by content on purpose
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, stateId, open, excludeIds.join(",")]);

  const pick = (c) => {
    onPick(c);
    setQ("");
    setOpen(false);
  };

  const onKey = (e) => {
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") (e.preventDefault(), setActive((a) => Math.min(a + 1, items.length - 1)));
    else if (e.key === "ArrowUp") (e.preventDefault(), setActive((a) => Math.max(a - 1, 0)));
    else if (e.key === "Enter") (e.preventDefault(), pick(items[active]));
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className="relative">
      {label && <label htmlFor={id} className={labelCls}>{label}</label>}
      <input
        id={id}
        role="combobox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-autocomplete="list"
        className={inputCls}
        value={q}
        placeholder={placeholder}
        onChange={(e) => (setQ(e.target.value), setOpen(true))}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={onKey}
        autoComplete="off"
      />
      {open && (
        <ul id={`${id}-list`} role="listbox" className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-[var(--line)] bg-white py-1 shadow-lg">
          {busy && (
            <li className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--muted)]">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching…
            </li>
          )}
          {!busy && !items.length && <li className="px-3 py-2 text-sm text-[var(--muted)]">No matching city.</li>}
          {!busy &&
            items.map((c, i) => (
              <li
                key={c.id}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => (e.preventDefault(), pick(c))}
                className={`cursor-pointer px-3 py-2 text-sm ${i === active ? "bg-purple-50 text-purple-800" : "text-[var(--ink-soft)]"}`}
              >
                <b>{c.name}</b>
                {c.state && <span className="text-[var(--muted)]"> · {c.state}</span>}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

function initialCoverage(app) {
  const list = [];
  for (const a of app.areas) {
    let g = list.find((x) => x.city_id === a.city_id);
    if (!g) {
      g = { city_id: a.city_id, city_name: a.city_name, city_wide: false, localities: [], requests: [] };
      list.push(g);
    }
    if (a.locality_id) g.localities.push(a.locality_id);
    else g.city_wide = true;
  }
  for (const r of app.location_requests.filter((x) => x.status === "pending")) {
    const g = list.find((x) => x.city_id === r.city_id);
    if (g) g.requests.push(r.requested_name);
  }
  return list;
}

export default function StepLocations({ app, onSave, onBack, submitLabel }) {
  const states = useCatalog("/api/partner-catalog/states");
  const [addr, setAddr] = useState({
    line: app.address.line || "",
    state_id: app.address.state_id || "",
    city_id: app.address.city_id || "",
    city_name: app.address.city_name || "",
    locality: app.address.locality || "",
    pincode: app.address.pincode || "",
  });
  const [cov, setCov] = useState(() => initialCoverage(app));
  const [primary, setPrimary] = useState(() => app.areas.find((a) => a.is_primary)?.city_id || app.areas[0]?.city_id || null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const setA = (k) => (e) => setAddr((s) => ({ ...s, [k]: e.target.value }));
  const update = (cityId, patch) => setCov((list) => list.map((g) => (g.city_id === cityId ? { ...g, ...patch } : g)));

  const addCity = (c) => {
    if (cov.some((g) => g.city_id === c.id)) return;
    // A city without localities can only be served city-wide.
    setCov((list) => [...list, { city_id: c.id, city_name: c.name, city_wide: true, localities: [], requests: [] }]);
    if (!primary) setPrimary(c.id);
  };
  const removeCity = (cityId) => {
    setCov((list) => list.filter((g) => g.city_id !== cityId));
    if (primary === cityId) setPrimary(cov.find((g) => g.city_id !== cityId)?.city_id || null);
  };

  const submit = async (e) => {
    e.preventDefault();
    const fields = {};
    if (addr.line.trim().length < 5) fields["address.line"] = "Enter your shop / business address.";
    if (!addr.state_id) fields["address.state_id"] = "Choose a state.";
    if (!addr.city_id) fields["address.city_id"] = "Choose a city.";
    if (!/^[1-9]\d{5}$/.test(addr.pincode)) fields["address.pincode"] = "Enter a valid 6-digit pincode.";
    if (!cov.length) fields.areas = "Add at least one city you serve.";
    for (const g of cov) {
      if (!g.city_wide && !g.localities.length) fields.areas = `For ${g.city_name}, choose "Entire city" or at least one locality.`;
    }
    if (Object.keys(fields).length) return setErr({ message: "Please fix the highlighted fields.", fields });

    const ordered = [...cov].sort((a, b) => (a.city_id === primary ? -1 : b.city_id === primary ? 1 : 0));
    const areas = [];
    for (const g of ordered) {
      if (g.city_wide) areas.push({ city_id: g.city_id, locality_id: null });
      for (const l of g.localities) areas.push({ city_id: g.city_id, locality_id: l });
    }
    areas[0].is_primary = true;
    const locality_requests = cov.flatMap((g) => g.requests.map((name) => ({ city_id: g.city_id, name })));

    setBusy(true);
    const error = await onSave({
      address: { line: addr.line, state_id: Number(addr.state_id), city_id: Number(addr.city_id), locality: addr.locality, pincode: addr.pincode },
      areas,
      locality_requests,
    });
    setBusy(false);
    setErr(error);
  };

  const fe = err?.fields || {};

  return (
    <form onSubmit={submit} noValidate className="mt-4 space-y-7">
      <section aria-labelledby="addr-h">
        <h3 id="addr-h" className="mb-3 font-semibold text-[var(--ink)]">Business address</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="a-line" className={labelCls}>Shop / office address *</label>
            <input id="a-line" className={inputCls} value={addr.line} onChange={setA("line")} maxLength={255} aria-invalid={!!fe["address.line"]} />
            <FieldError msg={fe["address.line"]} />
          </div>
          <div>
            <label htmlFor="a-state" className={labelCls}>State *</label>
            <select
              id="a-state"
              className={inputCls}
              value={addr.state_id}
              onChange={(e) => setAddr((s) => ({ ...s, state_id: e.target.value, city_id: "", city_name: "" }))}
              aria-invalid={!!fe["address.state_id"]}
            >
              <option value="">{states.loading ? "Loading…" : "Select state"}</option>
              {(states.data || []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <FieldError msg={fe["address.state_id"] || states.error} />
          </div>
          <div>
            {addr.city_id ? (
              <>
                <span className={labelCls}>City *</span>
                <p className="flex min-h-11 items-center justify-between rounded-xl border border-[var(--line-strong)] px-3.5">
                  {addr.city_name}
                  <button type="button" className="text-sm text-purple-700 underline" onClick={() => setAddr((s) => ({ ...s, city_id: "", city_name: "" }))}>
                    Change
                  </button>
                </p>
              </>
            ) : (
              <CitySearch
                label="City *"
                stateId={addr.state_id || null}
                placeholder={addr.state_id ? "Search city…" : "Choose a state first"}
                onPick={(c) => setAddr((s) => ({ ...s, city_id: c.id, city_name: c.name }))}
              />
            )}
            <FieldError msg={fe["address.city_id"]} />
          </div>
          <div>
            <label htmlFor="a-loc" className={labelCls}>Locality / area</label>
            <input id="a-loc" className={inputCls} value={addr.locality} onChange={setA("locality")} maxLength={150} placeholder="e.g. Badshahpur" />
            <FieldError msg={fe["address.locality"]} />
          </div>
          <div>
            <label htmlFor="a-pin" className={labelCls}>Pincode *</label>
            <input id="a-pin" className={inputCls} inputMode="numeric" value={addr.pincode} onChange={(e) => setAddr((s) => ({ ...s, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))} aria-invalid={!!fe["address.pincode"]} />
            <FieldError msg={fe["address.pincode"]} />
          </div>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          Only your locality and city are shown publicly — never your full street address.
        </p>
      </section>

      <section aria-labelledby="cov-h">
        <h3 id="cov-h" className="font-semibold text-[var(--ink)]">Where do you provide service?</h3>
        <p className="mb-3 text-sm text-[var(--muted)]">
          Your business address doesn&apos;t decide where you appear. You&apos;ll be listed on a city&apos;s page only if you choose
          <b> Entire city</b>, and on a locality&apos;s page only if you select that locality.
        </p>

        <div className="space-y-3">
          {cov.map((g) => (
            <CoverageCity
              key={g.city_id}
              g={g}
              primary={primary === g.city_id}
              onPrimary={() => setPrimary(g.city_id)}
              onChange={(patch) => update(g.city_id, patch)}
              onRemove={() => removeCity(g.city_id)}
            />
          ))}
        </div>

        <div className="mt-4 max-w-md">
          <CitySearch label={cov.length ? "Add another city" : "Add a city you serve"} onPick={addCity} excludeIds={cov.map((g) => g.city_id)} />
        </div>
        <FieldError msg={fe.areas || fe.locality_requests} />
      </section>

      {err && !err.fields && <FieldError msg={err.message} />}
      <StepNav onBack={onBack} busy={busy} {...(submitLabel ? { continueLabel: submitLabel } : {})} />
    </form>
  );
}

function CoverageCity({ g, primary, onPrimary, onChange, onRemove }) {
  const locs = useCatalog(`/api/partner-catalog/localities?cityId=${g.city_id}`);
  const [reqText, setReqText] = useState("");
  const hasLocalities = (locs.data || []).length > 0;

  const toggleLoc = (id) =>
    onChange({ localities: g.localities.includes(id) ? g.localities.filter((x) => x !== id) : [...g.localities, id] });

  const addRequest = () => {
    const name = reqText.replace(/\s+/g, " ").trim();
    if (!name || g.requests.some((r) => r.toLowerCase() === name.toLowerCase())) return;
    onChange({ requests: [...g.requests, name] });
    setReqText("");
  };

  return (
    <div className="rounded-2xl border border-[var(--line)] p-4">
      <div className="flex flex-wrap items-center gap-3">
        <MapPin className="h-5 w-5 text-purple-600" />
        <b className="text-[var(--ink)]">{g.city_name}</b>
        <label className="inline-flex items-center gap-1.5 text-xs text-[var(--muted)]">
          <input type="radio" name="primary-city" checked={primary} onChange={onPrimary} className="accent-purple-600" /> Primary area
        </label>
        <button type="button" onClick={onRemove} className="ml-auto rounded-lg p-2 hover:bg-red-50" aria-label={`Remove ${g.city_name}`}>
          <X className="h-4 w-4 text-red-600" />
        </button>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-[var(--ink-soft)]">
        <input type="checkbox" className="h-4 w-4 accent-purple-600" checked={g.city_wide} onChange={(e) => onChange({ city_wide: e.target.checked })} />
        <span>
          <b>Entire city</b> — list me on {g.city_name} service pages
        </span>
      </label>

      <LoadState {...locs} />
      {hasLocalities && (
        <fieldset className="mt-3">
          <legend className="mb-2 text-sm text-[var(--muted)]">Or / also specific localities (listed on each locality&apos;s page):</legend>
          <div className="flex flex-wrap gap-2">
            {locs.data.map((l) => {
              const on = g.localities.includes(l.id);
              return (
                <label
                  key={l.id}
                  className={`inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-purple-600 ${
                    on ? "border-purple-600 bg-purple-50 text-purple-800" : "border-[var(--line-strong)] text-[var(--ink-soft)]"
                  }`}
                >
                  <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleLoc(l.id)} />
                  {l.name}
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-3">
        <p className="text-xs text-[var(--muted)]">Locality not listed? Request it — our team will review and add it.</p>
        <div className="mt-1 flex max-w-md gap-2">
          <label htmlFor={`req-${g.city_id}`} className="sr-only">Request a locality in {g.city_name}</label>
          <input
            id={`req-${g.city_id}`}
            className={inputCls}
            value={reqText}
            maxLength={120}
            placeholder="Locality name"
            onChange={(e) => setReqText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addRequest())}
          />
          <button type="button" className={btnGhost} onClick={addRequest} aria-label="Add locality request">
            <Plus className="h-4 w-4" />
          </button>
        </div>
        {g.requests.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {g.requests.map((r) => (
              <li key={r} className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-800">
                {r} · pending review
                <button type="button" aria-label={`Remove ${r}`} onClick={() => onChange({ requests: g.requests.filter((x) => x !== r) })}>
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
