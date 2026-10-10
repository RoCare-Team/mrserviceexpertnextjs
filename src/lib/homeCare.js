// Home care categories (no brands, no "repair") — shared by the footer, the
// city+category page and <ServicePage>, so the three always agree.
// `url` is category_tb.category_url.

export const HOME_CARE_SERVICES = [
  { name: "Kitchen Cleaning", url: "kitchen-cleaning-service" },
  { name: "Home Deep Cleaning", url: "home-deep-cleaning-service" },
  { name: "House Painting", url: "house-painting" },
  { name: "Bathroom Cleaning", url: "bathroom-cleaning-service" },
  { name: "Sofa Cleaning", url: "sofa-cleaning-service" },
  { name: "Tank Cleaning", url: "tank-cleaning" },
  { name: "Mason Service", url: "mason-service" },
  { name: "Pest Control", url: "pest-control" },
];

const HOME_CARE_URLS = new Set(HOME_CARE_SERVICES.map((s) => s.url));

// Home appliance categories (category_tb.category_url) — repair pages.
// Plumber / carpenter / electrician are neither, so they're in no list.
const HOME_APPLIANCE_URLS = new Set([
  "ro-water-purifier",
  "ac",
  "washing-machine-repair",
  "geyser-repair",
  "refrigerator-repair",
  "kitchen-chimney-repair",
  "microwav-repair",
  "vacuum-cleaner-repair",
  "air-purifier-repair",
  "led-tv-repair",
]);

export const isHomeAppliance = (categoryUrl) =>
  HOME_APPLIANCE_URLS.has(String(categoryUrl || "").toLowerCase().trim());

export const isHomeCare = (categoryUrl) =>
  HOME_CARE_URLS.has(String(categoryUrl || "").toLowerCase().trim());

/**
 * Fixed title / description for home appliance pages. `brand` is optional and
 * goes before the category ("Kent RO Water Purifier"). "AC Service" → "AC",
 * so the pattern never reads "Service Service".
 */
export function applianceMeta({ category, city, brand }) {
  const cat = String(category || "").replace(/\s*Service$/i, "").trim();
  const name = brand ? `${String(brand).trim()} ${cat}` : cat;
  return {
    title: `Get ${name} Service in ${city} from Expert Repair Technicians`,
    description: `${name} Repair Service in ${city} from Expert Technicians. Get reliable doorstep ${name} repair, servicing, and maintenance from verified professionals.`,
  };
}
