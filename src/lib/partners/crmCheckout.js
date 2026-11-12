// Partner lead → CRM through the same APIs as the site's checkout:
//   add_address.php  → address_id (saved on the customer's CRM account)
//   add_to_cart.php  → category_cart_id
//   add_lead_with_full_dtls.php → lead
// Needs the customer_id (c_id from the OTP login, same as localStorage "customer_id"). No "@/" imports so
// it can be run from a plain node script for testing.

const RO = "https://waterpurifierservicecenter.in/customer/ro_customer";
const SOURCE = "mrserviceexpert website";

async function post(path, body, timeout = 20_000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(`${RO}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: ctrl.signal,
    });
    const text = (await res.text()).trim();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`${path}: not JSON (${text.slice(0, 120)})`);
    }
  } finally {
    clearTimeout(t);
  }
}

const short = (v) => JSON.stringify(v).slice(0, 200);

/**
 * lead: partner_leads row + services [{id,name,price}] + php_customer_id.
 * Returns { status: "sent" | "failed", message }.
 */
export async function bookViaCheckout(lead) {
  const cid = String(lead.php_customer_id || "");
  if (!cid) return { status: "failed", message: "No customer_id for this customer." };
  const mobile = String(lead.customer_mobile);

  // 1) Address on the customer's CRM account.
  const addr = await post("add_address.php", {
    name: lead.customer_name,
    phone: mobile,
    alt_address_mob: "",
    pincode: String(lead.pincode),
    state: lead.address_state || "",
    city: lead.address_city || "",
    houseNo: lead.house_no || "",
    street: lead.area || "",
    landmark: lead.landmark || "",
    phoneNumber: mobile,
    home_office: "Home",
  });
  const addressId = addr?.address_id;
  if (addressId === undefined || addressId === null || addressId === "") {
    return { status: "failed", message: `CRM address not saved: ${short(addr)}` };
  }

  // 2) Services into the cart.
  const ids = lead.services.map((s) => String(s.id));
  let cart = null;
  for (const id of ids) {
    cart = await post("add_to_cart.php", { service_id: id, quantity: 1, cid, type: "add", source: SOURCE });
  }
  const group = (cart?.AllCartDetails || []).find((g) => (g.cart_dtls || []).some((d) => ids.includes(String(d.service_id))));
  if (!group?.category_cart_id) return { status: "failed", message: `CRM cart not created: ${short(cart)}` };

  // 3) Lead for that cart.
  const r = await post("add_lead_with_full_dtls.php", {
    cust_id: cid,
    cust_mobile: mobile,
    address_id: String(addressId),
    cust_email: lead.customer_email || "",
    cart_id: group.category_cart_id,
    appointment_time: lead.appointment_time,
    appointment_date: String(lead.appointment_date).slice(0, 10),
    source: SOURCE,
  });
  if (r?.error === false || r?.error === "false") {
    return { status: "sent", message: `Forwarded to CRM (checkout, address ${addressId}). ${String(r.lead_id_for_payment || r.msg || "").slice(0, 200)}`.trim() };
  }
  return { status: "failed", message: `CRM booking rejected: ${short(r)}` };
}
