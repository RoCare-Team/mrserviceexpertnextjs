"use client";

import { useEffect, useState } from "react";
import { Lock, Loader2, Check } from "lucide-react";
import { partnerApi } from "../partnerApi";
import { btnPrimary, btnGhost, cardCls } from "../ui";
import { FREE_LIMITS } from "@/lib/partners/plan";
import { FREE_PLAN_TEXT } from "../BadgePlan";

/**
 * No active badge → shows which cities / categories / brands are hidden
 * (above the free plan) and lets the partner choose what stays live.
 */
export default function PlanLimitsCard({ app }) {
  const [items, setItems] = useState(null);
  const [edit, setEdit] = useState(false);
  const [cats, setCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    if (app.status !== "approved" || app.badge?.active) return;
    partnerApi("/api/partners/me/badge").then((r) => r.ok && setItems(r.data.items));
  }, [app.status, app.badge?.active]);

  if (!items || !items.count) return null;

  const open = () => {
    setCats(items.categories.filter((c) => !c.locked).map((c) => c.id));
    setBrands(items.brands.filter((b) => !b.locked).map((b) => b.id));
    setMsg(null);
    setEdit(true);
  };
  const toggleCat = (id) =>
    setCats((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < FREE_LIMITS.categories ? [...s, id] : s));
  const toggleBrand = (b) =>
    setBrands((s) => {
      if (s.includes(b.id)) return s.filter((x) => x !== b.id);
      const inCat = items.brands.filter((x) => x.category_id === b.category_id && s.includes(x.id)).length;
      return inCat < FREE_LIMITS.brandsPerCategory ? [...s, b.id] : s;
    });
  const save = async () => {
    setBusy(true);
    const r = await partnerApi("/api/partners/me/badge", { method: "PATCH", body: { category_ids: cats, brand_ids: brands } });
    setBusy(false);
    if (!r.ok) return setMsg({ bad: true, text: r.error.message });
    setItems(r.data.items);
    setEdit(false);
    setMsg({ text: "Saved. Your listing now shows these." });
  };

  const hidden = (list) => list.filter((x) => x.locked).map((x) => x.name);
  const catName = Object.fromEntries(items.categories.map((c) => [c.id, c.name]));
  const chip = (on) =>
    `inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm transition ${
      on ? "border-purple-600 bg-purple-50 font-semibold text-purple-800" : "border-[var(--line)] bg-white text-[var(--ink-soft)] hover:border-purple-300"
    }`;

  return (
    <section className={`${cardCls} border-amber-200`}>
      <h2 className="flex items-center gap-2 text-lg font-bold text-[var(--ink)]">
        <Lock className="h-5 w-5 text-amber-600" /> {items.count} item{items.count === 1 ? "" : "s"} hidden on the free plan
      </h2>
      <p className="mt-1 text-sm text-[var(--body-text)]">
        Without the badge your listing shows {FREE_PLAN_TEXT}. The rest is saved and comes back as soon as you get the badge.
      </p>
      <ul className="mt-3 space-y-1 text-sm">
        {hidden(items.cities).length > 0 && (
          <li>
            <b>Cities:</b> {hidden(items.cities).join(", ")} <span className="text-xs text-[var(--muted)]">(your primary city stays live — change it in Profile → Address & areas)</span>
          </li>
        )}
        {hidden(items.categories).length > 0 && <li><b>Categories:</b> {hidden(items.categories).join(", ")}</li>}
        {items.brands.some((b) => b.locked) && (
          <li>
            <b>Brands:</b> {items.brands.filter((b) => b.locked).map((b) => `${b.name} (${catName[b.category_id] || ""})`).join(", ")}
          </li>
        )}
      </ul>
      {msg && <p className={`mt-2 text-sm font-medium ${msg.bad ? "text-red-700" : "text-emerald-700"}`}>{msg.text}</p>}

      {!edit ? (
        (items.categories.length > FREE_LIMITS.categories || items.brands.some((b) => b.locked)) && (
          <button type="button" className={`${btnGhost} mt-3`} onClick={open}>Choose what stays live</button>
        )
      ) : (
        <div className="mt-4 space-y-4 rounded-2xl bg-[var(--surface-soft)] p-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-[var(--ink)]">Categories (up to {FREE_LIMITS.categories})</p>
            <div className="flex flex-wrap gap-2">
              {items.categories.map((c) => (
                <button key={c.id} type="button" className={chip(cats.includes(c.id))} aria-pressed={cats.includes(c.id)} onClick={() => toggleCat(c.id)}>
                  {cats.includes(c.id) && <Check className="h-3.5 w-3.5" />} {c.name}
                </button>
              ))}
            </div>
          </div>
          {items.categories
            .filter((c) => cats.includes(c.id) && items.brands.some((b) => b.category_id === c.id))
            .map((c) => (
              <div key={c.id}>
                <p className="mb-2 text-sm font-semibold text-[var(--ink)]">{c.name} brands (up to {FREE_LIMITS.brandsPerCategory})</p>
                <div className="flex flex-wrap gap-2">
                  {items.brands
                    .filter((b) => b.category_id === c.id)
                    .map((b) => (
                      <button key={b.id} type="button" className={chip(brands.includes(b.id))} aria-pressed={brands.includes(b.id)} onClick={() => toggleBrand(b)}>
                        {brands.includes(b.id) && <Check className="h-3.5 w-3.5" />} {b.name}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btnPrimary} onClick={save} disabled={busy || !cats.length}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save
            </button>
            <button type="button" className={btnGhost} onClick={() => setEdit(false)} disabled={busy}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  );
}
