// lib/services.js
//
// Service cards come from the remote all_services.php feed (one call per
// lead_type). The feed stays the source of truth for WHICH services exist and
// their PRICES; everything a visitor reads — title, description, image — and
// the display order can be overridden from /admin/services.
//
// Overrides live in `service_overrides`, keyed by the feed's service id, and
// apply on every city / brand page. An empty override field falls back to the
// feed's value, so a service nobody has touched looks exactly as before.

import db from "@/lib/db";
import { filterHiddenServices } from "@/lib/hiddenServices";

export const SERVICES_API =
  "https://waterpurifierservicecenter.in/customer/ro_customer/all_services.php";

// Same lead_type codes the service pages send (see ServicesList.jsx).
export const LEAD_TYPES = [
  { id: 1, name: "RO Water Purifier" },
  { id: 2, name: "Air Conditioner" },
  { id: 4, name: "Washing Machine" },
  { id: 5, name: "Geyser" },
  { id: 6, name: "Refrigerator" },
  { id: 8, name: "LED TV" },
  { id: 9, name: "Microwave" },
  { id: 10, name: "Kitchen Chimney" },
  { id: 11, name: "Vacuum Cleaner" },
  { id: 18, name: "Air Purifier" },
  { id: 29, name: "Sofa Cleaning" },
  { id: 30, name: "Bathroom Cleaning" },
  { id: 31, name: "Home Deep Cleaning" },
  { id: 32, name: "Kitchen Cleaning" },
  { id: 33, name: "Pest Control" },
  { id: 34, name: "Tank Cleaning" },
  { id: 35, name: "House Painting" },
  { id: 39, name: "Mason Service" },
];

/** Raw feed call. Returns the feed's JSON ({ error, Title, service_details, … }). */
export async function fetchRemoteServices({ cid = null, lead_type }) {
  const res = await fetch(SERVICES_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cid, lead_type }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Services API HTTP ${res.status}`);
  return res.json();
}

export async function ensureServiceOverridesTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS service_overrides (
      service_id  VARCHAR(32)  NOT NULL PRIMARY KEY,
      lead_type   INT          NULL,
      title       VARCHAR(255) NULL,
      description MEDIUMTEXT   NULL,
      image       VARCHAR(500) NULL,
      sort_order  INT          NULL,
      updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                        ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_service_overrides_lead (lead_type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
}

/** Map service_id → override row, for the given feed ids. */
export async function getOverrides(ids) {
  const list = [...new Set(ids.map(String))];
  if (!list.length) return new Map();
  const [rows] = await db.query(
    `SELECT service_id, title, description, image, sort_order
       FROM service_overrides WHERE service_id IN (?)`,
    [list]
  );
  return new Map(rows.map((r) => [String(r.service_id), r]));
}

const filled = (v) => typeof v === "string" && v.trim() !== "";

/**
 * Apply overrides to feed services: replace title/description/image where the
 * admin filled them, then order by sort_order (unset ones keep feed order,
 * after the ordered ones). Price fields are never touched.
 */
export function applyOverrides(services, overrides) {
  return services
    .map((s, index) => {
      const o = overrides.get(String(s.id));
      return {
        ...s,
        service_name: filled(o?.title) ? o.title.trim() : s.service_name,
        description: filled(o?.description) ? o.description : s.description,
        image: filled(o?.image) ? o.image.trim() : s.image,
        _order: o?.sort_order ?? null,
        _index: index,
      };
    })
    .sort((a, b) => {
      const ao = a._order ?? Infinity;
      const bo = b._order ?? Infinity;
      return ao === bo ? a._index - b._index : ao - bo;
    })
    .map(({ _order, _index, ...s }) => s);
}

/**
 * Feed + overrides for one lead_type, in the feed's response shape so the
 * site components can read it unchanged. A DB failure serves the plain feed.
 */
export async function getServicesForSite({ cid = null, lead_type }) {
  const data = await fetchRemoteServices({ cid, lead_type });
  if (data?.error !== "false" || !Array.isArray(data.service_details)) return data;

  const services = filterHiddenServices(data.service_details);
  try {
    const overrides = await getOverrides(services.map((s) => s.id));
    return { ...data, service_details: applyOverrides(services, overrides) };
  } catch (e) {
    // Table not created yet (no admin edit so far) or a DB blip.
    if (e?.code !== "ER_NO_SUCH_TABLE") {
      console.error("service overrides failed:", e?.message || e);
    }
    return { ...data, service_details: services };
  }
}
