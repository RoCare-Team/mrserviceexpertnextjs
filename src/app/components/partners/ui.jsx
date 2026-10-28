// Shared Tailwind class strings + tiny presentational bits for the partner
// pages, matching the site's purple brand tokens (globals.css).

import {
  Droplets,
  AirVent,
  WashingMachine,
  Refrigerator,
  ShowerHead,
  Microwave,
  Tv,
  CookingPot,
  Wind,
  Sparkles,
  Wrench,
  BadgeCheck,
  ShieldCheck,
  FileCheck2,
  Phone,
  Loader2,
} from "lucide-react";

export const inputCls =
  "w-full rounded-xl border border-[var(--line-strong)] bg-white px-3.5 py-2.5 text-[15px] text-[var(--ink)] outline-none transition focus:border-purple-500 focus:ring-2 focus:ring-purple-200 disabled:bg-gray-50 disabled:text-gray-500 aria-[invalid=true]:border-red-400";
export const labelCls = "mb-1.5 block text-sm font-medium text-[var(--ink-soft)]";
export const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:cursor-not-allowed disabled:opacity-60";
export const btnGhost =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--line-strong)] bg-white px-5 py-2.5 text-[15px] font-semibold text-[var(--ink-soft)] transition hover:bg-purple-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 disabled:cursor-not-allowed disabled:opacity-60";
export const cardCls = "rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm sm:p-7";

export function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <p role="alert" className="mt-1 text-sm text-red-600">
      {msg}
    </p>
  );
}

const ICONS = {
  "ro-water-purifier": Droplets,
  ac: AirVent,
  "washing-machine-repair": WashingMachine,
  "refrigerator-repair": Refrigerator,
  "geyser-repair": ShowerHead,
  "microwav-repair": Microwave,
  "led-tv-repair": Tv,
  "kitchen-chimney-repair": CookingPot,
  "air-purifier-repair": Wind,
  "vacuum-cleaner-repair": Sparkles,
};

export function CategoryIcon({ url, className = "h-6 w-6" }) {
  const Icon = ICONS[url] || Wrench;
  return <Icon className={className} aria-hidden="true" />;
}

/**
 * Honest trust badges: each states exactly what was checked.
 * "Approved" only means the listing passed review.
 */
export function TrustBadges({ verification, compact = false }) {
  const items = [
    { on: verification?.approved ?? true, icon: BadgeCheck, label: "Approved partner", title: "Profile reviewed and approved by Mr. Service Expert" },
    { on: verification?.mobile, icon: Phone, label: "Mobile verified", title: "Mobile number verified by OTP" },
    { on: verification?.identity, icon: ShieldCheck, label: "ID verified", title: "Identity document checked by our team" },
    { on: verification?.gst, icon: FileCheck2, label: "GST verified", title: "GST registration checked by our team" },
  ].filter((i) => i.on);
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map(({ icon: Icon, label, title }) => (
        <li
          key={label}
          title={title}
          className={`inline-flex items-center gap-1 rounded-full bg-emerald-50 font-medium text-emerald-700 ${compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"}`}
        >
          <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden="true" /> {label}
        </li>
      ))}
    </ul>
  );
}

/** Shared Back / Continue footer for steps 2–6. */
export function StepNav({ onBack, busy, continueLabel = "Save & continue", disabled }) {
  return (
    <div className="mt-7 flex flex-col-reverse gap-3 border-t border-[var(--line)] pt-5 sm:flex-row sm:justify-between">
      {onBack ? (
        <button type="button" className={btnGhost} onClick={onBack} disabled={busy}>
          Back
        </button>
      ) : (
        <span />
      )}
      <button type="submit" className={btnPrimary} disabled={busy || disabled}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />} {continueLabel}
      </button>
    </div>
  );
}

