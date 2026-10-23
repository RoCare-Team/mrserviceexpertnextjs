"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Clock, Coins, Loader2, MapPin, Phone, MessageCircle, Navigation, CheckCircle2, XCircle, Flag, StickyNote, Search } from "lucide-react";
import { partnerApi } from "../partnerApi";
import { btnPrimary, btnGhost, cardCls, inputCls, FieldError } from "../ui";

const GROUPS = [
  { key: "new", label: "New" },
  { key: "accepted", label: "Accepted" },
  { key: "completed", label: "Completed" },
  { key: "missed", label: "Missed" },
  { key: "", label: "All" },
];
const STATUS = {
  new: { label: "New — action needed", cls: "bg-amber-50 text-amber-800" },
  accepted: { label: "Accepted", cls: "bg-emerald-50 text-emerald-700" },
  completed: { label: "Completed", cls: "bg-purple-50 text-purple-700" },
  rejected: { label: "Rejected", cls: "bg-gray-100 text-gray-600" },
  expired: { label: "Expired", cls: "bg-gray-100 text-gray-600" },
};
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function Countdown({ seconds, onEnd }) {
  const [left, setLeft] = useState(seconds);
  const fired = useRef(false);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;
  useEffect(() => setLeft(seconds), [seconds]);
  useEffect(() => {
    if (left <= 0) {
      // Fire once per countdown, however often the parent re-renders.
      if (!fired.current && seconds > 0) {
        fired.current = true;
        endRef.current?.();
      }
      return;
    }
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left, seconds]);
  const m = Math.floor(Math.max(left, 0) / 60);
  const sec = Math.max(left, 0) % 60;
  return (
    <span className={`inline-flex items-center gap-1 font-mono text-sm font-semibold ${left < 300 ? "text-red-600" : "text-amber-700"}`}>
      <Clock className="h-4 w-4" /> {left > 0 ? `${m}:${String(sec).padStart(2, "0")} left` : "Time over"}
    </span>
  );
}

function LeadCard({ l, balance, onAction, busy }) {
  const [panel, setPanel] = useState(null); // reject | report | complete | note
  const [text, setText] = useState("");
  const [amount, setAmount] = useState("");
  const [err, setErr] = useState("");
  const open = l.status === "accepted" || l.status === "completed";
  const mapsUrl = l.address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(l.address)}` : null;

  const run = async (action, extra) => {
    setErr("");
    const e = await onAction(l.id, action, extra);
    if (e) setErr(e);
    else {
      setPanel(null);
      setText("");
      setAmount("");
    }
  };

  return (
    <li className={`rounded-2xl border bg-white p-4 shadow-sm ${l.status === "new" ? "border-amber-300" : "border-[var(--line)]"}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS[l.status].cls}`}>{STATUS[l.status].label}</span>
        <span className="text-xs text-[var(--muted)]">#{l.id} · {fmtDate(l.created_at)}</span>
        {l.status === "new" && <span className="ml-auto"><Countdown seconds={l.seconds_left} onEnd={() => onAction(null, "refresh")} /></span>}
      </div>

      <p className="mt-2 font-semibold text-[var(--ink)]">
        {l.service} · {l.category}{l.brand ? ` · ${l.brand}` : ""}
      </p>
      <div className="mt-1 grid gap-x-4 gap-y-1 text-sm text-[var(--body-text)] sm:grid-cols-2">
        <span>Service price: <b>₹{l.service_price}</b></span>
        <span className="inline-flex items-center gap-1"><Coins className="h-4 w-4 text-amber-500" /> Lead cost: <b>{l.coin_cost} coins</b></span>
        <span>Appointment: <b>{fmtDate(l.appointment_date)}, {l.appointment_time}</b></span>
        <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {l.area}</span>
        <span>Customer: {l.customer_name}</span>
        <span>{l.customer_mobile}</span>
        {l.address && <span className="sm:col-span-2">Address: {l.address}</span>}
        {l.status === "completed" && (l.final_amount !== null || l.work_done) && (
          <span className="sm:col-span-2 text-[var(--muted)]">
            Job record: {l.final_amount !== null ? `₹${l.final_amount}` : ""} {l.work_done ? `· ${l.work_done}` : ""}
          </span>
        )}
      </div>

      {l.partner_note && panel !== "note" && (
        <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-yellow-50 px-3 py-2 text-sm text-yellow-900">
          <StickyNote className="mt-0.5 h-4 w-4 shrink-0" /> {l.partner_note}
        </p>
      )}
      {l.issue_note && <p className="mt-2 text-xs text-amber-800">Reported: {l.issue_note}{l.refunded ? " · Refunded" : " · Under review"}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {l.status === "new" && (
          <>
            <button className={btnPrimary} disabled={busy || balance < l.coin_cost || l.seconds_left <= 0} onClick={() => run("accept")}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} Accept ({l.coin_cost} coins)
            </button>
            <button className={btnGhost} disabled={busy} onClick={() => setPanel("reject")}><XCircle className="h-4 w-4" /> Reject</button>
          </>
        )}
        {open && (
          <>
            <a href={`tel:+91${l.customer_mobile}`} className={btnPrimary}><Phone className="h-4 w-4" /> Call</a>
            <a href={`https://wa.me/91${l.customer_mobile}`} target="_blank" rel="noopener noreferrer" className={`${btnGhost} text-emerald-700`}>
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
            {mapsUrl && (
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className={btnGhost}><Navigation className="h-4 w-4" /> Directions</a>
            )}
          </>
        )}
        {l.status === "accepted" && (
          <button className={btnGhost} disabled={busy} onClick={() => setPanel("complete")}><CheckCircle2 className="h-4 w-4" /> Mark completed</button>
        )}
        <button className="inline-flex items-center gap-1 text-sm text-[var(--muted)] underline" onClick={() => (setPanel("note"), setText(l.partner_note || ""))}>
          <StickyNote className="h-4 w-4" /> {l.partner_note ? "Edit note" : "Add note"}
        </button>
        {open && !l.issue_note && !l.refunded && (
          <button className="inline-flex items-center gap-1 text-sm text-[var(--muted)] underline" onClick={() => setPanel("report")}>
            <Flag className="h-4 w-4" /> Report a problem
          </button>
        )}
      </div>
      {l.status === "new" && balance < l.coin_cost && <p className="mt-2 text-sm font-medium text-red-700">Not enough coins to accept — recharge your wallet.</p>}

      {panel && (
        <div className="mt-3 space-y-2 rounded-xl bg-gray-50 p-3">
          {panel === "complete" && (
            <input
              aria-label="Final amount collected (₹, optional)"
              className={inputCls}
              type="number"
              min={0}
              inputMode="decimal"
              placeholder="Final amount collected ₹ (optional, for your records)"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          )}
          <textarea
            aria-label="Details"
            rows={2}
            className={inputCls}
            maxLength={panel === "note" ? 1000 : 500}
            placeholder={
              { reject: "Reason (optional) — e.g. not available that day", report: "Describe the problem (e.g. fake booking, number unreachable)", complete: "Work done (optional) — e.g. filter changed", note: "Private note — only you can see this" }[panel]
            }
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <FieldError msg={err} />
          <div className="flex gap-2">
            <button
              className={btnPrimary}
              disabled={busy}
              onClick={() =>
                panel === "reject"
                  ? run("reject", { reason: text })
                  : panel === "report"
                  ? run("report", { note: text })
                  : panel === "complete"
                  ? run("complete", { final_amount: amount, work_done: text })
                  : run("note", { note: text })
              }
            >
              {{ reject: "Confirm reject", report: "Send report", complete: "Mark completed", note: "Save note" }[panel]}
            </button>
            <button className={btnGhost} onClick={() => setPanel(null)}>Cancel</button>
          </div>
          {panel === "reject" && <p className="text-xs text-[var(--muted)]">The booking goes to our support team so the customer still gets served. No coins are charged.</p>}
        </div>
      )}
    </li>
  );
}

