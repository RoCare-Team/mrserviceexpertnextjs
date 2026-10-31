"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { X, Home, Briefcase, Loader2, ChevronDown, Save } from "lucide-react";

const EMPTY = {
  street: "",
  landmark: "",
  houseNo: "",
  pincode: "",
  state: "",
  city: "",
  full_address: "",
  phone: "",
  alt_address_mob: "",
  phoneNumber: "",
  home_office: "",
  name: "",
};

const inputCls =
  "w-full rounded-xl border border-[var(--line-strong)] bg-white px-3.5 py-2.5 text-[15px] text-[var(--ink)] outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 disabled:bg-gray-50 disabled:text-gray-500 aria-[invalid=true]:border-red-400";
const labelCls = "mb-1 block text-[12.5px] font-semibold text-[var(--ink-soft)]";

function Field({ id, label, required, hint, error, children }) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      {children}
      {error ? <p className="mt-1 text-[12px] text-red-600">{error}</p> : hint ? <p className="mt-1 text-[12px] text-[var(--muted)]">{hint}</p> : null}
    </div>
  );
}

function SelectBox({ id, value, onChange, disabled, placeholder, options }) {
  return (
    <div className="relative">
      <select id={id} value={value} onChange={onChange} disabled={disabled} className={`${inputCls} appearance-none pr-9`}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
    </div>
  );
}

/**
 * "Add new address" form. Saves to the CRM (add_address.php), refreshes the
 * saved-address list in localStorage and hands the new address back.
 */
