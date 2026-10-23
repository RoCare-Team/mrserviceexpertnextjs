// Bridge to the existing CRM / booking PHP APIs (the same endpoints the
// site's booking popup uses). Prices and brands are always re-read here on
// the server so a booking can't be submitted with a tampered price.

const WIZARD = "https://waterpurifierservicecenter.in/wizard/app";
const PINCODE_API = "https://inet.waterpurifierservicecenter.in/include/ajax/get_city_with_pincode.php";

export { CRM_LEAD_TYPES } from "@/lib/partners/crmMap";

async function getJson(url, { timeout = 15_000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { cache: "no-store", signal: ctrl.signal });
    const text = await res.text();
    // Some endpoints prefix blank lines before the JSON.
    return JSON.parse(text.trim());
  } finally {
    clearTimeout(t);
  }
}

export async function crmBrands(leadType) {
  const d = await getJson(`${WIZARD}/getBrand.php?lead_type_category=${encodeURIComponent(leadType)}`);
  return (d?.brand || []).map((b) => ({ id: Number(b.id), name: String(b.name) }));
}

export async function crmServices(leadType, brandId) {
  const d = await getJson(
    `${WIZARD}/getAllServices.php?lead_type_category=${encodeURIComponent(leadType)}&brand=${encodeURIComponent(brandId)}`
  );
  return (d?.service_details || []).map((s) => ({ id: Number(s.id), name: String(s.service_name), price: Number(s.price) }));
}

export async function crmPincode(pincode) {
  const d = await getJson(`${PINCODE_API}?pincode=${encodeURIComponent(pincode)}`);
  if (!d?.city_id) return null;
  return { cityId: Number(d.city_id), city: String(d.city || ""), state: String(d.state || "") };
}

const withPartner = (url, slug) => {
  try {
    const u = new URL(url);
    u.searchParams.set("partner", slug);
    return u.toString();
  } catch {
    return url;
  }
};

/**
 * Create the lead in the CRM the same way the booking popup does (details →
 * brand → slot → service), without sending the customer another OTP.
 * Returns { status: "sent" | "duplicate" | "failed", message }.
 */
export async function forwardLeadToCrm(lead, partnerSlug) {
  const base = {
    name: lead.customer_name,
    mobile: lead.customer_mobile,
    email: "",
    lead_type: String(lead.php_lead_type),
    state: lead.address_state,
    city: lead.php_city_id ? String(lead.php_city_id) : "",
    complain_type: "2",
    site_url: withPartner(lead.page_url, partnerSlug),
    check: "nootp",
    otp_chk: "mrserviceexpert",
  };
  const call = (extra) => getJson(`${WIZARD}/AddLead_new.php?${new URLSearchParams({ ...base, ...extra })}`, { timeout: 20_000 });

  try {
    const first = await call({
      pincode: lead.pincode,
      house_no: lead.house_no,
      area: lead.area,
      near_by: lead.landmark || lead.area,
      sev_type_val: "2",
      new_type_val: "product",
      new_purchase_type: "1",
      otpsend: "0",
      otp_verify: "verifyed",
    });
    if (first?.status === 2) return { status: "duplicate", message: "CRM: customer already has a booking in this category." };
    if (first?.status !== 1) return { status: "failed", message: `CRM rejected details: ${JSON.stringify(first).slice(0, 200)}` };

    const brand = lead.php_brand_id ? String(lead.php_brand_id) : "";
    await call({ brand });
    const date = typeof lead.appointment_date === "string" ? lead.appointment_date : new Date(lead.appointment_date).toISOString().slice(0, 10);
    await call({ brand, appointment_date: date, appointment_time: lead.appointment_time });
    // One call per service, exactly like selecting services in the popup.
    const services = lead.services?.length ? lead.services : [{ id: lead.php_service_id, name: lead.service_name, price: lead.service_price }];
    for (const s of services) {
      await call({
        brand,
        appointment_date: date,
        appointment_time: lead.appointment_time,
        service_id: String(s.id),
        service_name: s.name,
        service_price: String(s.price),
        amount: String(s.price),
        price: String(s.price),
      });
    }
    return { status: "sent", message: "Forwarded to CRM." };
  } catch (err) {
    return { status: "failed", message: `CRM error: ${String(err?.message || err).slice(0, 200)}` };
  }
}
