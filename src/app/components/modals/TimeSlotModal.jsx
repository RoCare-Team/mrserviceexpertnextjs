"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, CalendarDays, Clock, Check, Loader2, Sun, Sunset, Moon } from "lucide-react";

const SLOT_API = "https://waterpurifierservicecenter.in/customer/ro_customer/time_slot.php";

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Next 7 days, starting today. */
const nextDays = () =>
  Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + i);
    return d;
  });

/** Hour (0-23) a slot label like "10:00 AM - 12:00 PM" starts at; null if unknown. */
const startHour = (label) => {
  const m = /(\d{1,2})(?::(\d{2}))?\s*(AM|PM)/i.exec(String(label || ""));
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (/pm/i.test(m[3])) h += 12;
  return h;
};

const PERIODS = [
  { key: "morning", label: "Morning", icon: Sun, test: (h) => h !== null && h < 12 },
  { key: "afternoon", label: "Afternoon", icon: Sunset, test: (h) => h !== null && h >= 12 && h < 17 },
  { key: "evening", label: "Evening", icon: Moon, test: (h) => h === null || h >= 17 },
];

/**
 * "Pick a time slot" dialog for the checkout. Loads the CRM's slots for the
 * chosen date and reports {date, time, id} back via onTimeSlotSelected.
 */
const TimeSlotModal = ({ onTimeSlotSelected, onClose, open }) => {
  const days = useMemo(nextDays, []);
  const [selectedDate, setSelectedDate] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null); // { time, id }

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const pickDate = async (date) => {
    setSelectedDate(date);
    setSelected(null);
    setSlots([]);
    setError("");
    setLoading(true);
    try {
      const res = await fetch(SLOT_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: ymd(date) }),
      });
      const data = await res.json();
      const list = Array.isArray(data?.all_time_slots) ? data.all_time_slots : [];
      localStorage.setItem("time_slot", JSON.stringify(list));
      setSlots(list);
    } catch (e) {
      console.error("time slots:", e);
      setError("Could not load time slots. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirm = () => {
    if (!selectedDate || !selected) return;
    onTimeSlotSelected?.({ date: ymd(selectedDate), time: selected.time, id: selected.id });
    onClose?.();
  };

  const grouped = useMemo(
    () =>
      PERIODS.map((p) => ({ ...p, items: slots.filter((s) => p.test(startHour(s.time_slots))) })).filter((p) => p.items.length > 0),
    [slots]
  );

  if (!open || typeof document === "undefined") return null;

  const today = ymd(new Date());
  const tomorrow = ymd(days[1]);
  const dayTag = (d) => (ymd(d) === today ? "Today" : ymd(d) === tomorrow ? "Tomorrow" : d.toLocaleDateString("en-US", { weekday: "short" }));

  return createPortal(
    <div
      className="fixed inset-0 z-[1300] flex items-end justify-center bg-black/55 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="slot-title" className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-[var(--line)] px-5 py-4">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[0_6px_14px_-6px_rgba(98,41,205,.6)]">
            <CalendarDays className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="slot-title" className="text-[16px] font-bold text-[var(--ink)]">Pick a time slot</h2>
            <p className="text-[12.5px] text-[var(--muted)]">When should the technician arrive?</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] hover:bg-gray-100">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {/* Dates */}
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Date</p>
          <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
            {days.map((d) => {
              const on = selectedDate && ymd(selectedDate) === ymd(d);
              return (
                <button
                  key={ymd(d)}
                  type="button"
                  onClick={() => pickDate(d)}
                  aria-pressed={!!on}
                  className={`flex w-[68px] shrink-0 flex-col items-center rounded-2xl border py-2.5 transition ${
                    on ? "border-purple-600 bg-purple-600 text-white shadow-[0_8px_18px_-8px_rgba(98,41,205,.8)]" : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-purple-300 hover:bg-purple-50/50"
                  }`}
                >
                  <span className={`text-[11px] font-semibold ${on ? "text-white/80" : "text-[var(--muted)]"}`}>{dayTag(d)}</span>
                  <span className="text-[20px] font-extrabold leading-tight">{d.getDate()}</span>
                  <span className={`text-[11px] font-medium ${on ? "text-white/80" : "text-[var(--muted)]"}`}>{d.toLocaleDateString("en-US", { month: "short" })}</span>
                </button>
              );
            })}
          </div>

          {/* Slots */}
          <div className="mt-5">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">Time</p>
            {!selectedDate ? (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-soft)] px-4 py-5 text-[13.5px] text-[var(--muted)]">
                <Clock className="h-5 w-5 shrink-0 text-purple-400" aria-hidden="true" /> Select a date to see available slots.
              </div>
            ) : loading ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-busy="true">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-11 animate-pulse rounded-xl bg-gray-100" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] text-red-700">
                {error}{" "}
                <button type="button" onClick={() => pickDate(selectedDate)} className="font-semibold underline">
                  Retry
                </button>
              </div>
            ) : slots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-soft)] px-4 py-6 text-center">
                <p className="text-[14px] font-semibold text-[var(--ink)]">No slots left for this date</p>
                <p className="mt-1 text-[12.5px] text-[var(--muted)]">Please pick another date.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {grouped.map((g) => (
                  <div key={g.key}>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--ink-soft)]">
                      <g.icon className="h-3.5 w-3.5 text-purple-600" aria-hidden="true" /> {g.label}
                    </p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {g.items.map((s) => {
                        const on = selected?.id === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setSelected({ time: s.time_slots, id: s.id })}
                            aria-pressed={on}
                            className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-2 text-[13px] font-semibold transition ${
                              on ? "border-purple-600 bg-purple-50 text-purple-800 ring-2 ring-purple-200" : "border-[var(--line)] bg-white text-[var(--ink)] hover:border-purple-300 hover:bg-purple-50/50"
                            }`}
                          >
                            {on && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                            {s.time_slots}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-[var(--line)] p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          <div className="min-w-0 flex-1 text-[13px] text-[var(--muted)]">
            {selectedDate && selected ? (
              <>
                <b className="text-[var(--ink)]">{selectedDate.toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })}</b> · {selected.time}
              </>
            ) : (
              "No slot selected"
            )}
          </div>
          <button
            type="button"
            onClick={confirm}
            disabled={!selectedDate || !selected}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[image:var(--grad-brand)] px-5 text-[15px] font-semibold text-white shadow-[var(--shadow-cta)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />} Confirm slot
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default TimeSlotModal;