export default function AddressFormModal({ open, handleClose, onAddressSubmit }) {
  const [addressType, setAddressType] = useState("Home");
  const [formData, setFormData] = useState(EMPTY);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false); // state / city / pincode lookups
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Prefill from the login so the customer only types the address.
  useEffect(() => {
    if (!open) return;
    try {
      setFormData((f) => ({
        ...f,
        name: f.name || localStorage.getItem("userName") || localStorage.getItem("name") || "",
        phone: f.phone || (localStorage.getItem("userPhone") || "").replace(/\D/g, "").slice(-10),
      }));
    } catch {
      /* ignore */
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && handleClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get("https://www.waterpurifierservicecenter.in/wizard/app/getState.php");
        if (alive && data?.AvailableState) setStates(data.AvailableState.map((i) => i.state));
      } catch (e) {
        if (alive) setMessage("Error loading states. Please try again.");
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!formData.state) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setCities([]);
        const { data } = await axios.get(`https://www.waterpurifierservicecenter.in/wizard/app/getCity.php?state=${encodeURIComponent(formData.state)}`);
        if (alive && data?.AvailableCities) setCities(data.AvailableCities.map((i) => i.city_name));
      } catch (e) {
        if (alive) setMessage("Error loading cities. Please try again.");
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [formData.state]);

  const set = (id, value) => setFormData((f) => ({ ...f, [id]: value }));
  const onText = (e) => set(e.target.id, e.target.value);
  const onPhone = (e) => set(e.target.id, e.target.value.replace(/[^0-9]/g, "").slice(0, 10));

  const onPincode = async (e) => {
    const pincode = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
    set("pincode", pincode);
    setMessage("");
    if (pincode.length !== 6) return;
    try {
      setLoading(true);
      const { data } = await axios.get(`https://inet.waterpurifierservicecenter.in/include/ajax/get_city_with_pincode.php?pincode=${pincode}`);
      if (data?.state) setFormData((f) => ({ ...f, state: data.state, city: data.city || "" }));
      else setMessage("No location found for this pincode.");
    } catch (err) {
      setMessage("Error looking up pincode. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const phoneBad = formData.phone.length > 0 && formData.phone.length !== 10;
  const altBad = formData.alt_address_mob.length > 0 && formData.alt_address_mob.length !== 10;
  const pinBad = formData.pincode.length > 0 && formData.pincode.length !== 6;
  const canSave =
    formData.street &&
    formData.city &&
    formData.state &&
    formData.houseNo &&
    formData.name &&
    formData.phone.length === 10 &&
    formData.pincode.length === 6 &&
    !altBad &&
    !saving;

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!canSave) return;
    const payload = { ...formData, phoneNumber: localStorage.getItem("userPhone") || "", home_office: addressType };
    const formattedAddress = `${payload.houseNo}, ${payload.street}, ${payload.landmark}, ${payload.city}, ${payload.state}, ${payload.pincode},${payload.alt_address_mob},${payload.phone},${payload.phoneNumber},${payload.name}, (${addressType})`;
    try {
      setSaving(true);
      const res = await fetch("https://waterpurifierservicecenter.in/customer/ro_customer/add_address.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.address) localStorage.setItem("RecentAddress", JSON.stringify(data.address));
      if (data.full_address) localStorage.setItem("booking_ads", data.full_address);
      if (data.address_id != null) localStorage.setItem("address_id", JSON.stringify(data.address_id));
      toast.success(data.msg || "Address saved");
      onAddressSubmit?.({ ...payload, addressType, formattedAddress });
      setFormData((f) => ({ ...EMPTY, name: f.name, phone: f.phone }));
      handleClose();
    } catch (err) {
      console.error(err);
      toast.error("Could not save the address. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!open || typeof document === "undefined") return null;

  const typeBtn = (type, Icon) => {
    const on = addressType === type;
    return (
      <button
        type="button"
        onClick={() => setAddressType(type)}
        aria-pressed={on}
        className={`inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border text-[14px] font-semibold transition ${
          on ? "border-purple-600 bg-purple-600 text-white shadow-sm" : "border-[var(--line-strong)] bg-white text-[var(--ink-soft)] hover:bg-purple-50"
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" /> {type}
      </button>
    );
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1310] flex items-end justify-center bg-black/55 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && handleClose()}
    >
      <form
        onSubmit={onSubmit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="addr-form-title"
        className="flex max-h-[92vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-start gap-3 border-b border-[var(--line)] px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 id="addr-form-title" className="text-[16px] font-bold text-[var(--ink)]">Add new address</h2>
            <p className="text-[12.5px] text-[var(--muted)]">Enter the pincode and we fill in the state and city.</p>
          </div>
          <button type="button" onClick={handleClose} aria-label="Close" className="-mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--muted)] hover:bg-gray-100">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="flex gap-2">
            {typeBtn("Home", Home)}
            {typeBtn("Office", Briefcase)}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="name" label="Name" required>
              <input id="name" value={formData.name} onChange={onText} required autoComplete="name" className={inputCls} />
            </Field>
            <Field id="phone" label="Phone number" required error={phoneBad ? "Enter a 10-digit number" : ""}>
              <input id="phone" value={formData.phone} onChange={onPhone} inputMode="numeric" maxLength={10} required aria-invalid={phoneBad} className={inputCls} />
            </Field>
            <Field id="alt_address_mob" label="Alternate phone" error={altBad ? "Enter a 10-digit number" : ""}>
              <input id="alt_address_mob" value={formData.alt_address_mob} onChange={onPhone} inputMode="numeric" maxLength={10} aria-invalid={altBad} className={inputCls} />
            </Field>
            <Field id="pincode" label="Pincode" required error={pinBad ? "Enter a 6-digit pincode" : ""} hint="Auto-fills state and city">
              <div className="relative">
                <input id="pincode" value={formData.pincode} onChange={onPincode} inputMode="numeric" maxLength={6} required aria-invalid={pinBad} className={inputCls} />
                {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-purple-600" aria-hidden="true" />}
              </div>
            </Field>
            <Field id="state" label="State" required>
              <SelectBox id="state" value={formData.state} onChange={(e) => setFormData((f) => ({ ...f, state: e.target.value, city: "" }))} disabled={loading} placeholder="Select state" options={states} />
            </Field>
            <Field id="city" label="City" required>
              <SelectBox id="city" value={formData.city} onChange={(e) => set("city", e.target.value)} disabled={loading || !formData.state} placeholder="Select city" options={cities} />
            </Field>
            <Field id="houseNo" label="House / flat no." required>
              <input id="houseNo" value={formData.houseNo} onChange={onText} required className={inputCls} />
            </Field>
            <Field id="street" label="Street / area" required>
              <input id="street" value={formData.street} onChange={onText} required className={inputCls} />
            </Field>
            <Field id="landmark" label="Landmark" required>
              <input id="landmark" value={formData.landmark} onChange={onText} required className={inputCls} />
            </Field>
            <Field id="full_address" label="Additional details">
              <input id="full_address" value={formData.full_address} onChange={onText} placeholder="Floor, gate, directions…" className={inputCls} />
            </Field>
          </div>

          {message && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">
              {message}
            </p>
          )}
        </div>

        <div className="flex gap-2 border-t border-[var(--line)] p-4 pb-[max(16px,env(safe-area-inset-bottom))]">
          <button type="button" onClick={handleClose} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-white px-4 text-[14px] font-semibold text-[var(--ink-soft)] hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[image:var(--grad-brand)] text-[15px] font-semibold text-white shadow-[var(--shadow-cta)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Save className="h-4 w-4" aria-hidden="true" />} Save address
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
