// scripts/near-me-copy.mjs
//
// The per-category wording now lives in src/lib/pageContent.js, because the
// admin "Add brand" screen builds the same pages and the two must never drift.
// This file re-exports it so existing commands keep working, and owns the one
// thing that is CLI-only: the near-me-only brand list.
//
//   node scripts/seed-near-me-pages.mjs --commit --force   # rewrite pages
//   node scripts/seed-near-me-pages.mjs --sample ac        # preview one page

export { CATEGORY_COPY, PHONE } from "../src/lib/pageContent.js";

// Brands that must appear ONLY on /near-me and on no other city.
//
// No "scope" flag is needed to achieve that: both "Popular Brands" lists are
// existence-gated (src/lib/cityCategoryPageData.js and src/lib/brandPageData.js
// only list a brand that HAS a page_master_tb row for the city being viewed).
// So a brand whose only page row is the near-me one is automatically invisible
// everywhere else, and no link anywhere points at a URL that would 404.
//
// Add entries here and run:  node scripts/seed-near-me-pages.mjs --commit
// The seeder creates the brand_tb row if it is missing, then creates exactly
// one page_master_tb row (near-me). It never creates rows for other cities.
//
//   brand_name   : display name, e.g. "Bluestar"
//   brand_url    : slug, [a-z0-9-] only
//   category_url : must be a key of CATEGORY_COPY above

