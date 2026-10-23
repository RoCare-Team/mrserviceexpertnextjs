"use client";

import { useEffect, useState } from "react";
import { Inbox, CheckCircle2, XCircle, Percent, Coins, Star, IndianRupee, ArrowRight, Circle, ShieldCheck, Loader2 } from "lucide-react";
import { partnerApi } from "../partnerApi";
import { cardCls, btnPrimary } from "../ui";

function Stat({ icon: Icon, label, value, hint, tone = "purple", onClick }) {
  const tones = {
    purple: "bg-purple-50 text-purple-700",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    gray: "bg-gray-100 text-gray-600",
  };
  const Tag = onClick ? "button" : "div";
  return (
    <Tag onClick={onClick} className={`rounded-2xl border border-[var(--line)] bg-white p-4 text-left shadow-sm ${onClick ? "transition hover:shadow-md" : ""}`}>
      <span className={`inline-flex rounded-xl p-2 ${tones[tone]}`}><Icon className="h-5 w-5" /></span>
      <p className="mt-3 text-2xl font-bold text-[var(--ink)]">{value}</p>
      <p className="text-sm text-[var(--muted)]">{label}</p>
      {hint && <p className="mt-0.5 text-xs text-[var(--muted)]">{hint}</p>}
    </Tag>
  );
}

const monthLabel = (ym) => new Date(`${ym}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short" });

export default function OverviewTab({ app, go, newLeads }) {
  const [s, setS] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    partnerApi("/api/partners/me/overview").then((r) => (r.ok ? setS(r.data) : setErr(r.error.message)));
  }, [newLeads]);

  if (err) return <p className="text-sm text-red-600">{err}</p>;
  if (!s) return <p className="flex items-center gap-2 text-sm text-[var(--muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>;

  const max = Math.max(1, ...s.months.map((m) => m.leads));
  // Checklist of things that improve trust / conversions.
  const checklist = [
    { done: !!app.logo_url, text: "Add a logo or profile photo", tab: "profile" },
    { done: app.photos?.length > 0 || !!app.shop_image_url, text: "Add photos of your shop / work", tab: "profile" },
    { done: (app.business.description || "").length >= 80, text: "Write a description (80+ characters)", tab: "profile" },
    { done: !!app.business.operating_hours, text: "Add your working hours", tab: "profile" },
    { done: app.verification.identity, text: "Get ID verified — upload Aadhaar / ID proof", tab: "profile" },
    { done: s.balance >= s.low_balance_alert, text: `Keep at least ${s.low_balance_alert} coins to accept leads`, tab: "wallet" },
  ];
  const done = checklist.filter((c) => c.done).length;

  return (
    <div className="space-y-5">
      {s.pending_now > 0 && (
        <button onClick={() => go("leads")} className="flex w-full items-center gap-3 rounded-2xl bg-amber-500 p-4 text-left text-white shadow-sm">
          <Inbox className="h-6 w-6" />
          <span className="flex-1 font-semibold">
            {s.pending_now} new booking{s.pending_now > 1 ? "s" : ""} waiting — accept within 30 minutes
          </span>
          <ArrowRight className="h-5 w-5" />
        </button>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat icon={Inbox} label="Leads today" value={s.leads_today} onClick={() => go("leads")} />
        <Stat icon={CheckCircle2} tone="green" label="Accepted this month" value={s.accepted_month} hint={`${s.completed_month} completed`} />
        <Stat icon={XCircle} tone="gray" label="Missed this month" value={s.missed_month} hint="Rejected or expired" />
        <Stat icon={Percent} tone="purple" label="Acceptance rate" value={s.acceptance_rate === null ? "—" : `${s.acceptance_rate}%`} hint="Last 30 days" />
        <Stat icon={Coins} tone="amber" label="Coin balance" value={s.balance.toLocaleString("en-IN")} hint={`${s.coins_spent_month} spent this month`} onClick={() => go("wallet")} />
        <Stat icon={IndianRupee} tone="green" label="Booked service value" value={`₹${s.service_value_month.toLocaleString("en-IN")}`} hint="This month (accepted leads)" />
        <Stat icon={IndianRupee} tone="green" label="Your earnings (recorded)" value={`₹${s.earned_month.toLocaleString("en-IN")}`} hint="From completed jobs this month" />
        <Stat
          icon={Star}
          tone="amber"
          label="Rating"
          value={s.rating.average === null ? "—" : `${s.rating.average.toFixed(1)}★`}
          hint={`${s.rating.count} review${s.rating.count === 1 ? "" : "s"}`}
          onClick={() => go("reviews")}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={cardCls}>
          <h2 className="mb-4 text-lg font-bold text-[var(--ink)]">Last 6 months</h2>
          {s.months.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No leads yet.</p>
          ) : (
            <ul className="space-y-3" aria-label="Leads per month">
              {s.months.map((m) => (
                <li key={m.month} className="text-sm">
                  <div className="mb-1 flex justify-between">
                    <span className="font-medium text-[var(--ink-soft)]">{monthLabel(m.month)}</span>
                    <span className="text-[var(--muted)]">{m.leads} leads · {m.taken} accepted · {m.coins} coins</span>
                  </div>
                  <div className="flex h-2.5 overflow-hidden rounded-full bg-purple-100">
                    <div className="h-full bg-purple-600" style={{ width: `${(m.taken / max) * 100}%` }} title={`${m.taken} accepted`} />
                    <div className="h-full bg-purple-300" style={{ width: `${((m.leads - m.taken) / max) * 100}%` }} title={`${m.leads - m.taken} missed`} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 flex gap-4 text-xs text-[var(--muted)]">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-600" /> Accepted</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-300" /> Missed</span>
          </p>
        </section>

        <section className={cardCls}>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="flex-1 text-lg font-bold text-[var(--ink)]">Profile strength</h2>
            <span className="text-sm font-semibold text-purple-700">{done}/{checklist.length}</span>
          </div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-purple-100">
            <div className="h-full bg-purple-600" style={{ width: `${(done / checklist.length) * 100}%` }} />
          </div>
          <ul className="space-y-2">
            {checklist.map((c) => (
              <li key={c.text}>
                <button onClick={() => !c.done && go(c.tab)} className="flex w-full items-center gap-2 text-left text-sm" disabled={c.done}>
                  {c.done ? <ShieldCheck className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-gray-300" />}
                  <span className={c.done ? "text-[var(--muted)] line-through" : "text-[var(--ink-soft)] underline-offset-2 hover:underline"}>{c.text}</span>
                </button>
              </li>
            ))}
          </ul>
          {app.slug && app.is_listed && (
            <a href={`/partners/${app.slug}`} target="_blank" rel="noreferrer" className={`${btnPrimary} mt-5`}>
              View public profile
            </a>
          )}
        </section>
      </div>
    </div>
  );
}
