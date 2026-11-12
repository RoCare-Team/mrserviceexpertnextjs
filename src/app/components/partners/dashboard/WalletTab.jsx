"use client";

import { useEffect, useState } from "react";
import { Coins, Loader2, CheckCircle2, CircleAlert, Clock3, Receipt, ChevronDown, Award } from "lucide-react";
import { partnerApi } from "../partnerApi";
import { btnPrimary, btnGhost, cardCls, inputCls, labelCls, FieldError } from "../ui";
import PlanLimitsCard from "./PlanLimitsCard";
import { FREE_PLAN_TEXT } from "../BadgePlan";

const TYPE = { recharge: "Recharge", lead_debit: "Lead accepted", refund: "Refund", adjustment: "Adjustment" };
const PRESETS = [500, 1000, 2000, 5000];
const PAY = {
  success: { label: "Success", cls: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  failed: { label: "Failed", cls: "bg-red-50 text-red-700", icon: CircleAlert },
  initiated: { label: "Pending", cls: "bg-amber-50 text-amber-800", icon: Clock3 },
};
const testMode = String(process.env.NEXT_PUBLIC_EASEBUZZ_MODE || "test").split("#")[0].trim().toLowerCase() !== "live";
const fmt = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—");

function PaymentRow({ p }) {
  const [open, setOpen] = useState(false);
  const s = PAY[p.status];
  return (
    <li className="py-3">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full flex-wrap items-center gap-2 text-left text-sm" aria-expanded={open}>
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.cls}`}>
          <s.icon className="h-3.5 w-3.5" /> {s.label}
        </span>
        <b className="text-[var(--ink)]">₹{Number(p.amount).toLocaleString("en-IN")}</b>
        <span className="text-xs font-medium text-[var(--ink-soft)]">{p.purpose === "badge" ? "Featured badge" : "Recharge"}</span>
        <span className="text-xs text-[var(--muted)]">{fmt(p.created_at)}</span>
        {p.mode === "test" && <span className="rounded bg-gray-100 px-1.5 text-[10px] font-semibold uppercase text-gray-500">test</span>}
        <ChevronDown className={`ml-auto h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <dl className="mt-2 grid gap-x-4 gap-y-1 rounded-xl bg-gray-50 p-3 text-xs sm:grid-cols-2">
          {[
            ["Transaction ID", p.txnid],
            ["Easebuzz ID", p.easebuzz_id],
            ["Payment method", p.payment_mode],
            ["Card / UPI", p.card_or_vpa],
            ["Bank", p.bank_name],
            ["Bank reference", p.bank_ref_num],
            ["Gateway status", p.gateway_status],
            ["Completed", fmt(p.completed_at)],
            ["Receipt email", p.email],
            ...(p.error_message ? [["Reason", p.error_message]] : []),
          ].map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <dt className="text-[var(--muted)]">{k}:</dt>
              <dd className="break-all font-medium text-[var(--ink-soft)]">{v || "—"}</dd>
            </div>
          ))}
          {p.status === "success" && (
            <div className="sm:col-span-2">
              <a href={`/partner/receipt/${p.id}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold text-purple-700 underline">
                <Receipt className="h-3.5 w-3.5" /> Download receipt
              </a>
            </div>
          )}
        </dl>
      )}
    </li>
  );
}

const fmtDay = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** Buy / renew the Featured Partner badge (Easebuzz, fixed price). */
function BadgeCard({ app, email }) {
  const b = app.badge;
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  if (!b || app.status !== "approved") return null;

  const buy = async () => {
    setErr("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setErr("Enter a valid email in “Email for receipt” below first.");
    setBusy(true);
    const r = await partnerApi("/api/partners/me/badge", { method: "POST", body: { email } });
    if (r.ok) return window.location.assign(r.data.payUrl);
    setBusy(false);
    setErr(r.error.message);
  };

  return (
    <section className={`${cardCls} border-amber-200 bg-gradient-to-br from-amber-50 to-white`}>
      <div className="flex flex-wrap items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <Award className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-[var(--ink)]">
            {b.name} badge{" "}
            {b.active && <span className="ml-1 rounded-full bg-emerald-100 px-2.5 py-0.5 align-middle text-xs font-semibold text-emerald-800">Active</span>}
          </h2>
          {b.active ? (
            <p className="mt-1 text-sm text-[var(--body-text)]">
              You&apos;re shown <b>first</b> in all your service areas till <b>{fmtDay(b.until)}</b>. Renewing now adds {b.period} to that date.
            </p>
          ) : (
            <p className="mt-1 text-sm text-[var(--body-text)]">
              Get listed <b>above other partners</b> in your city and localities, with a “{b.name}” badge on your card — for {b.period}.
            </p>
          )}
          <ul className="mt-2 space-y-0.5 text-xs text-[var(--muted)]">
            <li>• No limits on cities, categories and brands (free plan: {FREE_PLAN_TEXT}).</li>
            <li>• Among featured partners, rating and jobs done decide the order.</li>
            <li>• Paid directly by UPI / card — your coins are not used.</li>
          </ul>
          {!app.is_listed && <p className="mt-2 text-xs font-medium text-amber-800">Your profile isn&apos;t live on the website right now, so the badge can&apos;t be bought.</p>}
          {err && <p className="mt-2 text-sm font-medium text-red-700">{err}</p>}
        </div>
        <button type="button" className={btnPrimary} disabled={busy || !app.is_listed} onClick={buy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} {b.active ? "Renew" : "Get badge"} · ₹{b.price}
        </button>
      </div>
    </section>
  );
}

export default function WalletTab({ app, setApp, paymentResult, paymentFor, setBalance }) {
  const [w, setW] = useState(null);
  const [payments, setPayments] = useState(null);
  const [amount, setAmount] = useState(500);
  const [email, setEmail] = useState(app.business.business_email || "");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [filter, setFilter] = useState("");
  const [alertAt, setAlertAt] = useState(app.low_balance_alert ?? 200);
  const [alertMsg, setAlertMsg] = useState("");
  const canRecharge = app.status === "approved";

  useEffect(() => {
    partnerApi("/api/partners/me/wallet").then((r) => {
      if (r.ok) {
        setW(r.data);
        setBalance(r.data.balance);
        if (r.data.min_recharge < 500) setAmount(r.data.min_recharge); // temporary low minimum for testing
        if (!email && r.data.email) setEmail(r.data.email);
      }
    });
    partnerApi("/api/partners/me/payments").then((r) => setPayments(r.ok ? r.data : []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recharge = async (e) => {
    e.preventDefault();
    if (!Number.isInteger(Number(amount)) || Number(amount) < (w?.min_recharge || 500)) return setErr({ message: `Minimum recharge is ₹${w?.min_recharge || 500}.` });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setErr({ message: "Enter a valid email for the payment receipt." });
    setBusy(true);
    setErr(null);
    const r = await partnerApi("/api/partners/me/wallet/recharge", { method: "POST", body: { amount: Number(amount), email } });
    if (r.ok) return window.location.assign(r.data.payUrl);
    setBusy(false);
    setErr(r.error);
    partnerApi("/api/partners/me/payments").then((x) => x.ok && setPayments(x.data));
  };

  const saveAlert = async () => {
    setAlertMsg("");
    const r = await partnerApi("/api/partners/me/settings", { method: "PATCH", body: { low_balance_alert: Number(alertAt) } });
    if (r.ok) {
      setApp((a) => ({ ...a, low_balance_alert: r.data.low_balance_alert }));
      setAlertMsg("Saved.");
    } else setAlertMsg(r.error.message);
  };

  const txns = (w?.txns || []).filter((t) => !filter || t.type === filter);

  return (
    <div className="space-y-5">
      {paymentResult === "success" && (
        <p role="status" className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5" />{" "}
          {paymentFor === "badge" ? "Payment successful — your Featured Partner badge is active." : "Payment successful — coins have been added."}
        </p>
      )}
      {paymentResult === "failed" && (
        <p role="alert" className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          <CircleAlert className="h-5 w-5" />{" "}
          {paymentFor === "badge" ? "Badge payment failed or was cancelled — see the details below." : "Payment failed or was cancelled. No coins were added — see the details below."}
        </p>
      )}
      {paymentResult === "pending" && (
        <p role="status" className="flex items-center gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          <Clock3 className="h-5 w-5" /> We&apos;re confirming your payment with the bank. It updates automatically within a few minutes.
        </p>
      )}

      <BadgeCard app={app} email={email} />
      <PlanLimitsCard app={app} />

      <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
        <section className={cardCls}>
          <p className="text-sm text-[var(--muted)]">Wallet balance</p>
          <p className="mt-1 flex items-center gap-2 text-4xl font-bold text-[var(--ink)]">
            <Coins className="h-8 w-8 text-amber-500" /> {w ? w.balance.toLocaleString("en-IN") : "…"}
            <span className="text-base font-medium text-[var(--muted)]">coins</span>
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">1 coin = ₹1. Accepting a lead uses 50% of its service price.</p>
          <div className="mt-5 border-t border-[var(--line)] pt-4">
            <label htmlFor="w-alert" className={labelCls}>Warn me when balance falls below</label>
            <div className="flex gap-2">
              <input id="w-alert" type="number" min={0} className={inputCls} value={alertAt} onChange={(e) => setAlertAt(e.target.value)} />
              <button className={btnGhost} onClick={saveAlert}>Save</button>
            </div>
            {alertMsg && <p className="mt-1 text-xs text-[var(--muted)]">{alertMsg}</p>}
          </div>
        </section>

        <section className={cardCls}>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="flex-1 text-lg font-bold text-[var(--ink)]">Recharge wallet</h2>
            {testMode && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">TEST MODE — no real money</span>}
          </div>
          {!canRecharge ? (
            <p className="text-sm text-[var(--muted)]">Recharge is available while your profile is approved.</p>
          ) : (
            <form onSubmit={recharge} noValidate className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((n) => (
                  <button key={n} type="button" onClick={() => setAmount(n)} className={`min-h-10 rounded-full border-2 px-4 text-sm font-semibold ${Number(amount) === n ? "border-purple-600 bg-purple-50 text-purple-800" : "border-[var(--line)]"}`}>
                    ₹{n.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="w-amt" className={labelCls}>Amount (min ₹{w?.min_recharge || 500})</label>
                  <input id="w-amt" type="number" min={w?.min_recharge || 500} step={1} inputMode="numeric" className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="w-email" className={labelCls}>Email for receipt</label>
                  <input id="w-email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <FieldError msg={err?.message} />
              <button type="submit" className={btnPrimary} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Pay ₹{Number(amount || 0).toLocaleString("en-IN")} securely
              </button>
              <p className="text-xs text-[var(--muted)]">You&apos;ll be redirected to Easebuzz. Coins are added only after the payment is confirmed.</p>
            </form>
          )}
        </section>
      </div>

      <section className={cardCls}>
        <h2 className="mb-1 text-lg font-bold text-[var(--ink)]">Payment history</h2>
        <p className="mb-2 text-xs text-[var(--muted)]">Every recharge and badge payment, including failed and pending ones. Tap a row for details.</p>
        {payments === null && <p className="flex items-center gap-2 text-sm text-[var(--muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>}
        {payments?.length === 0 && <p className="text-sm text-[var(--muted)]">No payments yet.</p>}
        <ul className="divide-y divide-[var(--line)]">{payments?.map((p) => <PaymentRow key={p.id} p={p} />)}</ul>
      </section>

      <section className={cardCls}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="flex-1 text-lg font-bold text-[var(--ink)]">Coin transactions</h2>
          {["", "recharge", "lead_debit", "refund"].map((t) => (
            <button key={t || "all"} onClick={() => setFilter(t)} className={`rounded-full px-3 py-1 text-xs font-semibold ${filter === t ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-800"}`}>
              {t ? TYPE[t] : "All"}
            </button>
          ))}
        </div>
        {!w && <p className="flex items-center gap-2 text-sm text-[var(--muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>}
        {w && txns.length === 0 && <p className="text-sm text-[var(--muted)]">No transactions.</p>}
        <ul className="divide-y divide-[var(--line)]">
          {txns.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
              <span className="font-medium text-[var(--ink-soft)]">{TYPE[t.type]}</span>
              <span className="text-xs text-[var(--muted)]">{t.note}</span>
              <span className="ml-auto text-right">
                <b className={Number(t.amount) < 0 ? "text-red-600" : "text-emerald-700"}>{Number(t.amount) > 0 ? "+" : ""}{Number(t.amount).toLocaleString("en-IN")}</b>
                <span className="block text-xs text-[var(--muted)]">Bal {Number(t.balance_after).toLocaleString("en-IN")} · {fmt(t.created_at)}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
