// Free plan vs Featured Partner badge. Pure — used by the wizard (browser)
// and the server.
//
//   Free:     1 city, 2 categories, 2 brands per category
//   Featured: no limits (₹499 / 1 year). Without an active badge the extras
//             stay saved but are hidden from listings and leads.

export const FREE_LIMITS = { cities: 1, categories: 2, brandsPerCategory: 2 };

/**
 * cities: number of distinct cities, categories: number, brands: { [catId]: count }.
 * Returns the list of reasons the selection needs the badge (empty = free plan is enough).
 */
export function overLimits({ cities = 0, categories = 0, brands = {} }, names = {}) {
  const out = [];
  if (cities > FREE_LIMITS.cities) out.push(`${cities} cities (free plan: ${FREE_LIMITS.cities})`);
  if (categories > FREE_LIMITS.categories) out.push(`${categories} categories (free plan: ${FREE_LIMITS.categories})`);
  for (const [catId, n] of Object.entries(brands)) {
    if (n > FREE_LIMITS.brandsPerCategory) out.push(`${n} brands in ${names[catId] || "a category"} (free plan: ${FREE_LIMITS.brandsPerCategory})`);
  }
  return out;
}

/** Same check for a full application object (getApplication shape). */
export function appOverLimits(app) {
  const brands = {};
  const names = {};
  for (const c of app.categories || []) {
    brands[c.id] = (app.brands?.[c.id] || []).length;
    names[c.id] = c.name;
  }
  return overLimits({ cities: new Set((app.areas || []).map((a) => a.city_id)).size, categories: (app.categories || []).length, brands }, names);
}
