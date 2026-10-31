"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X, MapPin, Home, Briefcase, Plus, Check } from "lucide-react";
import AddressFormModal from "./AddressFormModal";

/** Saved addresses the CRM returned at login / after "add address". */
function savedAddresses() {
  try {
    const list = JSON.parse(localStorage.getItem("RecentAddress") || "[]");
    return Array.isArray(list) ? list.filter(Boolean) : [];
  } catch {
    return [];
  }
}

const addrId = (a) => String(a.id ?? a.address_id ?? "");
const line1 = (a) => [a.flat_no, a.area, a.landmark].map((s) => String(s ?? "").trim()).filter(Boolean).join(", ");
const line2 = (a) => [a.city, a.state].map((s) => String(s ?? "").trim()).filter(Boolean).join(", ") + (a.pincode ? ` - ${a.pincode}` : "");
const addrText = (a) => String(a.address || "").trim() || [line1(a), line2(a)].filter(Boolean).join(", ");
const isOffice = (a) => /office|work/i.test(String(a.home_office || a.address_type || a.type || ""));

/**
 * "Select an address" picker used on the checkout. Lists the customer's
 * saved addresses, lets them add a new one (AddressFormModal) and reports
 * the chosen address up via onAddressSelected. Writes address_id to
 * localStorage on confirm, as the checkout expects.
 */
export default function AddressModal({ onAddressSelected, addressOpen, setAddressOpen }) {
  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [manual, setManual] = useState(false);

  // Re-read the saved list each time the picker opens and pre-select the
  // address already chosen for this booking, if any.
  useEffect(() => {
    if (!addressOpen) return;
    const list = savedAddresses();
    setAddresses(list);
    const current = String(localStorage.getItem("address_id") || "").replace(/"/g, "");
    setSelectedId(list.some((a) => addrId(a) === current) ? current : list.length === 1 ? addrId(list[0]) : "");
  }, [addressOpen]);

  useEffect(() => {
    if (!addressOpen) return;
    const onKey = (e) => e.key === "Escape" && !manual && setAddressOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [addressOpen, manual, setAddressOpen]);

  const selected = useMemo(() => addresses.find((a) => addrId(a) === selectedId), [addresses, selectedId]);

  const close = () => setAddressOpen(false);

  const confirm = () => {
    if (!selected) return;
    localStorage.setItem("address_id", addrId(selected));
    onAddressSelected?.(addrText(selected));
    close();
  };

  // New address saved from the form: it is already the booking address.
  const onFormSubmit = (formatted) => {
    setManual(false);
    onAddressSelected?.(formatted);
    close();
  };

  if (!addressOpen || typeof document === "undefined") return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[1300] flex items-end justify-center bg-black/55 backdrop-blur-[2px] sm:items-center sm:p-4"
        onMouseDown={(e) => e.target === e.currentTarget && close()}
      >
        <div role="dialog" aria-modal="true" aria-labelledby="addr-title" className="flex max-h-[90vh] w-full max-w-md flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
          {/* Header */}
          <div className="flex items-start gap-3 border-b border-[var(--line)] px-5 py-4">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 text-white shadow-[0_6px_14px_-6px_rgba(98,41,205,.6)]">
              <MapPin className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 id="addr-title" className="text-[16px] font-bold text-[var(--ink)]">Select service address</h2>
              <p className="text-[12.5px] text-[var(--muted)]">Where should the technician come?</p>
            </div>
            <button type="button" onClick={close} aria-label="Close" className="-mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] hover:bg-gray-100">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {addresses.length === 0 ? (
              <div className="flex flex-col items-center rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surface-soft)] px-4 py-8 text-center">
                <MapPin className="h-8 w-8 text-purple-400" aria-hidden="true" />
                <p className="mt-2 text-sm font-semibold text-[var(--ink)]">No saved addresses yet</p>
                <p className="mt-1 text-xs text-[var(--muted)]">Add one to continue with your booking.</p>
              </div>
            ) : (
              <ul className="space-y-2.5" role="radiogroup" aria-label="Saved addresses">
                {addresses.map((a) => {
                  const id = addrId(a);
                  const on = id === selectedId;
                  const Icon = isOffice(a) ? Briefcase : Home;
                  return (
                    <li key={id || addrText(a)}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setSelectedId(id)}
                        className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition ${
                          on ? "border-purple-500 bg-purple-50/70 ring-2 ring-purple-200" : "border-[var(--line)] bg-white hover:border-purple-300 hover:bg-purple-50/40"
                        }`}
                      >
                        <span className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${on ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-700"}`}>
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">{isOffice(a) ? "Office" : "Home"}</span>
                            {a.name && <span className="truncate text-[12.5px] font-semibold text-[var(--ink-soft)]">· {a.name}</span>}
                          </span>
                          <span className="mt-0.5 block text-[14px] font-semibold leading-snug break-words text-[var(--ink)]">{line1(a) || addrText(a)}</span>
                          {line1(a) && <span className="mt-0.5 block text-[12.5px] text-[var(--muted)]">{line2(a)}</span>}
                        </span>
                        <span className={`mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${on ? "border-purple-600 bg-purple-600 text-white" : "border-[var(--line-strong)] bg-white"}`}>
                          {on && <Check className="h-3 w-3" aria-hidden="true" />}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            <button
              type="button"
              onClick={() => setManual(true)}
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-purple-300 bg-white text-[14px] font-semibold text-purple-700 transition hover:bg-purple-50"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> Add new address
            </button>
          </div>

          {/* Footer */}
          <div className="flex gap-2 border-t border-[var(--line)] p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
            <button type="button" onClick={close} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-white px-4 text-[14px] font-semibold text-[var(--ink-soft)] hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={!selected}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[image:var(--grad-brand)] text-[15px] font-semibold text-white shadow-[var(--shadow-cta)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check className="h-4 w-4" aria-hidden="true" /> Confirm address
            </button>
          </div>
        </div>
      </div>

      <AddressFormModal open={manual} handleClose={() => setManual(false)} onAddressSubmit={onFormSubmit} />
    </>,
    document.body
  );
}
