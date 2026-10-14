// Partner application repository: reading the full application, saving the
// wizard step by step (with optimistic concurrency), submitting, and the
// status machine shared by partner and admin actions.

import db from "@/lib/db";
import { HttpError } from "@/lib/partners/http";
import { publicUrl } from "@/lib/partners/storage";
import {
  validName,
  validateBusiness,
  validateAddress,
  cleanCustomBrand,
  brandKey,
  idList,
  partnerRef,
  slugify,
  STATUS_LABELS,
  CONSENT_VERSION,
  LIMITS,
} from "@/lib/partners/validation";

/** Statuses in which the partner may change their application. */
export const EDITABLE = new Set(["draft", "rejected", "info_requested"]);

/* ── transactions + audit ─────────────────────────────────────────────── */

export async function withTransaction(fn) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const out = await fn(conn);
    await conn.commit();
    return out;
  } catch (err) {
    try {
      await conn.rollback();
    } catch {}
    throw err;
  } finally {
    conn.release();
  }
}

export async function logHistory(conn, { partnerId, action, from = null, to = null, reason = null, actorType, actorId = null }) {
  await conn.query(
    `INSERT INTO partner_status_history (partner_id, action, from_status, to_status, reason, actor_type, actor_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [partnerId, action, from, to, reason, actorType, actorId]
  );
}

async function lockPartner(conn, partnerId) {
  const [rows] = await conn.query("SELECT * FROM partners WHERE id = ? AND deleted_at IS NULL FOR UPDATE", [partnerId]);
  if (!rows.length) throw new HttpError(404, "not_found", "Application not found.");
  return rows[0];
}

/* ── sign-in ──────────────────────────────────────────────────────────── */

/**
 * Called only after the OTP provider confirmed the code. Creates the draft
 * on first sign-in; an existing partner just gets signed back in (resume).
 */
export async function findOrCreateByVerifiedMobile(mobile, fullName) {
  return withTransaction(async (conn) => {
    const [rows] = await conn.query("SELECT * FROM partners WHERE mobile = ? FOR UPDATE", [mobile]);
    if (rows.length) {
      const p = rows[0];
      if (p.deleted_at) throw new HttpError(403, "account_closed", "This partner account is closed. Please contact support.");
      await conn.query(
        `UPDATE partners SET last_login_at = NOW(), mobile_verified_at = COALESCE(mobile_verified_at, NOW()),
                full_name = IF(full_name = '' AND ? <> '', ?, full_name)
          WHERE id = ?`,
        [fullName || "", fullName || "", p.id]
      );
      return { id: p.id, created: false };
    }
    // Signing in from /partner/login with a new number has no name yet —
    // the wizard's step 1 asks for it.
    const [ins] = await conn.query(
      `INSERT INTO partners (mobile, full_name, mobile_verified_at, last_login_at, current_step)
       VALUES (?, ?, NOW(), NOW(), ?)`,
      [mobile, fullName || "", fullName ? 2 : 1]
    );
    await logHistory(conn, { partnerId: ins.insertId, action: "registered", to: "draft", actorType: "partner", actorId: ins.insertId });
    return { id: ins.insertId, created: true };
  });
}

/* ── read ─────────────────────────────────────────────────────────────── */

export async function getApplication(partnerId, { forAdmin = false } = {}) {
  const [[p]] = await db.query(
    `SELECT p.*, s.name AS state_name, c.city_name AS address_city_name
       FROM partners p
       LEFT JOIN states s ON s.id = p.address_state_id
       LEFT JOIN city_tb c ON c.id = p.address_city_id
      WHERE p.id = ? AND p.deleted_at IS NULL`,
    [partnerId]
  );
  if (!p) return null;

  const [[cats], [svcs], [brands], [areas], [reqs], [docs]] = await Promise.all([
    db.query(
      `SELECT c.id, c.category_name AS name, c.category_url AS url
         FROM partner_categories pc JOIN category_tb c ON c.id = pc.category_id
        WHERE pc.partner_id = ? ORDER BY c.id`,
      [partnerId]
    ),
    db.query(
      `SELECT ps.category_id, t.id, t.name
         FROM partner_services ps JOIN partner_service_types t ON t.id = ps.service_type_id
        WHERE ps.partner_id = ? ORDER BY t.sort_order, t.name`,
      [partnerId]
    ),
    db.query(
      `SELECT pb.id, pb.category_id, pb.brand_id, COALESCE(b.brand_name, pb.custom_name) AS name,
              pb.custom_name IS NOT NULL AS custom, pb.custom_status
         FROM partner_brands pb LEFT JOIN brand_tb b ON b.id = pb.brand_id
        WHERE pb.partner_id = ? ORDER BY name`,
      [partnerId]
    ),
    db.query(
      `SELECT a.id, a.city_id, c.city_name, c.city_url, a.locality_id, l.city_name AS locality_name,
              l.city_url AS locality_url, a.is_primary
         FROM partner_service_areas a
         JOIN city_tb c ON c.id = a.city_id
         LEFT JOIN city_tb l ON l.id = a.locality_id
        WHERE a.partner_id = ? ORDER BY a.is_primary DESC, c.city_name, l.city_name`,
      [partnerId]
    ),
    db.query(
      `SELECT r.id, r.city_id, c.city_name, r.requested_name, r.status
         FROM partner_location_requests r JOIN city_tb c ON c.id = r.city_id
        WHERE r.partner_id = ? ORDER BY r.id`,
      [partnerId]
    ),
    db.query(
      `SELECT id, doc_type, original_name, mime_type, size_bytes, review_status, review_note, created_at
         FROM partner_documents WHERE partner_id = ? AND deleted_at IS NULL ORDER BY id`,
      [partnerId]
    ),
  ]);

  const services = {};
  for (const s of svcs) (services[s.category_id] ||= []).push({ id: s.id, name: s.name });
  const brandMap = {};
  for (const b of brands)
    (brandMap[b.category_id] ||= []).push({
      id: b.id,
      brand_id: b.brand_id,
      name: b.name,
      custom: !!b.custom,
      custom_status: b.custom_status,
    });

  const app = {
    id: p.id,
    ref: partnerRef(p.id),
    status: p.status,
    status_label: STATUS_LABELS[p.status],
    version: p.version,
    current_step: p.current_step,
    full_name: p.full_name,
    mobile: p.mobile,
    mobile_verified: !!p.mobile_verified_at,
    is_listed: !!p.is_listed,
    slug: p.slug,
    business: {
      business_type: p.business_type,
      business_name: p.business_name,
      description: p.description,
      experience_years: p.experience_years,
      gstin: p.gstin,
      business_email: p.business_email,
      operating_hours: p.operating_hours,
      contact_preference: p.contact_preference,
      show_phone_publicly: !!p.show_phone_publicly,
    },
    logo_url: publicUrl(p.logo_key),
    shop_image_url: publicUrl(p.shop_image_key),
    address: {
      line: p.address_line,
      state_id: p.address_state_id,
      state_name: p.state_name,
      city_id: p.address_city_id,
      city_name: p.address_city_name,
      locality: p.address_locality,
      pincode: p.address_pincode,
    },
    categories: cats,
    services,
    brands: brandMap,
    areas: areas.map((a) => ({ ...a, is_primary: !!a.is_primary })),
    location_requests: reqs,
    documents: docs,
    verification: {
      mobile: !!p.mobile_verified_at,
      identity: !!p.identity_verified_at,
      business: !!p.business_verified_at,
      gst: !!p.gst_verified_at,
    },
    review_reason: p.review_reason,
    submitted_at: p.submitted_at,
    approved_at: p.approved_at,
    reviewed_at: p.reviewed_at,
    created_at: p.created_at,
    updated_at: p.updated_at,
  };
  app.completion = completion(app);

  if (forAdmin) {
    app.admin_note = p.admin_note;
    const [history] = await db.query(
      `SELECT h.id, h.action, h.from_status, h.to_status, h.reason, h.actor_type, h.actor_id, h.created_at,
              u.name AS admin_name
         FROM partner_status_history h
         LEFT JOIN admin_users u ON h.actor_type = 'admin' AND u.id = h.actor_id
        WHERE h.partner_id = ? ORDER BY h.id DESC`,
      [partnerId]
    );
    app.history = history;
    const [consents] = await db.query(
      "SELECT consent_type, version, accepted_at FROM partner_consents WHERE partner_id = ? ORDER BY id DESC",
      [partnerId]
    );
    app.consents = consents;
  }
  return app;
}

/** Which wizard steps are complete, and what's missing. */
export function completion(app) {
  const missing = {};
  if (!app.full_name || !app.mobile_verified) missing[1] = "Verify your name and mobile number.";
  if (!app.categories.length) missing[2] = "Select at least one category.";
  const noSvc = app.categories.filter((c) => !app.services[c.id]?.length);
  if (app.categories.length && noSvc.length) missing[3] = `Select services for: ${noSvc.map((c) => c.name).join(", ")}.`;
  const noBrand = app.categories.filter((c) => !app.brands[c.id]?.length);
  if (app.categories.length && noBrand.length) missing[4] = `Select brands for: ${noBrand.map((c) => c.name).join(", ")}.`;
  if (!app.business.business_type || !app.business.business_name) missing[5] = "Add your business type and name.";
  const a = app.address;
  if (!a.line || !a.state_id || !a.city_id || !a.pincode) missing[6] = "Complete your business address.";
  else if (!app.areas.length) missing[6] = "Add at least one service area.";
  const done = 6 - Object.keys(missing).length;
  return { missing, percent: Math.round((done / 6) * 100), ready: done === 6 };
}

/* ── wizard saves ─────────────────────────────────────────────────────── */

const bad = (message, fields) => new HttpError(422, "validation_error", message, fields);

/**
 * Save one wizard step. `version` must match the stored version (409 on a
 * concurrent edit from another tab/device).
 */
export async function saveStep(partnerId, step, data, version) {
  return withTransaction(async (conn) => {
    const p = await lockPartner(conn, partnerId);
    if (!EDITABLE.has(p.status)) {
      throw new HttpError(409, "not_editable", "Your application can't be edited in its current status.");
    }
    if (Number(version) !== p.version) {
      throw new HttpError(409, "version_conflict", "This application was changed in another window. Reload to get the latest version.");
    }

    const savers = { 1: saveBasic, 2: saveCategories, 3: saveServices, 4: saveBrands, 5: saveBusiness, 6: saveLocations };
    const saver = savers[step];
    if (!saver) throw new HttpError(400, "bad_step", "Unknown step.");
    await saver(conn, p, data || {});

    await conn.query(
      "UPDATE partners SET version = version + 1, current_step = GREATEST(current_step, ?) WHERE id = ?",
      [Math.min(step + 1, 7), partnerId]
    );
  });
}

async function saveBasic(conn, p, data) {
  const name = validName(data.full_name);
  if (name.error) throw bad(name.error, { full_name: name.error });
  await conn.query("UPDATE partners SET full_name = ? WHERE id = ?", [name.value, p.id]);
}

async function saveCategories(conn, p, data) {
  const ids = idList(data.category_ids, LIMITS.maxCategories);
  if (!ids || !ids.length) throw bad("Select at least one category.", { category_ids: "Select at least one category." });
  const [valid] = await conn.query(
    `SELECT c.id FROM category_tb c
      WHERE c.id IN (?) AND c.status = '1'
        AND EXISTS (SELECT 1 FROM partner_service_types s WHERE s.category_id = c.id AND s.status = 1)`,
    [ids]
  );
  if (valid.length !== ids.length) throw bad("One or more categories are not available.");
  // Removing a category cascades to its services and brands (composite FK).
  await conn.query("DELETE FROM partner_categories WHERE partner_id = ? AND category_id NOT IN (?)", [p.id, ids]);
  await conn.query("INSERT IGNORE INTO partner_categories (partner_id, category_id) VALUES ?", [ids.map((id) => [p.id, id])]);
}

async function selectedCategoryIds(conn, partnerId) {
  const [rows] = await conn.query("SELECT category_id FROM partner_categories WHERE partner_id = ?", [partnerId]);
  if (!rows.length) throw bad("Select your categories first.");
  return new Set(rows.map((r) => r.category_id));
}

async function saveServices(conn, p, data) {
  const map = data.services;
  if (!map || typeof map !== "object") throw bad("Select services for each category.");
  const selected = await selectedCategoryIds(conn, p.id);
  const rows = [];
  const fields = {};
  for (const catId of selected) {
    const ids = idList(map[catId] ?? map[String(catId)], 100);
    if (!ids || !ids.length) {
      fields[`services.${catId}`] = "Select at least one service.";
      continue;
    }
    ids.forEach((id) => rows.push([p.id, id, catId]));
  }
  for (const key of Object.keys(map)) {
    if (!selected.has(Number(key))) throw bad("Services were sent for a category you haven't selected.");
  }
  if (Object.keys(fields).length) throw bad("Select at least one service for every category.", fields);

  // Every service must belong to the category it was submitted under.
  const [valid] = await conn.query(
    `SELECT id, category_id FROM partner_service_types WHERE status = 1 AND id IN (?)`,
    [rows.map((r) => r[1])]
  );
  const catOf = new Map(valid.map((v) => [v.id, v.category_id]));
  if (rows.some((r) => catOf.get(r[1]) !== r[2])) throw bad("A selected service doesn't belong to its category.");

  await conn.query("DELETE FROM partner_services WHERE partner_id = ?", [p.id]);
  await conn.query("INSERT INTO partner_services (partner_id, service_type_id, category_id) VALUES ?", [rows]);
}

async function saveBrands(conn, p, data) {
  const map = data.brands;
  if (!map || typeof map !== "object") throw bad("Select brands for each category.");
  const selected = await selectedCategoryIds(conn, p.id);
  for (const key of Object.keys(map)) {
    if (!selected.has(Number(key))) throw bad("Brands were sent for a category you haven't selected.");
  }

  const [catalogue] = await conn.query(
    "SELECT id, category_id, brand_name FROM brand_tb WHERE status = '1' AND category_id IN (?)",
    [[...selected]]
  );
  const rows = [];
  const fields = {};
  for (const catId of selected) {
    const entry = map[catId] ?? map[String(catId)] ?? {};
    const ids = idList(entry.brand_ids ?? [], LIMITS.maxBrandsPerCategory);
    if (!ids) throw bad("Invalid brand selection.");
    const inCat = catalogue.filter((b) => b.category_id === catId);
    const allowed = new Set(inCat.map((b) => b.id));
    if (ids.some((id) => !allowed.has(id))) throw bad("A selected brand doesn't belong to its category.");
    const chosen = new Set(ids);

    const other = cleanCustomBrand(entry.other);
    if (other.error) {
      fields[`brands.${catId}`] = other.error;
      continue;
    }
    let custom = null;
    if (other.value) {
      // "Other: blue-star" → the existing Blue Star row, not a duplicate.
      const match = inCat.find((b) => brandKey(b.brand_name) === brandKey(other.value));
      if (match) chosen.add(match.id);
      else custom = other.value;
    }
    if (!chosen.size && !custom) {
      fields[`brands.${catId}`] = "Select at least one brand (or enter one under Other).";
      continue;
    }
    for (const id of chosen) rows.push([p.id, catId, id, null, null]);
    if (custom) rows.push([p.id, catId, null, custom, "pending"]);
  }
  if (Object.keys(fields).length) throw bad("Select brands for every category.", fields);

  // Keep the review state of custom names that are re-submitted unchanged.
  const [prev] = await conn.query(
    "SELECT category_id, custom_name, custom_status FROM partner_brands WHERE partner_id = ? AND custom_name IS NOT NULL",
    [p.id]
  );
  for (const r of rows) {
    if (!r[3]) continue;
    const old = prev.find((x) => x.category_id === r[1] && brandKey(x.custom_name) === brandKey(r[3]));
    if (old) r[4] = old.custom_status;
  }

  await conn.query("DELETE FROM partner_brands WHERE partner_id = ?", [p.id]);
  await conn.query(
    "INSERT INTO partner_brands (partner_id, category_id, brand_id, custom_name, custom_status) VALUES ?",
    [rows]
  );
}

async function saveBusiness(conn, p, data) {
  const { errors, value } = validateBusiness(data);
  if (Object.keys(errors).length) throw bad("Please fix the highlighted fields.", errors);
  await conn.query(
    `UPDATE partners SET business_type = ?, business_name = ?, description = ?, experience_years = ?,
            gstin = ?, business_email = ?, operating_hours = ?, contact_preference = ?, show_phone_publicly = ?,
            gst_verified_at = IF(gstin <=> ?, gst_verified_at, NULL)
      WHERE id = ?`,
    [
      value.business_type,
      value.business_name,
      value.description,
      value.experience_years,
      value.gstin,
      value.business_email,
      value.operating_hours,
      value.contact_preference,
      value.show_phone_publicly,
      value.gstin,
      p.id,
    ]
  );
}

async function saveLocations(conn, p, data) {
  const addr = validateAddress(data.address || {});
  const errors = { ...addr.errors };

  // Address: state must exist; city must be a real city_tb row (a locality
  // row is fine for the address).
  if (addr.value.address_state_id) {
    const [[s]] = await conn.query("SELECT id FROM states WHERE id = ?", [addr.value.address_state_id]);
    if (!s) errors["address.state_id"] = "Choose a valid state.";
  }
  if (addr.value.address_city_id) {
    const [[c]] = await conn.query("SELECT id FROM city_tb WHERE id = ? AND status = '1'", [addr.value.address_city_id]);
    if (!c) errors["address.city_id"] = "Choose a valid city.";
  }

  // Service areas.
  const raw = Array.isArray(data.areas) ? data.areas : [];
  if (!raw.length) errors.areas = "Add at least one city you serve.";
  if (raw.length > LIMITS.maxAreas) errors.areas = `You can add up to ${LIMITS.maxAreas} service areas.`;
  const areas = [];
  const seen = new Set();
  for (const a of raw) {
    const cityId = Number(a?.city_id);
    const locId = a?.locality_id === null || a?.locality_id === undefined || a?.locality_id === "" ? null : Number(a.locality_id);
    if (!Number.isInteger(cityId) || cityId <= 0 || (locId !== null && (!Number.isInteger(locId) || locId <= 0))) {
      errors.areas = "Invalid service area.";
      break;
    }
    const k = `${cityId}:${locId ?? 0}`;
    if (seen.has(k)) continue; // silently drop duplicates
    seen.add(k);
    areas.push({ cityId, locId, primary: !!a.is_primary });
  }

  if (areas.length && !errors.areas) {
    const cityIds = [...new Set(areas.map((a) => a.cityId))];
    const [cities] = await conn.query(
      `SELECT c.id FROM city_tb c
        WHERE c.id IN (?) AND c.status = '1'
          AND NOT EXISTS (SELECT 1 FROM city_parent_map m WHERE m.city_id = c.id)`,
      [cityIds]
    );
    if (cities.length !== cityIds.length) errors.areas = "One of the selected cities is not available.";

    const locIds = areas.filter((a) => a.locId).map((a) => a.locId);
    if (locIds.length && !errors.areas) {
      const [locs] = await conn.query(
        `SELECT m.city_id, m.parent_city_id FROM city_parent_map m JOIN city_tb c ON c.id = m.city_id
          WHERE m.city_id IN (?) AND c.status = '1'`,
        [locIds]
      );
      const parent = new Map(locs.map((l) => [l.city_id, l.parent_city_id]));
      if (areas.some((a) => a.locId && parent.get(a.locId) !== a.cityId)) {
        errors.areas = "A selected locality doesn't belong to its city.";
      }
    }
  }

  // Locality requests (names not in our master list).
  const reqs = [];
  for (const r of Array.isArray(data.locality_requests) ? data.locality_requests.slice(0, 20) : []) {
    const name = String(r?.name ?? "").replace(/\s+/g, " ").trim();
    const cityId = Number(r?.city_id);
    if (!name) continue;
    if (name.length > 120 || !/^[\p{L}\p{N} .,'()-]+$/u.test(name)) {
      errors.locality_requests = "Enter a valid locality name.";
      break;
    }
    if (!areas.some((a) => a.cityId === cityId)) {
      errors.locality_requests = "Locality requests must be for a city you serve.";
      break;
    }
    reqs.push([p.id, cityId, name]);
  }

  if (Object.keys(errors).length) throw bad("Please fix the highlighted fields.", errors);

  if (!areas.some((a) => a.primary)) areas[0].primary = true;
  let primarySeen = false;
  for (const a of areas) {
    if (a.primary && !primarySeen) primarySeen = true;
    else a.primary = false;
  }

  await conn.query(
    `UPDATE partners SET address_line = ?, address_state_id = ?, address_city_id = ?, address_locality = ?, address_pincode = ?
      WHERE id = ?`,
    [
      addr.value.address_line,
      addr.value.address_state_id,
      addr.value.address_city_id,
      addr.value.address_locality,
      addr.value.address_pincode,
      p.id,
    ]
  );
  await conn.query("DELETE FROM partner_service_areas WHERE partner_id = ?", [p.id]);
  await conn.query("INSERT INTO partner_service_areas (partner_id, city_id, locality_id, is_primary) VALUES ?", [
    areas.map((a) => [p.id, a.cityId, a.locId, a.primary ? 1 : 0]),
  ]);

  await conn.query("DELETE FROM partner_location_requests WHERE partner_id = ? AND status = 'pending'", [p.id]);
  if (reqs.length) {
    await conn.query("INSERT IGNORE INTO partner_location_requests (partner_id, city_id, requested_name) VALUES ?", [reqs]);
  }
}

/* ── partner status actions ───────────────────────────────────────────── */

export async function submitApplication(partnerId, { consents, ip, userAgent }) {
  if (!consents?.terms || !consents?.privacy || !consents?.public_display) {
    throw bad("Please accept all three consents to submit.", { consents: "All consents are required." });
  }
  const app = await getApplication(partnerId);
  if (!app) throw new HttpError(404, "not_found", "Application not found.");
  if (!app.completion.ready) {
    throw new HttpError(422, "incomplete", "Your application is incomplete.", { steps: app.completion.missing });
  }

  return withTransaction(async (conn) => {
    const p = await lockPartner(conn, partnerId);
    if (!EDITABLE.has(p.status)) {
      throw new HttpError(409, "already_submitted", "This application has already been submitted.");
    }
    if (p.version !== app.version) {
      throw new HttpError(409, "version_conflict", "Your application changed while submitting. Please review and submit again.");
    }
    const ua = String(userAgent || "").slice(0, 255);
    await conn.query("INSERT INTO partner_consents (partner_id, consent_type, version, ip, user_agent) VALUES ?", [
      ["terms", "privacy", "public_display"].map((t) => [partnerId, t, CONSENT_VERSION, ip || "", ua]),
    ]);
    await conn.query(
      `UPDATE partners SET status = 'pending', is_listed = 0, submitted_at = NOW(), current_step = 7,
              version = version + 1 WHERE id = ?`,
      [partnerId]
    );
    await logHistory(conn, {
      partnerId,
      action: p.status === "draft" && !p.submitted_at ? "submitted" : "resubmitted",
      from: p.status,
      to: "pending",
      actorType: "partner",
      actorId: partnerId,
    });
    return { ref: partnerRef(partnerId), status: "pending" };
  });
}

/**
 * Approved or pending partner wants to change their details. Their profile is
 * taken off the site until an admin approves the changes, so stale or
 * unreviewed data is never shown publicly.
 */
export async function startEditing(partnerId) {
  return withTransaction(async (conn) => {
    const p = await lockPartner(conn, partnerId);
    if (EDITABLE.has(p.status)) return { status: p.status };
    if (!["approved", "pending"].includes(p.status)) {
      throw new HttpError(409, "not_editable", "Your profile can't be edited right now. Please contact support.");
    }
    await conn.query("UPDATE partners SET status = 'draft', is_listed = 0, version = version + 1 WHERE id = ?", [partnerId]);
    await logHistory(conn, {
      partnerId,
      action: p.status === "approved" ? "edit_started" : "withdrawn",
      from: p.status,
      to: "draft",
      actorType: "partner",
      actorId: partnerId,
    });
    return { status: "draft" };
  });
}

/* ── admin status actions ─────────────────────────────────────────────── */

const ADMIN_ACTIONS = {
  approve: { from: ["pending"], to: "approved", reason: false },
  reject: { from: ["pending", "info_requested"], to: "rejected", reason: true },
  request_info: { from: ["pending"], to: "info_requested", reason: true },
  suspend: { from: ["approved"], to: "suspended", reason: true },
  reactivate: { from: ["suspended"], to: "approved", reason: false },
};

async function uniqueSlug(conn, p) {
  const [[area]] = await conn.query(
    `SELECT c.city_name FROM partner_service_areas a JOIN city_tb c ON c.id = a.city_id
      WHERE a.partner_id = ? ORDER BY a.is_primary DESC, a.id LIMIT 1`,
    [p.id]
  );
  const base = slugify(`${p.business_name || p.full_name} ${area?.city_name || ""}`) || `partner-${p.id}`;
  const [taken] = await conn.query("SELECT slug FROM partners WHERE slug = ? OR slug LIKE ?", [base, `${base}-%`]);
  const used = new Set(taken.map((r) => r.slug));
  if (!used.has(base)) return base;
  for (let i = 2; ; i++) if (!used.has(`${base}-${i}`)) return `${base}-${i}`;
}

export async function adminChangeStatus(partnerId, admin, { action, reason, publish }) {
  const rule = ADMIN_ACTIONS[action];
  if (!rule) throw new HttpError(400, "bad_action", "Unknown action.");
  const why = String(reason ?? "").trim().slice(0, 2000);
  if (rule.reason && why.length < 5) throw bad("Please give a reason (at least 5 characters).", { reason: "Reason is required." });

  return withTransaction(async (conn) => {
    const p = await lockPartner(conn, partnerId);
    if (!rule.from.includes(p.status)) {
      throw new HttpError(409, "bad_transition", `Can't ${action.replace("_", " ")} an application that is ${STATUS_LABELS[p.status]}.`);
    }
    const sets = ["status = ?", "reviewed_at = NOW()", "reviewed_by = ?", "version = version + 1"];
    const vals = [rule.to, admin.id];

    if (rule.to === "approved") {
      if (!p.mobile_verified_at) throw new HttpError(409, "unverified_mobile", "Mobile number is not verified.");
      if (!p.slug) {
        sets.push("slug = ?");
        vals.push(await uniqueSlug(conn, p));
      }
      if (action === "approve") sets.push("approved_at = NOW()");
      sets.push("is_listed = ?");
      vals.push(publish ? 1 : 0);
      sets.push("review_reason = NULL");
    } else {
      sets.push("is_listed = 0", "review_reason = ?");
      vals.push(why);
    }

    await conn.query(`UPDATE partners SET ${sets.join(", ")} WHERE id = ?`, [...vals, partnerId]);
    await logHistory(conn, {
      partnerId,
      action,
      from: p.status,
      to: rule.to,
      reason: why || null,
      actorType: "admin",
      actorId: admin.id,
    });
    return { status: rule.to };
  });
}

