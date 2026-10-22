// Pure validators shared by the partner APIs (and safe to import in the
// browser for instant feedback — the server always re-validates).

export const BUSINESS_TYPES = {
  individual: "Individual Technician",
  shop: "Shop",
  service_center: "Service Center",
  company: "Company",
};

export const CONTACT_PREFERENCES = { call: "Call", whatsapp: "WhatsApp", both: "Call & WhatsApp" };

export const DOC_TYPES = {
  aadhaar: "Aadhaar card",
  gst_certificate: "GST certificate",
  id_proof: "PAN / other ID proof",
  business_proof: "Business proof (shop licence, Udyam, etc.)",
  other: "Other document",
};

export const STATUS_LABELS = {
  draft: "Draft",
  pending: "Under review",
  info_requested: "More info needed",
  approved: "Approved",
  rejected: "Rejected",
  suspended: "Suspended",
};

// Bump when the partner terms / privacy text changes; stored with consent.
export const CONSENT_VERSION = "2026-10-14";

export const LIMITS = {
  name: 120,
  businessName: 150,
  description: 1500,
  hours: 160,
  email: 190,
  address: 255,
  locality: 150,
  customBrand: 60,
  maxCategories: 20,
  maxAreas: 50,
  maxBrandsPerCategory: 40,
};

const clean = (v) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim() : "");

/** Accepts "+91 98xxx", "098xxx", "98xxx…" → "98xxxxxxxx" or null. */
export function normalizeMobile(raw) {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  else if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? d : null;
}

export function validName(v) {
  const s = clean(v);
  if (s.length < 2) return { error: "Please enter your full name." };
  if (s.length > LIMITS.name) return { error: `Name must be under ${LIMITS.name} characters.` };
  if (!/^[\p{L} .'-]+$/u.test(s)) return { error: "Name can contain letters, spaces, dots and hyphens only." };
  return { value: s };
}

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

/** Format check only — this does NOT mean the GSTIN is registered. */
export function validGstin(v) {
  const s = String(v ?? "").toUpperCase().replace(/\s/g, "");
  if (!s) return { value: null };
  if (!GSTIN_RE.test(s)) return { error: "GSTIN format looks wrong (15 characters, e.g. 06ABCDE1234F1Z5)." };
  return { value: s };
}

export function validPincode(v) {
  const s = String(v ?? "").trim();
  return /^[1-9]\d{5}$/.test(s) ? { value: s } : { error: "Enter a valid 6-digit pincode." };
}

export function validEmail(v) {
  const s = clean(v).toLowerCase();
  if (!s) return { value: null };
  if (s.length > LIMITS.email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)) return { error: "Enter a valid email address." };
  return { value: s };
}

/** Collects { field: message } errors for the business step. */
export function validateBusiness(input = {}) {
  const errors = {};
  const out = {};

  if (!BUSINESS_TYPES[input.business_type]) errors.business_type = "Choose your business type.";
  else out.business_type = input.business_type;

  const name = clean(input.business_name);
  if (name.length < 2) errors.business_name = "Business / shop name is required.";
  else if (name.length > LIMITS.businessName) errors.business_name = `Keep it under ${LIMITS.businessName} characters.`;
  else out.business_name = name;

  const desc = String(input.description ?? "").trim();
  if (desc.length > LIMITS.description) errors.description = `Keep it under ${LIMITS.description} characters.`;
  else out.description = desc || null;

  if (input.experience_years === "" || input.experience_years === null || input.experience_years === undefined) {
    out.experience_years = null;
  } else {
    const n = Number(input.experience_years);
    if (!Number.isInteger(n) || n < 0 || n > 60) errors.experience_years = "Enter years between 0 and 60.";
    else out.experience_years = n;
  }

  const gst = validGstin(input.gstin);
  if (gst.error) errors.gstin = gst.error;
  else out.gstin = gst.value;

  const email = validEmail(input.business_email);
  if (email.error) errors.business_email = email.error;
  else out.business_email = email.value;

  const hours = clean(input.operating_hours);
  if (hours.length > LIMITS.hours) errors.operating_hours = `Keep it under ${LIMITS.hours} characters.`;
  else out.operating_hours = hours || null;

  if (input.contact_preference && !CONTACT_PREFERENCES[input.contact_preference]) {
    errors.contact_preference = "Choose Call, WhatsApp or both.";
  } else out.contact_preference = input.contact_preference || null;

  out.show_phone_publicly = input.show_phone_publicly ? 1 : 0;
  if (out.show_phone_publicly && !out.contact_preference) {
    errors.contact_preference = "Choose how customers should contact you.";
  }

  return { errors, value: out };
}

export function validateAddress(input = {}) {
  const errors = {};
  const out = {};
  const line = clean(input.line);
  if (line.length < 5) errors["address.line"] = "Enter your shop / business address.";
  else if (line.length > LIMITS.address) errors["address.line"] = "Address is too long.";
  else out.address_line = line;

  const stateId = Number(input.state_id);
  if (!Number.isInteger(stateId) || stateId <= 0) errors["address.state_id"] = "Choose a state.";
  else out.address_state_id = stateId;

  const cityId = Number(input.city_id);
  if (!Number.isInteger(cityId) || cityId <= 0) errors["address.city_id"] = "Choose a city.";
  else out.address_city_id = cityId;

  const loc = clean(input.locality);
  if (loc.length > LIMITS.locality) errors["address.locality"] = "Locality is too long.";
  else out.address_locality = loc || null;

  const pin = validPincode(input.pincode);
  if (pin.error) errors["address.pincode"] = pin.error;
  else out.address_pincode = pin.value;

  return { errors, value: out };
}

/** Normalised key used to compare brand names ("Blue-Star" ≡ "blue star"). */
export const brandKey = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

export function cleanCustomBrand(v) {
  const s = clean(v);
  if (!s) return { value: null };
  if (s.length > LIMITS.customBrand || !/^[\p{L}\p{N} .&'+-]+$/u.test(s)) {
    return { error: "Enter a valid brand name." };
  }
  return { value: s };
}

export function idList(v, max = 200) {
  if (!Array.isArray(v)) return null;
  const out = [];
  for (const x of v) {
    const n = Number(x);
    if (!Number.isInteger(n) || n <= 0) return null;
    if (!out.includes(n)) out.push(n);
  }
  return out.length > max ? null : out;
}

export const partnerRef = (id) => `MSE-P${String(id).padStart(6, "0")}`;

export function slugify(s) {
  return String(s ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}
