// Admin console access control — which sections ("modules") an admin may
// open. Pure functions only, so the same rules run in the proxy, the API
// routes and the sidebar.
//
//   super_admin              → everything
//   admin, modules = null    → everything (accounts created before access control)
//   admin, modules = [...]   → only those modules
//
// The session token carries `modules`; /api/admin/auth/me refreshes it from
// the database, so a super admin's change applies on the admin's next page load.

export const MODULES = {
  leads: { label: "Contact leads", home: "/admin/contact_us" },
  partners: { label: "Partners", home: "/admin/partners" },
  careers: { label: "Careers", home: "/admin/careers" },
  catalogue: { label: "Catalogue (dashboard, brands, categories, cities, pages, services)", home: "/admin" },
  content: { label: "Blogs & homepage cities", home: "/admin/blogs" },
  ai: { label: "AI content", home: "/admin/ai_content" },
  redirects: { label: "Redirects", home: "/admin/redirects" },
};
export const MODULE_KEYS = Object.keys(MODULES);

/** Team label → modules ticked by default (super admin can change them per user). */
export const TEAMS = {
  hr: { label: "HR", modules: ["careers"] },
  sales: { label: "Sales", modules: ["leads", "partners"] },
  seo: { label: "SEO", modules: ["catalogue", "content", "ai", "redirects"] },
  other: { label: "Other", modules: [] },
};

const OPEN = null; // any signed-in admin
const SUPER = "__super";
const FULL = "__full"; // unknown section → only unrestricted admins

const PAGE_MODULES = {
  login: OPEN,
  admins: SUPER,
  contact_us: "leads",
  partners: "partners",
  careers: "careers",
  brand_edits: "catalogue",
  brand_rollout: "catalogue",
  category_edits: "catalogue",
  services: "catalogue",
  city_edits: "catalogue",
  store_locator: "catalogue",
  city_category: "catalogue",
  create_brands: "catalogue",
  create_category: "catalogue",
  create_city: "catalogue",
  create_page: "catalogue",
  blogs: "content",
  "blog-categories": "content",
  other_cities: "content",
  ai_content: "ai",
  redirects: "redirects",
};

const API_MODULES = {
  auth: OPEN,
  users: OPEN, // the route itself requires super_admin
  "s3-upload-url": OPEN, // shared image upload (blogs, catalogue…)
  contact_us: "leads",
  partners: "partners",
  careers: "careers",
  brand_rollout: "catalogue",
  create_brand: "catalogue",
  create_category: "catalogue",
  create_city: "catalogue",
  edit_brand: "catalogue",
  edit_category: "catalogue",
  edit_city: "catalogue",
  edit_page: "catalogue",
  services: "catalogue",
  store_locator: "catalogue",
  create_page: ["catalogue", "content"], // city search is also used by Homepage Cities
  blogs: "content",
  blog_category: "content",
  other_cities: "content",
  ai_content: "ai",
};

/** "careers,partners" (DB) → ["careers","partners"]; null/undefined → null (= all). */
export function parseModules(value) {
  if (value === null || value === undefined) return null;
  const list = Array.isArray(value) ? value : String(value).split(",");
  return [...new Set(list.map((m) => String(m).trim()).filter((m) => MODULES[m]))];
}

export const isUnrestricted = (session) =>
  !!session && (session.role === "super_admin" || !Array.isArray(session.modules));

/** Modules this session may open. */
export function sessionModules(session) {
  if (!session) return [];
  if (isUnrestricted(session)) return MODULE_KEYS;
  return parseModules(session.modules) || [];
}

export function canAccess(session, mod) {
  if (!session) return false;
  if (mod === OPEN) return true;
  if (mod === SUPER) return session.role === "super_admin";
  if (mod === FULL) return isUnrestricted(session);
  const mine = sessionModules(session);
  return (Array.isArray(mod) ? mod : [mod]).some((m) => mine.includes(m));
}

/** Module for an /admin/... page path. "/admin" itself is the catalogue dashboard. */
export function pageModule(pathname) {
  const seg = pathname.replace(/^\/admin\/?/, "").split("/")[0];
  if (!seg) return "catalogue";
  return seg in PAGE_MODULES ? PAGE_MODULES[seg] : FULL;
}

/** Module for an /api/admin/... path. */
export function apiModule(pathname) {
  const seg = pathname.replace(/^\/api\/admin\/?/, "").split("/")[0];
  return seg in API_MODULES ? API_MODULES[seg] : FULL;
}

/** Where to send an admin who opened a page they can't see (null = nowhere). */
export function homeFor(session) {
  const first = sessionModules(session)[0];
  return first ? MODULES[first].home : null;
}
