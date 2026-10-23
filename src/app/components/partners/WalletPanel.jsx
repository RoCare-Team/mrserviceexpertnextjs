"use client";

import { useEffect, useState } from "react";
import { Coins, Loader2, CheckCircle2, CircleAlert } from "lucide-react";
import { partnerApi } from "./partnerApi";
import { btnPrimary, cardCls, inputCls, labelCls, FieldError } from "./ui";

const TYPE = { recharge: "Recharge", lead_debit: "Lead accepted", refund: "Refund", adjustment: "Adjustment" };
const PRESETS = [500, 1000, 2000, 5000];

export default function WalletPanel({ paymentResult, canRecharge }) {
  const [w, setW] = useState(null);
  const [amount, setAmount] = useState(500);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    partnerApi("/api/partners/me/wallet").then((r) => {
      if (r.ok) {
        setW(r.data);
        setEmail(r.data.email || "");
      } else setErr(r.error);
    });
  }, []);

  const recharge = async (e) => {
    e.preventDefault();
    const min = w?.min_recharge || 500;
    if (!Number.isInteger(Number(amount)) || Number(amount) < min) return setErr({ message: `Minimum recharge is ₹${min}.` });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return setErr({ message: "Enter a valid email for the payment receipt." });
    setBusy(true);
    setErr(null);
    const r = await partnerApi("/api/partners/me/wallet/recharge", { method: "POST", body: { amount: Number(amount), email } });
    if (r.ok) {
      window.location.assign(r.data.payUrl);
      return;
    }
    setBusy(false);
    setErr(r.error);
  };

  return (
    <div className="space-y-5">
      {paymentResult === "success" && (
        <p role="status" className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
          <CheckCircle2 className="h-5 w-5" /> Payment successful — coins have been added to your wallet.
        </p>
      )}
      {paymentResult === "failed" && (
        <p role="alert" className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
          <CircleAlert className="h-5 w-5" /> Payment failed or was cancelled. No coins were added.
        </p>
      )}
      {paymentResult === "pending" && (
        <p role="status" className="flex items-center gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
          <CircleAlert className="h-5 w-5" /> We couldn&apos;t confirm the payment yet. If money was deducted, coins will be added after verification — contact support if not.
        </p>
      )}

      <section className={cardCls}>
        <p className="text-sm text-[var(--muted)]">Wallet balance</p>
        <p className="mt-1 flex items-center gap-2 text-4xl font-bold text-[var(--ink)]">
          <Coins className="h-8 w-8 text-amber-500" /> {w ? w.balance.toLocaleString("en-IN") : "…"}
          <span className="text-base font-medium text-[var(--muted)]">coins</span>
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">1 coin = ₹1. Accepting a lead uses 50% of its service price.</p>
      </section>

      <section className={cardCls}>
        <h2 className="mb-3 text-lg font-bold text-[var(--ink)]">Recharge wallet</h2>
        {!canRecharge ? (
          <p className="text-sm text-[var(--muted)]">Recharge becomes available once your profile is approved.</p>
        ) : (
          <form onSubmit={recharge} noValidate className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAmount(n)}
                  className={`min-h-10 rounded-full border-2 px-4 text-sm font-semibold ${Number(amount) === n ? "border-purple-600 bg-purple-50 text-purple-800" : "border-[var(--line)]"}`}
                >
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
            <p className="text-xs text-[var(--muted)]">You&apos;ll be redirected to Easebuzz to complete the payment.</p>
          </form>
        )}
      </section>

      <section className={cardCls}>
        <h2 className="mb-3 text-lg font-bold text-[var(--ink)]">Transactions</h2>
        {!w && <p className="flex items-center gap-2 text-sm text-[var(--muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>}
        {w?.txns.length === 0 && <p className="text-sm text-[var(--muted)]">No transactions yet.</p>}
        <ul className="divide-y divide-[var(--line)]">
          {w?.txns.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
              <span className="font-medium text-[var(--ink-soft)]">{TYPE[t.type]}</span>
              <span className="text-xs text-[var(--muted)]">{t.note}</span>
              <span className="ml-auto text-right">
                <b className={Number(t.amount) < 0 ? "text-red-600" : "text-emerald-700"}>
                  {Number(t.amount) > 0 ? "+" : ""}{Number(t.amount).toLocaleString("en-IN")}
                </b>
                <span className="block text-xs text-[var(--muted)]">
                  Bal {Number(t.balance_after).toLocaleString("en-IN")} · {new Date(t.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
