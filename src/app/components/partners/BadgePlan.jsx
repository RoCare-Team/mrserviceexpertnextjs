"use client";

import { useState } from "react";
import { Award, Check, Loader2, Lock } from "lucide-react";
import { partnerApi } from "./partnerApi";
import { btnPrimary, inputCls } from "./ui";
import { FREE_LIMITS } from "@/lib/partners/plan";

const fallbackBadge = { name: "Featured Partner", price: 499, days: 365, period: "1 year", active: false, pending_days: 0 };

/** "1 city · 2 categories · 2 brands per category" */
export const FREE_PLAN_TEXT = `${FREE_LIMITS.cities} city · ${FREE_LIMITS.categories} categories · ${FREE_LIMITS.brandsPerCategory} brands per category`;

/**
 * Inline note on the Address / Categories / Brands steps. `over` = reasons
 * from plan.js for the CURRENT (unsaved) selection.
 */
export function PlanNotice({ app, over, kind }) {
  const b = app?.badge || fallbackBadge;
  const hasBadge = b.active || b.pending_days > 0;
  const registering = app?.status !== "approved";

  if (!over.length) {
    return (
      <p className="mt-4 flex items-start gap-2 rounded-xl bg-purple-50/70 px-3 py-2 text-xs text-purple-900">
        <Award className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
        <span>
          Free plan: <b>{FREE_PLAN_TEXT}</b>. Want more {kind}? The <b>{b.name}</b> badge (₹{b.price} / {b.period}) removes the limits and
          lists you <b>first</b> in your areas.
        </span>
      </p>
    );
  }
  if (hasBadge) {
    return (
      <p className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
        <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          Above the free plan ({over.join(", ")}) — covered by your {b.name} badge{b.pending_days > 0 && !b.active ? " (starts on approval)" : ""}.
        </span>
      </p>
    );
  }
  return (
    <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
      <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>
        <b>{b.name} badge needed:</b> {over.join(", ")}. The free plan allows {FREE_PLAN_TEXT}.{" "}
        {registering
          ? `You can pay ₹${b.price} on the Review step — your ${b.period} starts when your profile is approved.`
          : `Without the badge only the free-plan items stay live; the rest are saved but hidden. Get it from Wallet → ₹${b.price}.`}
      </span>
    </div>
  );
}

/** Pay for the badge (registration Review step). Redirects to Easebuzz. */
export function BadgeBuyBox({ app, required, over = [] }) {
  const b = app?.badge || fallbackBadge;
  const [email, setEmail] = useState(app?.business?.business_email || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (b.active || b.pending_days > 0) {
    return (
      <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <Award className="h-6 w-6 shrink-0 text-amber-500" aria-hidden="true" />
        <div>
          <b>{b.name} badge {b.active ? "active" : "paid"}.</b>{" "}
          {b.active ? "You'll be listed first in your areas." : `Your ${b.period} starts the day your profile is approved.`}
        </div>
      </div>
    );
  }

  const buy = async () => {
    setErr("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setErr("Enter a valid email for the payment receipt.");
    setBusy(true);
    const r = await partnerApi("/api/partners/me/badge", { method: "POST", body: { email: email.trim() } });
    if (r.ok) return window.location.assign(r.data.payUrl);
    setBusy(false);
    setErr(r.error.message);
  };

  return (
    <section
      className={`mt-4 rounded-2xl border p-4 ${required ? "border-amber-300 bg-gradient-to-br from-amber-50 to-white" : "border-[var(--line)] bg-gradient-to-br from-amber-50/60 to-white"}`}
      aria-labelledby="badge-buy-h"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <Award className="h-6 w-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id="badge-buy-h" className="font-bold text-[var(--ink)]">
            {required ? `${b.name} badge required` : `Become a ${b.name}`} · ₹{b.price} / {b.period}
          </h3>
          {required ? (
            <p className="mt-1 text-sm text-[var(--body-text)]">
              Your selection is above the free plan: <b>{over.join(", ")}</b>. Get the badge to submit — or go back and reduce your selection to{" "}
              {FREE_PLAN_TEXT}.
            </p>
          ) : (
            <p className="mt-1 text-sm text-[var(--body-text)]">Optional — get listed above other partners, with a badge on your card.</p>
          )}
          <ul className="mt-2 space-y-0.5 text-xs text-[var(--muted)]">
            <li>• No limits on cities, categories and brands.</li>
            <li>• Shown first in your city and localities.</li>
            <li>• Your {b.period} starts when your profile is approved. If it isn&apos;t approved, we refund you.</li>
          </ul>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
            <label htmlFor="badge-email" className="sr-only">Email for receipt</label>
            <input
              id="badge-email"
              type="email"
              className={`${inputCls} sm:max-w-xs`}
              placeholder="Email for receipt"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <button type="button" className={btnPrimary} onClick={buy} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Pay ₹{b.price}
            </button>
          </div>
          {err && <p className="mt-2 text-sm font-medium text-red-700">{err}</p>}
        </div>
      </div>
    </section>
  );
}
