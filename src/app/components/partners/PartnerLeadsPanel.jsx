"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Clock, Coins, Loader2, MapPin, Phone, CheckCircle2, XCircle, Flag, Wallet } from "lucide-react";
import { partnerApi } from "./partnerApi";
import { btnPrimary, btnGhost, cardCls, inputCls } from "./ui";

const STATUS = {
  new: { label: "New — action needed", cls: "bg-amber-50 text-amber-800" },
  accepted: { label: "Accepted", cls: "bg-emerald-50 text-emerald-700" },
  completed: { label: "Completed", cls: "bg-purple-50 text-purple-700" },
  rejected: { label: "Rejected (sent to support team)", cls: "bg-gray-100 text-gray-600" },
  expired: { label: "Expired (sent to support team)", cls: "bg-gray-100 text-gray-600" },
};
const POLL_MS = 30_000;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function Countdown({ seconds, onEnd }) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => setLeft(seconds), [seconds]);
  useEffect(() => {
    if (left <= 0) return onEnd?.();
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, onEnd]);
  const m = Math.floor(Math.max(left, 0) / 60);
  const s = Math.max(left, 0) % 60;
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-sm font-semibold ${left < 300 ? "text-red-600" : "text-amber-700"}`}>
      <Clock className="h-4 w-4" /> {m}:{String(s).padStart(2, "0")} left
    </span>
  );
}

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.15;
    o.start();
    o.stop(ctx.currentTime + 0.35);
  } catch {}
}

export default function PartnerLeadsPanel() {
  const [leads, setLeads] = useState(null);
  const [balance, setBalance] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [reporting, setReporting] = useState(null);
  const [text, setText] = useState("");
  const [notifyOn, setNotifyOn] = useState(false);
  const known = useRef(null);

  const load = useCallback(async () => {
    const r = await partnerApi("/api/partners/me/leads");
    if (!r.ok) return;
    const newIds = r.data.leads.filter((l) => l.status === "new").map((l) => l.id);
    if (known.current) {
      const fresh = newIds.filter((id) => !known.current.has(id));
      if (fresh.length) {
        beep();
        document.title = `(${fresh.length}) New lead – Mr. Service Expert`;
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("New booking request", { body: "You have 30 minutes to accept it.", tag: "mse-lead" });
        }
      }
    }
    known.current = new Set(newIds);
    setLeads(r.data.leads);
    setBalance(r.data.balance);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, POLL_MS);
    const onVis = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onVis);
    setNotifyOn(typeof Notification !== "undefined" && Notification.permission === "granted");
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [load]);

  const act = async (id, action, extra = {}) => {
    setBusyId(id);
    setMsg(null);
    const r = await partnerApi(`/api/partners/me/leads/${id}`, { method: "POST", body: { action, ...extra } });
    setBusyId(null);
    if (!r.ok) return setMsg({ tone: "err", text: r.error.message, recharge: r.error.code === "insufficient_coins" });
    setLeads(r.data.leads);
    setBalance(r.data.balance);
    setRejecting(null);
    setReporting(null);
    setText("");
    setMsg({
      tone: "ok",
      text: { accept: "Lead accepted — customer details are now visible.", reject: "Lead rejected.", complete: "Marked as completed.", report: "Problem reported. Our team will review it." }[action],
    });
  };

  const enableNotify = async () => {
    if (typeof Notification === "undefined") return;
    setNotifyOn((await Notification.requestPermission()) === "granted");
  };

  return (
    <section className={cardCls} aria-labelledby="leads-h">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h2 id="leads-h" className="flex-1 text-lg font-bold text-[var(--ink)]">Booking leads</h2>
        <Link href="/partner/wallet" className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-3 py-1.5 text-sm font-semibold text-purple-800">
          <Wallet className="h-4 w-4" /> {balance.toLocaleString("en-IN")} coins
        </Link>
        {!notifyOn && (
          <button className="inline-flex items-center gap-1 text-sm text-purple-700 underline" onClick={enableNotify}>
            <Bell className="h-4 w-4" /> Turn on alerts
          </button>
        )}
      </div>
      <p className="mb-4 text-xs text-[var(--muted)]">
        Accept a lead within 30 minutes. Accepting costs 50% of the service price in coins. Leads you don&apos;t accept go to our support team.
        Keep this page open to get alerts.
      </p>

      {msg && (
        <p role="status" className={`mb-3 rounded-xl px-3 py-2 text-sm ${msg.tone === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>
          {msg.text} {msg.recharge && <Link href="/partner/wallet" className="font-semibold underline">Recharge now</Link>}
        </p>
      )}

      {leads === null && <p className="flex items-center gap-2 text-sm text-[var(--muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading leads…</p>}
      {leads?.length === 0 && <p className="text-sm text-[var(--muted)]">No leads yet. New bookings from your profile will appear here.</p>}

      <ul className="space-y-3">
        {leads?.map((l) => (
          <li key={l.id} className={`rounded-2xl border p-4 ${l.status === "new" ? "border-amber-300 bg-amber-50/40" : "border-[var(--line)]"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS[l.status].cls}`}>{STATUS[l.status].label}</span>
              <span className="text-xs text-[var(--muted)]">#{l.id} · {fmtDate(l.created_at)}</span>
              {l.status === "new" && <span className="ml-auto"><Countdown seconds={l.seconds_left} onEnd={load} /></span>}
            </div>
            <p className="mt-2 font-semibold text-[var(--ink)]">
              {l.service} · {l.category}{l.brand ? ` · ${l.brand}` : ""}
            </p>
            <div className="mt-1 grid gap-x-4 gap-y-1 text-sm text-[var(--body-text)] sm:grid-cols-2">
              <span>Service price: <b>₹{l.service_price}</b></span>
              <span className="inline-flex items-center gap-1"><Coins className="h-4 w-4 text-amber-500" /> Lead cost: <b>{l.coin_cost} coins</b></span>
              <span>Appointment: {fmtDate(l.appointment_date)}, {l.appointment_time}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {l.area}</span>
              <span>Customer: {l.customer_name}</span>
              <span className="inline-flex items-center gap-1">
                <Phone className="h-4 w-4" />
                {l.address ? <a href={`tel:+91${l.customer_mobile}`} className="font-semibold text-purple-700 underline">{l.customer_mobile}</a> : l.customer_mobile}
              </span>
              {l.address && <span className="sm:col-span-2">Address: {l.address}</span>}
            </div>
            {l.issue_note && (
              <p className="mt-2 text-xs text-amber-800">Reported: {l.issue_note}{l.refunded ? " · Refunded" : " · Under review"}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-2">
              {l.status === "new" && (
                <>
                  <button className={btnPrimary} disabled={busyId === l.id || balance < l.coin_cost} onClick={() => act(l.id, "accept")}>
                    {busyId === l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Accept ({l.coin_cost} coins)
                  </button>
                  <button className={btnGhost} disabled={busyId === l.id} onClick={() => (setRejecting(l.id), setText(""))}>
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                  {balance < l.coin_cost && (
                    <Link href="/partner/wallet" className="self-center text-sm font-semibold text-red-700 underline">
                      Not enough coins — recharge
                    </Link>
                  )}
                </>
              )}
              {l.status === "accepted" && (
                <button className={btnGhost} disabled={busyId === l.id} onClick={() => act(l.id, "complete")}>
                  <CheckCircle2 className="h-4 w-4" /> Mark completed
                </button>
              )}
              {["accepted", "completed"].includes(l.status) && !l.issue_note && !l.refunded && (
                <button className="inline-flex items-center gap-1 text-sm text-[var(--muted)] underline" onClick={() => (setReporting(l.id), setText(""))}>
                  <Flag className="h-4 w-4" /> Report a problem (fake lead etc.)
                </button>
              )}
            </div>

            {(rejecting === l.id || reporting === l.id) && (
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <label htmlFor={`txt-${l.id}`} className="sr-only">{rejecting === l.id ? "Reason (optional)" : "Describe the problem"}</label>
                <input
                  id={`txt-${l.id}`}
                  className={inputCls}
                  maxLength={rejecting === l.id ? 255 : 500}
                  placeholder={rejecting === l.id ? "Reason (optional) — e.g. not available that day" : "Describe the problem (e.g. customer number unreachable)"}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <button
                  className={btnPrimary}
                  disabled={busyId === l.id}
                  onClick={() => (rejecting === l.id ? act(l.id, "reject", { reason: text }) : act(l.id, "report", { note: text }))}
                >
                  {rejecting === l.id ? "Confirm reject" : "Send report"}
                </button>
                <button className={btnGhost} onClick={() => (setRejecting(null), setReporting(null))}>Cancel</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