export default function LeadsTab({ balance, setBalance, refresh }) {
  const [group, setGroup] = useState("new");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [leads, setLeads] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [msg, setMsg] = useState(null);
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSearch(searchInput), 400);
  }, [searchInput]);

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ group, search });
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const r = await partnerApi(`/api/partners/me/leads?${qs}`);
    if (r.ok) {
      setLeads(r.data.leads);
      setBalance(r.data.balance);
    }
  }, [group, search, from, to, setBalance]);

  useEffect(() => {
    setLeads(null);
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);

  /** Returns an error message, or null on success. */
  const onAction = async (id, action, extra = {}) => {
    if (action === "refresh") return load(), null;
    setBusyId(id);
    setMsg(null);
    const r = await partnerApi(`/api/partners/me/leads/${id}`, { method: "POST", body: { action, ...extra } });
    setBusyId(null);
    if (!r.ok) return r.error.message;
    setBalance(r.data.balance);
    const text = { accept: "Lead accepted — call the customer now.", reject: "Lead rejected.", complete: "Marked as completed.", report: "Problem reported. Our team will review it.", note: "Note saved." }[action];
    setMsg(text);
    await load();
    refresh?.();
    return null;
  };

  return (
    <div className="space-y-4">
      <div className={`${cardCls} !p-4`}>
        <div className="flex flex-wrap gap-2" role="tablist">
          {GROUPS.map((g) => (
            <button
              key={g.key || "all"}
              role="tab"
              aria-selected={group === g.key}
              onClick={() => setGroup(g.key)}
              className={`min-h-9 rounded-full px-4 text-sm font-semibold ${group === g.key ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-800"}`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <label className="relative">
            <span className="sr-only">Search leads</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input className={`${inputCls} pl-9`} placeholder="Search service, area, lead # or customer" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </label>
          <input aria-label="From date" type="date" className={inputCls} value={from} onChange={(e) => setFrom(e.target.value)} />
          <input aria-label="To date" type="date" className={inputCls} value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">Accept within 30 minutes. Accepting costs 50% of the service price in coins; customer details unlock after accepting.</p>
      </div>

      {msg && <p role="status" className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>}
      {leads === null && <p className="flex items-center gap-2 text-sm text-[var(--muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading leads…</p>}
      {leads?.length === 0 && (
        <div className={`${cardCls} text-center text-sm text-[var(--muted)]`}>
          {group === "new" ? "No new bookings right now. You'll be alerted when one arrives." : "No leads here."}
        </div>
      )}
      <ul className="space-y-3">
        {leads?.map((l) => <LeadCard key={l.id} l={l} balance={balance ?? 0} busy={busyId === l.id} onAction={onAction} />)}
      </ul>
    </div>
  );
}
