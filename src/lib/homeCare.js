// Service groups that aren't appliance repair: Home Care and Handyman. They
// have no brands and no "repair" wording, and their pages link to the other
// services of the same group. Shared by the footer, the home/city page icon
// sections, the city+category page and <ServicePage>, so they always agree.
// `url` is category_tb.category_url. `image: null` = no icon yet (the section
// shows a placeholder).

export const HOME_CARE_SERVICES = [
  { name: "Kitchen Cleaning", url: "kitchen-cleaning-service", image: "/assets/HomeCare/KITCHEN-CLEANING.webp" },
  { name: "Home Deep Cleaning", url: "home-deep-cleaning-service", image: "/assets/HomeCare/HOME-DEEP-CLEANING.webp" },
  { name: "Bathroom Cleaning", url: "bathroom-cleaning-service", image: "/assets/HomeCare/BATHROOM-CLEANING.webp" },
  { name: "Sofa Cleaning", url: "sofa-cleaning-service", image: "/assets/HomeCare/SOFA-CLEANING.webp" },
  { name: "Tank Cleaning", url: "tank-cleaning", image: "/assets/HomeCare/TANK-CLEANING.webp" },
  { name: "Pest Control", url: "pest-control", image: "/assets/HomeCare/PEST-CONTROL.webp" },
];

export const HANDYMAN_SERVICES = [
  { name: "Plumber", url: "plumber", image: "/assets/images/plumber1.webp" },
  { name: "Electrician", url: "electrician", image: "/assets/images/electrician.webp" },
  { name: "Carpenter", url: "carpenter", image: "/carpenter.webp" },
  { name: "House Painting", url: "house-painting", image: "/assets/HomeCare/PAINTER.webp" },
  { name: "Mason Service", url: "mason-service", image: "/assets/HomeCare/masons.webp" },
];

const key = (categoryUrl) => String(categoryUrl || "").toLowerCase().trim();

// Home appliance categories (category_tb.category_url) — repair pages.
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

export const isHomeAppliance = (categoryUrl) => HOME_APPLIANCE_URLS.has(key(categoryUrl));

/** The Home Care / Handyman list a category belongs to, or null (appliance etc.). */
export function serviceGroupFor(categoryUrl) {
  const k = key(categoryUrl);
  if (HOME_CARE_SERVICES.some((s) => s.url === k)) return HOME_CARE_SERVICES;
  if (HANDYMAN_SERVICES.some((s) => s.url === k)) return HANDYMAN_SERVICES;
  return null;
}

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
