"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Check, MapPin, Plus, CalendarDays } from "lucide-react";
import { partnerApi } from "./partnerApi";
import CustomerOtp from "./CustomerOtp";
import { inputCls, labelCls, btnPrimary, btnGhost, FieldError } from "./ui";
import { CRM_LEAD_TYPES, CRM_WIZARD_API } from "@/lib/partners/crmMap";

const key = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

async function crmGet(path) {
  const res = await fetch(`${CRM_WIZARD_API}/${path}`);
  return JSON.parse((await res.text()).trim());
}

const istToday = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
const shiftsFor = (date) => {
  const all = ["Morning", "Afternoon", "Evening"];
  if (date !== istToday()) return all;
  const h = new Date().getHours();
  return h < 12 ? all : h < 18 ? all.slice(1) : all.slice(2);
};

/** Saved addresses from the site's existing login (localStorage). */
function storedAddresses() {
  try {
    const list = JSON.parse(localStorage.getItem("RecentAddress") || "[]");
    return (Array.isArray(list) ? list : [])
      .map((a) => ({
        id: `ls-${a.id ?? a.address_id ?? Math.random()}`,
        house_no: String(a.flat_no ?? "").trim(),
        area: String(a.area ?? "").trim(),
        landmark: String(a.landmark ?? "").trim(),
        city: String(a.city ?? "").trim(),
        state: String(a.state ?? "").trim(),
        pincode: String(a.pincode ?? "").replace(/\D/g, "").slice(0, 6),
      }))
      .filter((a) => (a.house_no || a.area) && /^\d{6}$/.test(a.pincode));
  } catch {
    return [];
  }
}

function mergeAddresses(...lists) {
  const out = [];
  for (const a of lists.flat()) {
    if (!out.some((b) => key(b.house_no + b.area + b.pincode) === key(a.house_no + a.area + a.pincode))) out.push(a);
  }
  return out;
}

/**
 * Compact "Book now" for one partner. Category / brand come from the page,
 * name + mobile from the verified customer, address from saved addresses.
 * The booking goes to the partner first (30 min), then to the CRM.
 */
