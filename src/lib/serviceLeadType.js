// category_url → CRM lead_type for the public service list (/api/services).
// Appliance ids match CRM_LEAD_TYPES in lib/partners/crmMap.js; the home care
// and handyman ids are only used here.
const LEAD_TYPES = {
  "ro-water-purifier": 1,
  ac: 2,
  "washing-machine-repair": 4,
  "geyser-repair": 5,
  "refrigerator-repair": 6,
  "led-tv-repair": 8,
  "microwav-repair": 9,
  "kitchen-chimney-repair": 10,
  "vacuum-cleaner-repair": 11,
  "air-purifier-repair": 18,
  "sofa-cleaning-service": 29,
  "bathroom-cleaning-service": 30,
  "home-deep-cleaning-service": 31,
  "kitchen-cleaning-service": 32,
  "pest-control": 33,
  "tank-cleaning": 34,
  "house-painting": 35,
  plumber: 36,
  carpenter: 37,
  electrician: 38,
  "mason-service": 39,
};

/** First slug among the candidates that maps to a lead type, else null. */
export function leadTypeFor(...slugs) {
  for (const s of slugs) {
    const k = String(s || "").toLowerCase();
    if (LEAD_TYPES[k]) return LEAD_TYPES[k];
  }
  return null;
}