export async function adminSetListing(partnerId, admin, listed) {
  return withTransaction(async (conn) => {
    const p = await lockPartner(conn, partnerId);
    if (listed && p.status !== "approved") {
      throw new HttpError(409, "not_approved", "Only approved partners can be listed publicly.");
    }
    if (!!p.is_listed === !!listed) return { is_listed: !!listed };
    await conn.query("UPDATE partners SET is_listed = ?, version = version + 1 WHERE id = ?", [listed ? 1 : 0, partnerId]);
    await logHistory(conn, {
      partnerId,
      action: listed ? "listing_enabled" : "listing_disabled",
      from: p.status,
      to: p.status,
      actorType: "admin",
      actorId: admin.id,
    });
    return { is_listed: !!listed };
  });
}

const VERIFY_FIELDS = { identity: "identity_verified_at", business: "business_verified_at", gst: "gst_verified_at" };

export async function adminSetVerification(partnerId, admin, field, verified, note) {
  const col = VERIFY_FIELDS[field];
  if (!col) throw new HttpError(400, "bad_field", "Unknown verification field.");
  return withTransaction(async (conn) => {
    const p = await lockPartner(conn, partnerId);
    if (field === "gst" && verified && !p.gstin) throw new HttpError(409, "no_gstin", "This partner has not provided a GSTIN.");
    await conn.query(`UPDATE partners SET ${col} = ${verified ? "NOW()" : "NULL"} WHERE id = ?`, [partnerId]);
    await logHistory(conn, {
      partnerId,
      action: `${field}_${verified ? "verified" : "unverified"}`,
      from: p.status,
      to: p.status,
      reason: note ? String(note).slice(0, 500) : null,
      actorType: "admin",
      actorId: admin.id,
    });
  });
}