export const NEAR_ME_ONLY_BRANDS = [
  { brand_name: "AO Smith", brand_url: "ao-smith", category_url: "ro-water-purifier" },
  { brand_name: "Blue Star", brand_url: "blue-star", category_url: "ro-water-purifier" },
  { brand_name: "Havells", brand_url: "havells", category_url: "ro-water-purifier" },
  { brand_name: "Whirlpool", brand_url: "whirlpool", category_url: "ro-water-purifier" },
  { brand_name: "Tata Swach", brand_url: "tata-swach", category_url: "ro-water-purifier" },
  { brand_name: "Aquaguard", brand_url: "aquaguard", category_url: "ro-water-purifier" },
  { brand_name: "Aquagrand", brand_url: "aquagrand", category_url: "ro-water-purifier" },
  { brand_name: "V-Guard", brand_url: "v-guard", category_url: "ro-water-purifier" },
  { brand_name: "LG", brand_url: "lg", category_url: "ro-water-purifier" },
  { brand_name: "Bosch", brand_url: "bosch", category_url: "washing-machine-repair" },
  { brand_name: "Haier", brand_url: "haier", category_url: "washing-machine-repair" },
  { brand_name: "Panasonic", brand_url: "panasonic", category_url: "washing-machine-repair" },
  { brand_name: "Voltas", brand_url: "voltas", category_url: "washing-machine-repair" },
  { brand_name: "Realme", brand_url: "realme", category_url: "washing-machine-repair" },
  { brand_name: "Haier", brand_url: "haier", category_url: "refrigerator-repair" },
  { brand_name: "Bosch", brand_url: "bosch", category_url: "refrigerator-repair" },
  { brand_name: "Panasonic", brand_url: "panasonic", category_url: "refrigerator-repair" },
  { brand_name: "Hitachi", brand_url: "hitachi", category_url: "refrigerator-repair" },
  { brand_name: "Videocon", brand_url: "videocon", category_url: "refrigerator-repair" },
  { brand_name: "Voltas", brand_url: "voltas", category_url: "refrigerator-repair" },
  { brand_name: "Blue Star", brand_url: "blue-star", category_url: "refrigerator-repair" },
  { brand_name: "Sharp", brand_url: "sharp", category_url: "refrigerator-repair" },
  { brand_name: "AO Smith", brand_url: "ao-smith", category_url: "geyser-repair" },
  { brand_name: "Havells", brand_url: "havells", category_url: "geyser-repair" },
  { brand_name: "V-Guard", brand_url: "v-guard", category_url: "geyser-repair" },
  { brand_name: "Orient", brand_url: "orient", category_url: "geyser-repair" },
  { brand_name: "Venus", brand_url: "venus", category_url: "geyser-repair" },
  { brand_name: "Hindware", brand_url: "hindware", category_url: "geyser-repair" },
  { brand_name: "Usha", brand_url: "usha", category_url: "geyser-repair" },
  { brand_name: "Kenstar", brand_url: "kenstar", category_url: "geyser-repair" },
  { brand_name: "Jaquar", brand_url: "jaquar", category_url: "geyser-repair" },
  { brand_name: "Symphony", brand_url: "symphony", category_url: "geyser-repair" },
  { brand_name: "Morphy Richards", brand_url: "morphy-richards", category_url: "geyser-repair" },
  { brand_name: "Activa", brand_url: "activa", category_url: "geyser-repair" },
  { brand_name: "IFB", brand_url: "ifb", category_url: "microwav-repair" },
  { brand_name: "Bajaj", brand_url: "bajaj", category_url: "microwav-repair" },
  { brand_name: "Godrej", brand_url: "godrej", category_url: "microwav-repair" },
  { brand_name: "Haier", brand_url: "haier", category_url: "microwav-repair" },
  { brand_name: "Morphy Richards", brand_url: "morphy-richards", category_url: "microwav-repair" },
  { brand_name: "Bosch", brand_url: "bosch", category_url: "microwav-repair" },
  { brand_name: "Sharp", brand_url: "sharp", category_url: "microwav-repair" },
  { brand_name: "Electrolux", brand_url: "electrolux", category_url: "microwav-repair" },
  { brand_name: "Solo", brand_url: "solo", category_url: "microwav-repair" },
  { brand_name: "Agaro", brand_url: "agaro", category_url: "microwav-repair" },
  { brand_name: "Wonderchef", brand_url: "wonderchef", category_url: "microwav-repair" },
  { brand_name: "Samsung", brand_url: "samsung", category_url: "led-tv-repair" },
  { brand_name: "LG", brand_url: "lg", category_url: "led-tv-repair" },
  { brand_name: "Sony", brand_url: "sony", category_url: "led-tv-repair" },
  { brand_name: "OnePlus", brand_url: "oneplus", category_url: "led-tv-repair" },
  { brand_name: "Mi", brand_url: "mi", category_url: "led-tv-repair" },
  { brand_name: "TCL", brand_url: "tcl", category_url: "led-tv-repair" },
  { brand_name: "Hisense", brand_url: "hisense", category_url: "led-tv-repair" },
  { brand_name: "Vu", brand_url: "vu", category_url: "led-tv-repair" },
  { brand_name: "Realme", brand_url: "realme", category_url: "led-tv-repair" },
  { brand_name: "Motorola", brand_url: "motorola", category_url: "led-tv-repair" },
  { brand_name: "Haier", brand_url: "haier", category_url: "led-tv-repair" },
  { brand_name: "Panasonic", brand_url: "panasonic", category_url: "led-tv-repair" },
  { brand_name: "Toshiba", brand_url: "toshiba", category_url: "led-tv-repair" },
  { brand_name: "Philips", brand_url: "philips", category_url: "led-tv-repair" },
  { brand_name: "Kodak", brand_url: "kodak", category_url: "led-tv-repair" },
  { brand_name: "Elica", brand_url: "elica", category_url: "kitchen-chimney-repair" },
  { brand_name: "Hindware", brand_url: "hindware", category_url: "kitchen-chimney-repair" },
  { brand_name: "Glen", brand_url: "glen", category_url: "kitchen-chimney-repair" },
  { brand_name: "Inalsa", brand_url: "inalsa", category_url: "kitchen-chimney-repair" },
  { brand_name: "Carysil", brand_url: "carysil", category_url: "kitchen-chimney-repair" },
  { brand_name: "Blowhot", brand_url: "blowhot", category_url: "kitchen-chimney-repair" },
  { brand_name: "Sunflame", brand_url: "sunflame", category_url: "kitchen-chimney-repair" },
  { brand_name: "Prestige", brand_url: "prestige", category_url: "kitchen-chimney-repair" },
  { brand_name: "Bosch", brand_url: "bosch", category_url: "kitchen-chimney-repair" },
  { brand_name: "Hafele", brand_url: "hafele", category_url: "kitchen-chimney-repair" },
  { brand_name: "Pigeon", brand_url: "pigeon", category_url: "kitchen-chimney-repair" },
  { brand_name: "Aresto", brand_url: "aresto", category_url: "kitchen-chimney-repair" },
  { brand_name: "Eurodomo", brand_url: "eurodomo", category_url: "kitchen-chimney-repair" },
  { brand_name: "Philips", brand_url: "philips", category_url: "air-purifier-repair" },
  { brand_name: "Honeywell", brand_url: "honeywell", category_url: "air-purifier-repair" },
  { brand_name: "Mi", brand_url: "mi", category_url: "air-purifier-repair" },
  { brand_name: "Coway", brand_url: "coway", category_url: "air-purifier-repair" },
  { brand_name: "Sharp", brand_url: "sharp", category_url: "air-purifier-repair" },
  { brand_name: "Dyson", brand_url: "dyson", category_url: "air-purifier-repair" },
  { brand_name: "Blueair", brand_url: "blueair", category_url: "air-purifier-repair" },
  { brand_name: "Samsung", brand_url: "samsung", category_url: "air-purifier-repair" },
  { brand_name: "LG", brand_url: "lg", category_url: "air-purifier-repair" },
  { brand_name: "Panasonic", brand_url: "panasonic", category_url: "air-purifier-repair" },
  { brand_name: "Daikin", brand_url: "daikin", category_url: "air-purifier-repair" },
  { brand_name: "Kent", brand_url: "kent", category_url: "air-purifier-repair" },
  { brand_name: "Dyson", brand_url: "dyson", category_url: "vacuum-cleaner-repair" },
  { brand_name: "Karcher", brand_url: "karcher", category_url: "vacuum-cleaner-repair" },
  { brand_name: "Philips", brand_url: "philips", category_url: "vacuum-cleaner-repair" },
  { brand_name: "Agaro", brand_url: "agaro", category_url: "vacuum-cleaner-repair" },
  { brand_name: "Inalsa", brand_url: "inalsa", category_url: "vacuum-cleaner-repair" },
  { brand_name: "Dreame", brand_url: "dreame", category_url: "vacuum-cleaner-repair" },
  { brand_name: "Ecovacs", brand_url: "ecovacs", category_url: "vacuum-cleaner-repair" },
  { brand_name: "Ilife", brand_url: "ilife", category_url: "vacuum-cleaner-repair" },
  { brand_name: "Mi", brand_url: "mi", category_url: "vacuum-cleaner-repair" },
  { brand_name: "Black+Decker", brand_url: "black-decker", category_url: "vacuum-cleaner-repair" },
  { brand_name: "Bosch", brand_url: "bosch", category_url: "vacuum-cleaner-repair" },
  { brand_name: "Electrolux", brand_url: "electrolux", category_url: "vacuum-cleaner-repair" },
  { brand_name: "Vorwerk", brand_url: "vorwerk", category_url: "vacuum-cleaner-repair" },
  { brand_name: "Shark", brand_url: "shark", category_url: "vacuum-cleaner-repair" },
];