export default function BookPartnerModal({ partner, categories, defaultCategory, brandName, cityName, onClose }) {
  const [phase, setPhase] = useState("loading"); // loading | login | form | done
  const [customer, setCustomer] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [category, setCategory] = useState(defaultCategory || categories[0]?.url || "");
  const [brands, setBrands] = useState([]);
  const [brandId, setBrandId] = useState("");
  const [services, setServices] = useState([]);
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(istToday());
  const [shift, setShift] = useState("");
  const [slots, setSlots] = useState([]);
  const [slot, setSlot] = useState("");
  const [addrId, setAddrId] = useState("");
  const [newAddr, setNewAddr] = useState({ house_no: "", area: "", landmark: "", pincode: "" });
  const [name, setName] = useState("");
  const [loadingList, setLoadingList] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [done, setDone] = useState(null);

  const leadType = CRM_LEAD_TYPES[category];
  const catName = categories.find((c) => c.url === category)?.name || "";
  const maxDate = useMemo(() => new Date(Date.now() + 5.5 * 3600_000 + 30 * 86400_000).toISOString().slice(0, 10), []);

  // Close on Escape; lock background scroll.
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const enterForm = (c, serverAddresses = []) => {
    setCustomer(c);
    setName(c.name || "");
    const list = mergeAddresses(serverAddresses, storedAddresses());
    setAddresses(list);
    setAddrId(list[0]?.id || "new");
    setPhase("form");
  };

  useEffect(() => {
    partnerApi("/api/customer-auth/me").then((r) => {
      if (r.ok && r.data.customer) enterForm(r.data.customer, r.data.addresses);
      else setPhase("login");
    });
  }, []);

  // Brands for the category; pre-select the page's brand when it matches.
  useEffect(() => {
    if (phase !== "form" || !leadType) return;
    setLoadingList("brands");
    setBrands([]);
    setBrandId("");
    crmGet(`getBrand.php?lead_type_category=${leadType}`)
      .then((d) => {
        const list = (d.brand || []).map((b) => ({ id: String(b.id), name: b.name }));
        setBrands(list);
        const match = brandName && list.find((b) => key(b.name) === key(brandName));
        setBrandId(match ? match.id : "");
      })
      .catch(() => setErr({ message: "Couldn't load brands. Please try again." }))
      .finally(() => setLoadingList(""));
  }, [phase, leadType, brandName]);

  // Services (with prices) for the brand.
  useEffect(() => {
    setServices([]);
    setServiceId("");
    if (!brandId || !leadType) return;
    setLoadingList("services");
    crmGet(`getAllServices.php?lead_type_category=${leadType}&brand=${brandId}`)
      .then((d) => setServices((d.service_details || []).map((s) => ({ id: String(s.id), name: s.service_name, price: Number(s.price) })).filter((s) => s.price > 0)))
      .catch(() => setErr({ message: "Couldn't load services. Please try again." }))
      .finally(() => setLoadingList(""));
  }, [brandId, leadType]);

  useEffect(() => {
    if (!shiftsFor(date).includes(shift)) setShift("");
  }, [date, shift]);

  useEffect(() => {
    setSlots([]);
    setSlot("");
    if (!shift) return;
    crmGet(`getTimeSlots.php?time_slot_name=${shift}`)
      .then((d) => setSlots((d.alltimeslots || []).map((s) => s.time_slots)))
      .catch(() => {});
  }, [shift]);

  const submit = async (e) => {
    e.preventDefault();
    const fields = {};
    if (name.trim().length < 2) fields.name = "Enter your name.";
    if (!brandId) fields.brand = "Choose a brand.";
    if (!serviceId) fields.service = "Choose a service.";
    if (!slot) fields.slot = "Choose a time slot.";
    const address = addrId === "new" ? newAddr : addresses.find((a) => a.id === addrId);
    if (!address) fields.address = "Choose or add an address.";
    else if (addrId === "new") {
      if (!newAddr.house_no.trim()) fields.house_no = "Enter house / flat no.";
      if (newAddr.area.trim().length < 2) fields.area = "Enter area / street.";
      if (!/^[1-9]\d{5}$/.test(newAddr.pincode)) fields.pincode = "Enter a valid pincode.";
    }
    if (Object.keys(fields).length) return setErr({ message: "Please complete the highlighted fields.", fields });

    setBusy(true);
    setErr(null);
    const r = await partnerApi("/api/partner-leads", {
      method: "POST",
      body: {
        partner: partner.slug,
        category,
        name,
        php_brand_id: Number(brandId),
        php_service_id: Number(serviceId),
        appointment_date: date,
        appointment_time: slot,
        address: { house_no: address.house_no, area: address.area, landmark: address.landmark, pincode: address.pincode },
        page_url: window.location.href,
      },
    });
    setBusy(false);
    if (r.ok) {
      setDone(r.data);
      setPhase("done");
    } else if (r.status === 401) {
      setPhase("login");
    } else setErr(r.error);
  };

  const fe = err?.fields || {};
  const selected = services.find((s) => s.id === serviceId);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="book-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex-1">
            <h2 id="book-title" className="text-lg font-bold text-[var(--ink)]">Book {catName || "service"}</h2>
            <p className="text-sm text-[var(--muted)]">
              with <b className="text-[var(--ink-soft)]">{partner.name}</b>
              {cityName ? ` · ${cityName}` : ""}
              {brandName ? ` · ${brandName}` : ""}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {phase === "loading" && (
          <p className="flex items-center gap-2 py-10 text-sm text-[var(--muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>
        )}

        {phase === "login" && (
          <CustomerOtp intro="Verify your mobile number to book. We'll share your booking only with this partner." onVerified={(d) => enterForm(d.customer, d.addresses)} />
        )}

        {phase === "done" && (
          <div className="py-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-6 w-6" /></div>
            <h3 className="text-lg font-bold text-[var(--ink)]">Booking request sent</h3>
            <p className="mt-1 text-sm text-[var(--body-text)]">
              {partner.name} has your request for <b>{done?.service}</b> (₹{done?.price}). If they can&apos;t take it, our team will arrange the service for you.
            </p>
            <button className={`${btnPrimary} mt-5`} onClick={onClose}>Done</button>
          </div>
        )}

        {phase === "form" && (
          <form onSubmit={submit} noValidate className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="bk-name" className={labelCls}>Name</label>
                <input id="bk-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
                <FieldError msg={fe.name} />
              </div>
              <div>
                <span className={labelCls}>Mobile</span>
                <p className="flex min-h-11 items-center rounded-xl bg-gray-50 px-3.5 text-[15px]">+91 {customer?.mobile}</p>
              </div>
            </div>

            {categories.length > 1 ? (
              <div>
                <label htmlFor="bk-cat" className={labelCls}>Service category</label>
                <select id="bk-cat" className={inputCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((c) => <option key={c.url} value={c.url}>{c.name}</option>)}
                </select>
              </div>
            ) : null}

            <div>
              <label htmlFor="bk-brand" className={labelCls}>Brand</label>
              <select id="bk-brand" className={inputCls} value={brandId} onChange={(e) => setBrandId(e.target.value)} disabled={loadingList === "brands"}>
                <option value="">{loadingList === "brands" ? "Loading brands…" : "Select brand"}</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <FieldError msg={fe.brand} />
            </div>

            {brandId && (
              <fieldset>
                <legend className={labelCls}>Service</legend>
                {loadingList === "services" ? (
                  <p className="flex items-center gap-2 text-sm text-[var(--muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading services…</p>
                ) : (
                  <div className="grid gap-2">
                    {services.map((s) => (
                      <label key={s.id} className={`flex cursor-pointer items-center justify-between rounded-xl border-2 px-3.5 py-2.5 text-sm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-purple-600 ${serviceId === s.id ? "border-purple-600 bg-purple-50" : "border-[var(--line)]"}`}>
                        <span className="flex items-center gap-2">
                          <input type="radio" name="bk-service" className="accent-purple-600" checked={serviceId === s.id} onChange={() => setServiceId(s.id)} />
                          {s.name}
                        </span>
                        <b>₹{s.price}</b>
                      </label>
                    ))}
                    {!services.length && <p className="text-sm text-[var(--muted)]">No services available for this brand.</p>}
                  </div>
                )}
                <FieldError msg={fe.service} />
              </fieldset>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="bk-date" className={labelCls}><CalendarDays className="mr-1 inline h-3.5 w-3.5" />Date</label>
                <input id="bk-date" type="date" className={inputCls} min={istToday()} max={maxDate} value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label htmlFor="bk-shift" className={labelCls}>Time of day</label>
                <select id="bk-shift" className={inputCls} value={shift} onChange={(e) => setShift(e.target.value)}>
                  <option value="">Select</option>
                  {shiftsFor(date).map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="bk-slot" className={labelCls}>Slot</label>
                <select id="bk-slot" className={inputCls} value={slot} onChange={(e) => setSlot(e.target.value)} disabled={!slots.length}>
                  <option value="">Select</option>
                  {slots.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <FieldError msg={fe.slot} />

            <fieldset>
              <legend className={labelCls}>Service address</legend>
              <div className="grid gap-2">
                {addresses.map((a) => (
                  <label key={a.id} className={`flex cursor-pointer items-start gap-2 rounded-xl border-2 px-3.5 py-2.5 text-sm ${addrId === a.id ? "border-purple-600 bg-purple-50" : "border-[var(--line)]"}`}>
                    <input type="radio" name="bk-addr" className="mt-1 accent-purple-600" checked={addrId === a.id} onChange={() => setAddrId(a.id)} />
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                    <span>{[a.house_no, a.area, a.landmark, a.city, a.pincode].filter(Boolean).join(", ")}</span>
                  </label>
                ))}
                <label className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3.5 py-2.5 text-sm ${addrId === "new" ? "border-purple-600 bg-purple-50" : "border-[var(--line)]"}`}>
                  <input type="radio" name="bk-addr" className="accent-purple-600" checked={addrId === "new"} onChange={() => setAddrId("new")} />
                  <Plus className="h-4 w-4 text-purple-500" /> Add a new address
                </label>
              </div>
              {addrId === "new" && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <input aria-label="House / flat no." placeholder="House / flat no. *" className={inputCls} value={newAddr.house_no} maxLength={150} onChange={(e) => setNewAddr((s) => ({ ...s, house_no: e.target.value }))} />
                    <FieldError msg={fe.house_no} />
                  </div>
                  <div>
                    <input aria-label="Area / street" placeholder="Area / street *" className={inputCls} value={newAddr.area} maxLength={150} onChange={(e) => setNewAddr((s) => ({ ...s, area: e.target.value }))} />
                    <FieldError msg={fe.area} />
                  </div>
                  <input aria-label="Landmark" placeholder="Landmark" className={inputCls} value={newAddr.landmark} maxLength={150} onChange={(e) => setNewAddr((s) => ({ ...s, landmark: e.target.value }))} />
                  <div>
                    <input aria-label="Pincode" placeholder="Pincode *" inputMode="numeric" className={inputCls} value={newAddr.pincode} onChange={(e) => setNewAddr((s) => ({ ...s, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))} />
                    <FieldError msg={fe.pincode} />
                  </div>
                </div>
              )}
              <FieldError msg={fe.address} />
            </fieldset>

            {err && !err.fields && <FieldError msg={err.message} />}
            {err?.fields && !Object.keys(err.fields).some((k) => fe[k] && ["name", "brand", "service", "slot", "address", "house_no", "area", "pincode"].includes(k)) && <FieldError msg={err.message} />}

            <div className="flex flex-col-reverse gap-2 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <button type="button" className={btnGhost} onClick={onClose} disabled={busy}>Cancel</button>
              <button type="submit" className={btnPrimary} disabled={busy}>
                {busy && <Loader2 className="h-4 w-4 animate-spin" />} Confirm booking{selected ? ` · ₹${selected.price}` : ""}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
