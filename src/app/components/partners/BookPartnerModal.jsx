"use client";

import { useEffect, useMemo, useState } from "react";
import { X, Loader2, Check, MapPin, Plus, ChevronLeft } from "lucide-react";
import { partnerApi } from "./partnerApi";
import CustomerOtp from "./CustomerOtp";
import { inputCls, btnPrimary, btnGhost, FieldError } from "./ui";
import { CRM_LEAD_TYPES, CRM_WIZARD_API } from "@/lib/partners/crmMap";

const MAX_SERVICES = 5;
const key = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const smallInput = `${inputCls} !py-2 text-sm`;
const label = "mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]";

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
 * Compact "Book now" for one partner: step 1 = brand + one or more services,
 * step 2 = time + address. Category / brand / city come from the page; name
 * and mobile from the OTP-verified customer; addresses from saved ones.
 */
export default function BookPartnerModal({ partner, categories, defaultCategory, brandName, cityName, onClose }) {
  const [phase, setPhase] = useState("loading"); // loading | login | service | details | done
  const [customer, setCustomer] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [category, setCategory] = useState(defaultCategory || categories[0]?.url || "");
  const [brands, setBrands] = useState([]);
  const [brandId, setBrandId] = useState("");
  const [services, setServices] = useState([]);
  const [picked, setPicked] = useState([]);
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
  const chosen = services.filter((s) => picked.includes(s.id));
  const total = chosen.reduce((a, s) => a + s.price, 0);

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
    setPhase("service");
  };

  useEffect(() => {
    partnerApi("/api/customer-auth/me").then((r) => {
      if (r.ok && r.data.customer) enterForm(r.data.customer, r.data.addresses);
      else setPhase("login");
    });
  }, []);

  useEffect(() => {
    if (!customer || !leadType) return;
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
  }, [customer, leadType, brandName]);

  useEffect(() => {
    setServices([]);
    setPicked([]);
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

  const togglePick = (id) => {
    setErr(null);
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= MAX_SERVICES ? p : [...p, id]));
  };

  const next = () => {
    const fields = {};
    if (!brandId) fields.brand = "Choose a brand.";
    if (!picked.length) fields.service = "Choose at least one service.";
    if (Object.keys(fields).length) return setErr({ message: "", fields });
    setErr(null);
    setPhase("details");
  };

  const submit = async () => {
    const fields = {};
    if (name.trim().length < 2) fields.name = "Enter your name.";
    if (!slot) fields.slot = "Choose a time slot.";
    const address = addrId === "new" ? newAddr : addresses.find((a) => a.id === addrId);
    if (!address) fields.address = "Choose or add an address.";
    else if (addrId === "new") {
      if (!newAddr.house_no.trim()) fields.house_no = "Required";
      if (newAddr.area.trim().length < 2) fields.area = "Required";
      if (!/^[1-9]\d{5}$/.test(newAddr.pincode)) fields.pincode = "6-digit pincode";
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
        php_service_ids: picked.map(Number),
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
    } else if (r.status === 401) setPhase("login");
    else {
      // Brand / service problems belong to step 1.
      if (r.error.fields?.service || r.error.fields?.brand) setPhase("service");
      setErr(r.error);
    }
  };

  const fe = err?.fields || {};
  const step = phase === "service" ? 1 : phase === "details" ? 2 : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="book-title" className="flex max-h-[88vh] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-[var(--line)] px-5 py-3.5">
          {phase === "details" && (
            <button onClick={() => setPhase("service")} className="-ml-2 rounded-full p-1.5 hover:bg-gray-100" aria-label="Back">
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h2 id="book-title" className="truncate text-base font-bold text-[var(--ink)]">Book {catName || "service"} · {partner.name}</h2>
            <p className="truncate text-xs text-[var(--muted)]">
              {[cityName, brandName].filter(Boolean).join(" · ")}
              {step > 0 && ` · Step ${step} of 2: ${step === 1 ? "Choose services" : "Time & address"}`}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body (only this part scrolls) */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {phase === "loading" && <p className="flex items-center gap-2 py-8 text-sm text-[var(--muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>}

          {phase === "login" && (
            <CustomerOtp intro="Verify your mobile number to book. Your booking is shared only with this partner." onVerified={(d) => enterForm(d.customer, d.addresses)} />
          )}

          {phase === "done" && (
            <div className="py-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-6 w-6" /></div>
              <h3 className="text-lg font-bold text-[var(--ink)]">Booking request sent</h3>
              <p className="mt-1 text-sm text-[var(--body-text)]">
                {partner.name} has your request for <b>{done?.service}</b> (₹{done?.price}). If they can&apos;t take it, our team will arrange the service for you.
              </p>
            </div>
          )}

          {phase === "service" && (
            <div className="space-y-3">
              <div className={`grid gap-2 ${categories.length > 1 ? "grid-cols-2" : ""}`}>
                {categories.length > 1 && (
                  <div>
                    <label htmlFor="bk-cat" className={label}>Category</label>
                    <select id="bk-cat" className={smallInput} value={category} onChange={(e) => setCategory(e.target.value)}>
                      {categories.map((c) => <option key={c.url} value={c.url}>{c.name}</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label htmlFor="bk-brand" className={label}>Brand</label>
                  <select id="bk-brand" className={smallInput} value={brandId} onChange={(e) => setBrandId(e.target.value)} disabled={loadingList === "brands"}>
                    <option value="">{loadingList === "brands" ? "Loading…" : "Select brand"}</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                  <FieldError msg={fe.brand} />
                </div>
              </div>

              {brandId && (
                <fieldset>
                  <legend className={label}>Services <span className="normal-case tracking-normal">(select one or more)</span></legend>
                  {loadingList === "services" ? (
                    <p className="flex items-center gap-2 text-sm text-[var(--muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading services…</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {services.map((s) => {
                        const on = picked.includes(s.id);
                        return (
                          <label
                            key={s.id}
                            className={`relative flex cursor-pointer flex-col rounded-xl border-2 px-3 py-2 text-sm transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-purple-600 ${on ? "border-purple-600 bg-purple-50" : "border-[var(--line)] hover:border-purple-300"}`}
                          >
                            <input type="checkbox" className="sr-only" checked={on} onChange={() => togglePick(s.id)} />
                            <span className={`absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded border ${on ? "border-purple-600 bg-purple-600 text-white" : "border-gray-300"}`}>
                              {on && <Check className="h-3 w-3" />}
                            </span>
                            <span className="pr-5 font-medium leading-tight text-[var(--ink)]">{s.name}</span>
                            <b className="mt-0.5 text-purple-700">₹{s.price}</b>
                          </label>
                        );
                      })}
                      {!services.length && <p className="col-span-2 text-sm text-[var(--muted)]">No services available for this brand.</p>}
                    </div>
                  )}
                  {picked.length >= MAX_SERVICES && <p className="mt-1 text-xs text-[var(--muted)]">Up to {MAX_SERVICES} services per booking.</p>}
                  <FieldError msg={fe.service} />
                </fieldset>
              )}
            </div>
          )}

          {phase === "details" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="bk-name" className={label}>Name</label>
                  <input id="bk-name" className={smallInput} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
                  <FieldError msg={fe.name} />
                </div>
                <div>
                  <span className={label}>Mobile</span>
                  <p className="flex min-h-[38px] items-center rounded-xl bg-gray-50 px-3 text-sm">+91 {customer?.mobile}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="bk-date" className={label}>Date</label>
                  <input id="bk-date" type="date" className={smallInput} min={istToday()} max={maxDate} value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="bk-shift" className={label}>Time</label>
                  <select id="bk-shift" className={smallInput} value={shift} onChange={(e) => setShift(e.target.value)}>
                    <option value="">Select</option>
                    {shiftsFor(date).map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="bk-slot" className={label}>Slot</label>
                  <select id="bk-slot" className={smallInput} value={slot} onChange={(e) => setSlot(e.target.value)} disabled={!slots.length}>
                    <option value="">Select</option>
                    {slots.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <FieldError msg={fe.slot} />

              <fieldset>
                <legend className={label}>Service address</legend>
                <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
                  {addresses.map((a) => (
                    <label key={a.id} className={`flex cursor-pointer items-start gap-2 rounded-xl border-2 px-3 py-2 text-sm ${addrId === a.id ? "border-purple-600 bg-purple-50" : "border-[var(--line)]"}`}>
                      <input type="radio" name="bk-addr" className="mt-1 accent-purple-600" checked={addrId === a.id} onChange={() => setAddrId(a.id)} />
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                      <span className="line-clamp-2">{[a.house_no, a.area, a.landmark, a.city, a.pincode].filter(Boolean).join(", ")}</span>
                    </label>
                  ))}
                  <label className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-2 text-sm ${addrId === "new" ? "border-purple-600 bg-purple-50" : "border-[var(--line)]"}`}>
                    <input type="radio" name="bk-addr" className="accent-purple-600" checked={addrId === "new"} onChange={() => setAddrId("new")} />
                    <Plus className="h-4 w-4 text-purple-500" /> Add a new address
                  </label>
                </div>
                {addrId === "new" && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <input aria-label="House / flat no." placeholder="House / flat no. *" className={smallInput} value={newAddr.house_no} maxLength={150} onChange={(e) => setNewAddr((s) => ({ ...s, house_no: e.target.value }))} />
                      <FieldError msg={fe.house_no} />
                    </div>
                    <div>
                      <input aria-label="Area / street" placeholder="Area / street *" className={smallInput} value={newAddr.area} maxLength={150} onChange={(e) => setNewAddr((s) => ({ ...s, area: e.target.value }))} />
                      <FieldError msg={fe.area} />
                    </div>
                    <input aria-label="Landmark" placeholder="Landmark" className={smallInput} value={newAddr.landmark} maxLength={150} onChange={(e) => setNewAddr((s) => ({ ...s, landmark: e.target.value }))} />
                    <div>
                      <input aria-label="Pincode" placeholder="Pincode *" inputMode="numeric" className={smallInput} value={newAddr.pincode} onChange={(e) => setNewAddr((s) => ({ ...s, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) }))} />
                      <FieldError msg={fe.pincode} />
                    </div>
                  </div>
                )}
                <FieldError msg={fe.address} />
              </fieldset>
            </div>
          )}

          {err?.message && !(phase === "service" && err.fields) && <div className="mt-2"><FieldError msg={err.message} /></div>}
        </div>

        {/* Sticky footer */}
        {(phase === "service" || phase === "details" || phase === "done") && (
          <div className="flex items-center gap-3 border-t border-[var(--line)] px-5 py-3">
            {phase === "done" ? (
              <button className={`${btnPrimary} w-full`} onClick={onClose}>Done</button>
            ) : (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold leading-tight text-[var(--ink)]">₹{total.toLocaleString("en-IN")}</p>
                  <p className="truncate text-xs text-[var(--muted)]">{chosen.length ? `${chosen.length} service${chosen.length > 1 ? "s" : ""}: ${chosen.map((s) => s.name).join(", ")}` : "No service selected"}</p>
                </div>
                {phase === "service" ? (
                  <button className={btnPrimary} onClick={next} disabled={!picked.length}>Continue</button>
                ) : (
                  <>
                    <button className={`${btnGhost} hidden sm:inline-flex`} onClick={() => setPhase("service")} disabled={busy}>Back</button>
                    <button className={btnPrimary} onClick={submit} disabled={busy}>
                      {busy && <Loader2 className="h-4 w-4 animate-spin" />} Confirm booking
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
