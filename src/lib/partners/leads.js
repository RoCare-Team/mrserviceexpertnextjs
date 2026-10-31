// Partner leads: created by a customer's "Book now" and offered to that
// partner for 15 minutes ("direct" phase). If they don't accept, the lead
// opens to every eligible partner in the city for another 15 minutes
// ("open" phase) — the first to accept gets it. Accepting costs coins (50%
// of the service price). Still unaccepted → expired and forwarded to the CRM.

import db from "@/lib/db";
import { HttpError } from "@/lib/partners/http";
import { withTransaction } from "@/lib/partners/application";
import { applyTxn } from "@/lib/partners/wallet";
import { CRM_LEAD_TYPES, crmBrands, crmServices, crmPincode, forwardLeadToCrm } from "@/lib/partners/crm";
import { brandKey, validName } from "@/lib/partners/validation";
import { notifyPartner } from "@/lib/partners/notify";

export const LEAD_WINDOW_MIN = 15; // chosen partner's exclusive window
export const OPEN_WINDOW_MIN = 15; // then open to the whole city
export const LEAD_SHARE = 0.5; // partner pays 50% of the service price in coins
const MAX_SERVICES = 5;
const MAX_CRM_ATTEMPTS = 3;

const bad = (message, fields) => new HttpError(422, "validation_error", message, fields);
const round2 = (n) => Math.round(Number(n) * 100) / 100;
const clean = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
/** DATE column (mysql2 gives a local-midnight Date) → YYYY-MM-DD without a UTC day shift. */
const ymd = (d) => (d instanceof Date ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : String(d ?? "").slice(0, 10));

/* ── create ───────────────────────────────────────────────────────────── */

export async function createLead(customer, input) {
  const slug = String(input.partner || "");
  const [[partner]] = await db.query(
    `SELECT id, slug, is_available FROM partners
      WHERE slug = ? AND status = 'approved' AND is_listed = 1 AND mobile_verified_at IS NOT NULL AND deleted_at IS NULL`,
    [slug]
  );
  if (!partner) throw new HttpError(404, "partner_unavailable", "This partner isn't taking bookings right now.");
  if (!partner.is_available) throw new HttpError(409, "partner_offline", "This partner is not taking bookings at the moment. Please choose another partner.");

  const [[cat]] = await db.query(
    `SELECT c.id, c.category_url FROM category_tb c
      WHERE LOWER(c.category_url) = ?
        AND EXISTS (SELECT 1 FROM partner_services ps WHERE ps.partner_id = ? AND ps.category_id = c.id)`,
    [String(input.category || "").toLowerCase(), partner.id]
  );
  if (!cat) throw bad("This partner doesn't offer that service category.");
  const leadType = CRM_LEAD_TYPES[cat.category_url];
  if (!leadType) throw bad("Online booking isn't available for this category yet.");

  // Customer name (logged-in name is pre-filled; they may correct it).
  const name = validName(input.name || customer.name);
  if (name.error) throw bad(name.error, { name: name.error });

  // Brand + service + price from the CRM, never from the browser.
  const phpBrandId = Number(input.php_brand_id);
  const brands = await crmBrands(leadType);
  const brand = brands.find((b) => b.id === phpBrandId);
  if (!brand) throw bad("Please choose a brand.", { brand: "Choose a brand." });

  // One or more services; prices always from the CRM catalogue.
  const wanted = [...new Set((Array.isArray(input.php_service_ids) ? input.php_service_ids : [input.php_service_id]).map(Number))].filter(
    (n) => Number.isInteger(n) && n > 0
  );
  if (!wanted.length) throw bad("Please choose at least one service.", { service: "Choose a service." });
  if (wanted.length > MAX_SERVICES) throw bad(`You can book up to ${MAX_SERVICES} services at once.`, { service: "Too many services." });
  const catalogue = await crmServices(leadType, phpBrandId);
  const picked = wanted.map((id) => catalogue.find((s) => s.id === id));
  if (picked.some((s) => !s || !(s.price > 0))) throw bad("A selected service is no longer available.", { service: "Choose again." });
  const total = round2(picked.reduce((a, s) => a + s.price, 0));
  const service = { id: picked[0].id, name: picked.map((s) => s.name).join(" + ").slice(0, 500), price: total };

  // Appointment: today … +30 days, slot text as given by getTimeSlots.php.
  const date = String(input.appointment_date || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw bad("Choose a date.", { date: "Choose a date." });
  const today = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10); // IST
  const max = new Date(Date.now() + 5.5 * 3600_000 + 30 * 86400_000).toISOString().slice(0, 10);
  if (date < today || date > max) throw bad("Choose a date within the next 30 days.", { date: "Invalid date." });
  const slot = clean(input.appointment_time, 40);
  if (!/^\d{1,2}(:\d{2})? ?[AP]M ?- ?\d{1,2}(:\d{2})? ?[AP]M$/i.test(slot)) throw bad("Choose a time slot.", { slot: "Choose a time slot." });

  // Address.
  const a = input.address || {};
  const address = {
    house_no: clean(a.house_no, 150),
    area: clean(a.area, 150),
    landmark: clean(a.landmark, 150),
    pincode: String(a.pincode ?? "").replace(/\D/g, "").slice(0, 6),
  };
  const fields = {};
  if (address.house_no.length < 1) fields.house_no = "Enter house / flat number.";
  if (address.area.length < 2) fields.area = "Enter area / street.";
  if (!/^[1-9]\d{5}$/.test(address.pincode)) fields.pincode = "Enter a valid 6-digit pincode.";
  if (Object.keys(fields).length) throw bad("Please complete the address.", fields);
  const loc = await crmPincode(address.pincode);
  if (!loc) throw bad("We couldn't find this pincode. Please check it.", { pincode: "Pincode not found." });

  // Page the booking came from (same-site URL only).
  let pageUrl = "";
  let pageCityId = null;
  try {
    const u = new URL(String(input.page_url || ""));
    pageUrl = u.toString().slice(0, 500);
    const citySlug = u.pathname.split("/").filter(Boolean)[0];
    if (citySlug) {
      const [[c]] = await db.query("SELECT id FROM city_tb WHERE LOWER(city_url) = ? LIMIT 1", [citySlug.toLowerCase()]);
      pageCityId = c?.id || null;
    }
  } catch {
    throw bad("Invalid page.");
  }

  // Match the CRM brand to our brand_tb row for reporting.
  const [ourBrands] = await db.query("SELECT id, brand_name FROM brand_tb WHERE category_id = ?", [cat.id]);
  const ourBrand = ourBrands.find((b) => brandKey(b.brand_name) === brandKey(brand.name));

  // City the open pool is drawn from: the page's city, else the pincode's city.
  let openCityId = pageCityId;
  if (!openCityId && loc.city) {
    const [[c]] = await db.query("SELECT id FROM city_tb WHERE LOWER(city_name) = ? AND status = '1' ORDER BY id LIMIT 1", [String(loc.city).toLowerCase()]);
    openCityId = c?.id || null;
  }

  const created = await withTransaction(async (conn) => {
    // One open booking per customer + partner + category per day.
    const [dupe] = await conn.query(
      `SELECT id FROM partner_leads
        WHERE customer_mobile = ? AND partner_id = ? AND category_id = ?
          AND status IN ('new','accepted') AND created_at > NOW() - INTERVAL 1 DAY
        LIMIT 1 FOR UPDATE`,
      [customer.mobile, partner.id, cat.id]
    );
    if (dupe.length) throw new HttpError(409, "duplicate_booking", "You already have a booking with this partner for this service. They will contact you shortly.");

    if (name.value !== customer.name) {
      await conn.query("UPDATE site_customers SET name = ? WHERE id = ?", [name.value, customer.id]);
    }
    const [ins] = await conn.query(
      `INSERT INTO partner_leads
         (partner_id, original_partner_id, customer_id, customer_name, customer_mobile, category_id, brand_id, php_lead_type, php_brand_id, brand_name,
          php_service_id, service_name, service_price, services_json, coin_cost, appointment_date, appointment_time,
          house_no, area, landmark, pincode, address_city, address_state, php_city_id, page_url, page_city_id, open_city_id, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW() + INTERVAL ${LEAD_WINDOW_MIN} MINUTE)`,
      [
        partner.id, partner.id, customer.id, name.value, customer.mobile, cat.id, ourBrand?.id || null, leadType, brand.id, brand.name,
        service.id, service.name, service.price, JSON.stringify(picked), round2(service.price * LEAD_SHARE), date, slot,
        address.house_no, address.area, address.landmark, address.pincode, loc.city, loc.state, loc.cityId, pageUrl, pageCityId, openCityId,
      ]
    );
    return { id: ins.insertId, service: service.name, price: service.price, services: picked };
  });
  await notifyPartner(
    partner.id,
    {
      type: "lead_new",
      title: `New booking: ${service.name}`,
      body: `${loc.city} · ₹${service.price} · ${date} ${slot}. Accept within ${LEAD_WINDOW_MIN} minutes.`,
      link: "/partner/dashboard?tab=leads",
    },
    { push: true }
  );
  return created;
}

/* ── partner side ─────────────────────────────────────────────────────── */

const mask = (m) => `${m.slice(0, 2)}******${m.slice(-2)}`;

/** [{ id, name, price }] — older single-service leads fall back to the row. */
export function parseServices(l) {
  try {
    const list = JSON.parse(l.services_json || "null");
    if (Array.isArray(list) && list.length) return list.map((s) => ({ id: Number(s.id), name: String(s.name), price: Number(s.price) }));
  } catch {}
  return [{ id: Number(l.php_service_id), name: l.service_name, price: Number(l.service_price) }];
}

/**
 * Customer contact + full address are revealed only to the partner who
 * accepted. `my_status` is the lead as this partner sees it: a lead another
 * partner took from the open pool shows as "taken" for the original one.
 */
function shapeForPartner(l, partnerId) {
  const status = l.my_status || l.status;
  const mine = Number(l.partner_id) === Number(partnerId);
  const open = mine && (status === "accepted" || status === "completed");
  return {
    id: l.id,
    status,
    phase: l.phase || "direct",
    // Open-pool lead: visible to every eligible partner in the city, first to accept wins.
    is_open: status === "new" && l.phase === "open",
    assigned_to_me: mine,
    opened_at: l.opened_at,
    category: l.category_name,
    brand: l.brand_name,
    service: l.service_name,
    service_price: Number(l.service_price),
    services: parseServices(l),
    coin_cost: Number(l.coin_cost),
    appointment_date: l.appointment_date,
    appointment_time: l.appointment_time,
    area: `${l.area}, ${l.address_city}`,
    customer_name: open ? l.customer_name : l.customer_name.split(" ")[0],
    customer_mobile: open ? l.customer_mobile : mask(l.customer_mobile),
    address: open ? [l.house_no, l.area, l.landmark, l.address_city, l.address_state, l.pincode].filter(Boolean).join(", ") : null,
    created_at: l.created_at,
    expires_at: l.expires_at,
    seconds_left: Math.max(0, Number(l.seconds_left || 0)),
    issue_note: l.issue_note,
    refunded: !!l.refunded_at,
    partner_note: l.partner_note,
    final_amount: l.final_amount === null ? null : Number(l.final_amount),
    work_done: l.work_done,
    accepted_at: l.accepted_at,
    completed_at: l.completed_at,
  };
}

const GROUPS = { new: ["new"], accepted: ["accepted"], completed: ["completed"], missed: ["rejected", "expired", "taken"] };

/** SQL: partner ? serves the city the lead's open pool is drawn from (city, locality or parent city). */
const SERVES_LEAD_CITY = `EXISTS (
  SELECT 1 FROM partner_service_areas a
   WHERE a.partner_id = ?
     AND (a.city_id = l.open_city_id OR a.locality_id = l.open_city_id
          OR a.city_id = (SELECT m.parent_city_id FROM city_parent_map m WHERE m.city_id = l.open_city_id LIMIT 1)))`;
const OFFERS_LEAD_CATEGORY = "EXISTS (SELECT 1 FROM partner_categories pc WHERE pc.partner_id = ? AND pc.category_id = l.category_id)";
const PASSED = "EXISTS (SELECT 1 FROM partner_lead_passes x WHERE x.lead_id = l.id AND x.partner_id = ?)";
/** Leads this partner may see: their own, ones they originally got, and the city's open pool. */
const VISIBLE = `(
  (l.partner_id = ? AND NOT ${PASSED})
  OR (l.original_partner_id = ? AND l.status <> 'new')
  OR (l.phase = 'open' AND l.status = 'new' AND l.expires_at > NOW() AND l.open_city_id IS NOT NULL
      AND ${OFFERS_LEAD_CATEGORY} AND ${SERVES_LEAD_CITY} AND NOT ${PASSED})
)`;
const MY_STATUS = "IF(l.partner_id = ? OR l.status = 'new', l.status, 'taken')";

/** filters: { group: new|accepted|completed|missed, search, from, to } */
export async function listPartnerLeads(partnerId, { group = null, search = "", from = null, to = null, limit = 50 } = {}) {
  await processDueLeads().catch((e) => console.error("[leads] process", e?.message));
  const p = partnerId;
  const params = [p, p, p, p, p, p, p]; // MY_STATUS (select) + VISIBLE
  let where = VISIBLE;
  if (GROUPS[group]) {
    where += ` AND ${MY_STATUS} IN (?)`;
    params.push(p, GROUPS[group]);
  }
  const q = String(search || "").trim().slice(0, 60);
  if (q) {
    // Customer name / mobile are searchable only on leads the partner paid for.
    const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
    where += ` AND (l.service_name LIKE ? OR l.area LIKE ? OR l.id = ?
                OR (l.partner_id = ? AND l.status IN ('accepted','completed') AND (l.customer_name LIKE ? OR l.customer_mobile LIKE ?)))`;
    params.push(like, like, Number(q) || 0, p, like, like);
  }
  if (from && /^\d{4}-\d{2}-\d{2}$/.test(from)) {
    where += " AND l.created_at >= ?";
    params.push(`${from} 00:00:00`);
  }
  if (to && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    where += " AND l.created_at <= ?";
    params.push(`${to} 23:59:59`);
  }
  const [rows] = await db.query(
    `SELECT l.*, c.category_name, ${MY_STATUS} AS my_status, TIMESTAMPDIFF(SECOND, NOW(), l.expires_at) AS seconds_left
       FROM partner_leads l JOIN category_tb c ON c.id = l.category_id
      WHERE ${where}
      ORDER BY (l.status = 'new') DESC, (l.partner_id = ?) DESC, l.id DESC
      LIMIT ${Math.min(Number(limit) || 50, 200)}`,
    [...params, p]
  );
  return rows.map((l) => shapeForPartner(l, partnerId));
}

/** Lock a lead this partner owns (direct or already taken by them). */
async function lockOwnLead(conn, partnerId, leadId) {
  const [[l]] = await conn.query(
    "SELECT *, TIMESTAMPDIFF(SECOND, NOW(), expires_at) AS seconds_left FROM partner_leads WHERE id = ? AND partner_id = ? FOR UPDATE",
    [leadId, partnerId]
  );
  if (!l) throw new HttpError(404, "not_found", "Lead not found.");
  return l;
}

/** Approved partners (other than `excludeId`) who offer the category and serve the lead's city. */
async function eligiblePartnerIds(conn, l, excludeId = 0) {
  if (!l.open_city_id) return [];
  const [rows] = await conn.query(
    `SELECT DISTINCT p.id
       FROM partners p
       JOIN partner_categories pc ON pc.partner_id = p.id AND pc.category_id = ?
       JOIN partner_service_areas a ON a.partner_id = p.id
        AND (a.city_id = ? OR a.locality_id = ?
             OR a.city_id = (SELECT m.parent_city_id FROM city_parent_map m WHERE m.city_id = ? LIMIT 1))
      WHERE p.status = 'approved' AND p.is_listed = 1 AND p.is_available = 1
        AND p.mobile_verified_at IS NOT NULL AND p.deleted_at IS NULL AND p.id <> ?`,
    [l.category_id, l.open_city_id, l.open_city_id, l.open_city_id, excludeId]
  );
  return rows.map((r) => r.id);
}

/**
 * Move a still-new direct lead to the open pool (fresh OPEN_WINDOW_MIN
 * window). With nobody else eligible in the city it goes straight to the
 * CRM instead. Caller holds the row lock. Returns who to notify.
 */
async function openLead(conn, l, { rejected = false, reason = null } = {}) {
  const others = await eligiblePartnerIds(conn, l, l.original_partner_id || l.partner_id);
  if (!others.length) {
    await conn.query(
      `UPDATE partner_leads SET status = ?, rejected_at = IF(?, NOW(), rejected_at), reject_reason = ?, crm_status = 'pending'
        WHERE id = ? AND status = 'new'`,
      [rejected ? "rejected" : "expired", rejected ? 1 : 0, reason, l.id]
    );
    return { opened: false, partnerIds: [] };
  }
  await conn.query(
    `UPDATE partner_leads
        SET phase = 'open', opened_at = NOW(), expires_at = NOW() + INTERVAL ${OPEN_WINDOW_MIN} MINUTE,
            rejected_at = IF(?, NOW(), rejected_at), reject_reason = ?
      WHERE id = ? AND status = 'new'`,
    [rejected ? 1 : 0, reason, l.id]
  );
  // A partner who rejected it should not see it again in the pool.
  if (rejected) await conn.query("INSERT IGNORE INTO partner_lead_passes (lead_id, partner_id, reason) VALUES (?, ?, ?)", [l.id, l.partner_id, reason]);
  return { opened: true, partnerIds: others };
}

async function notifyPool(l, partnerIds) {
  await Promise.all(
    partnerIds.map((id) =>
      notifyPartner(
        id,
        {
          type: "lead_open",
          title: `Open lead: ${l.service_name}`,
          body: `${l.address_city} · ₹${l.service_price} · ${ymd(l.appointment_date)} ${l.appointment_time}. First to accept in ${OPEN_WINDOW_MIN} minutes gets it.`,
          link: "/partner/dashboard?tab=leads",
        },
        { push: true }
      )
    )
  );
}

/** First to accept wins: the row lock + status check make that atomic. */
export async function acceptLead(partnerId, leadId) {
  return withTransaction(async (conn) => {
    const [[p]] = await conn.query("SELECT status FROM partners WHERE id = ?", [partnerId]);
    if (p?.status !== "approved") throw new HttpError(403, "not_active", "Only active partners can accept leads.");
    const [[l]] = await conn.query("SELECT *, TIMESTAMPDIFF(SECOND, NOW(), expires_at) AS seconds_left FROM partner_leads WHERE id = ? FOR UPDATE", [leadId]);
    if (!l) throw new HttpError(404, "not_found", "Lead not found.");
    const mine = Number(l.partner_id) === Number(partnerId);
    if (!mine && l.phase !== "open") throw new HttpError(404, "not_found", "Lead not found.");
    if (l.status !== "new") {
      if (l.phase === "open" && !mine) throw new HttpError(409, "taken", "Another partner already accepted this lead.");
      throw new HttpError(409, "not_available", "This lead is no longer available.");
    }
    if (Number(l.seconds_left) <= 0) throw new HttpError(409, "expired", `The ${l.phase === "open" ? OPEN_WINDOW_MIN : LEAD_WINDOW_MIN}-minute window for this lead has ended.`);
    if (!mine) {
      const [[ok]] = await conn.query(
        `SELECT 1 AS ok FROM partner_leads l
          WHERE l.id = ? AND ${OFFERS_LEAD_CATEGORY} AND ${SERVES_LEAD_CITY}`,
        [leadId, partnerId, partnerId]
      );
      if (!ok) throw new HttpError(403, "not_eligible", "This lead is outside your service area or categories.");
    }
    const balance = await applyTxn(conn, {
      partnerId,
      type: "lead_debit",
      amount: -Number(l.coin_cost),
      leadId,
      note: `Lead #${leadId} — ${l.service_name}`,
      actorType: "partner",
      actorId: partnerId,
    });
    await conn.query("UPDATE partner_leads SET status = 'accepted', accepted_at = NOW(), partner_id = ? WHERE id = ?", [partnerId, leadId]);
    return { balance, original: l.original_partner_id, takenFromPool: !mine, service: l.service_name };
  }).then(async (r) => {
    // Tell the partner who missed it that someone else took it.
    if (r.takenFromPool && r.original && Number(r.original) !== Number(partnerId)) {
      await notifyPartner(r.original, {
        type: "lead_missed",
        title: `Lead #${leadId} taken by another partner`,
        body: `${r.service} was accepted by another partner from the open pool.`,
        link: "/partner/dashboard?tab=leads",
      });
    }
    return { balance: r.balance };
  });
}

/**
 * Direct phase: the chosen partner rejecting opens the lead to the city
 * right away (or sends it to the CRM when nobody else is eligible).
 * Open phase: "reject" just hides the lead for this partner (a pass).
 */
export async function rejectLead(partnerId, leadId, reason) {
  const why = clean(reason, 255) || null;
  const r = await withTransaction(async (conn) => {
    const [[l]] = await conn.query("SELECT * FROM partner_leads WHERE id = ? FOR UPDATE", [leadId]);
    if (!l) throw new HttpError(404, "not_found", "Lead not found.");
    const mine = Number(l.partner_id) === Number(partnerId);
    if (!mine && l.phase !== "open") throw new HttpError(404, "not_found", "Lead not found.");
    if (l.status !== "new") throw new HttpError(409, "not_available", "This lead is no longer available.");
    if (l.phase === "open") {
      await conn.query("INSERT IGNORE INTO partner_lead_passes (lead_id, partner_id, reason) VALUES (?, ?, ?)", [leadId, partnerId, why]);
      return { passed: true };
    }
    return { lead: l, ...(await openLead(conn, l, { rejected: true, reason: why })) };
  });
  if (r.passed) return;
  if (r.opened) await notifyPool(r.lead, r.partnerIds);
  else await forwardOne(leadId).catch((e) => console.error("[leads] forward", e?.message)); // nobody else: CRM right away
}

/** details: { final_amount?, work_done? } — partner's own record of the job. */
export async function completeLead(partnerId, leadId, details = {}) {
  let amount = null;
  if (details.final_amount !== undefined && details.final_amount !== null && details.final_amount !== "") {
    amount = Number(details.final_amount);
    if (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000) throw bad("Enter a valid amount.");
    amount = round2(amount);
  }
  await withTransaction(async (conn) => {
    const l = await lockOwnLead(conn, partnerId, leadId);
    if (l.status !== "accepted") throw new HttpError(409, "bad_state", "Only accepted leads can be marked completed.");
    await conn.query(
      "UPDATE partner_leads SET status = 'completed', completed_at = NOW(), final_amount = ?, work_done = ? WHERE id = ?",
      [amount, clean(details.work_done, 500) || null, leadId]
    );
  });
}

/** Private note on any of the partner's own leads. */
export async function saveLeadNote(partnerId, leadId, note) {
  const [r] = await db.query("UPDATE partner_leads SET partner_note = ? WHERE id = ? AND partner_id = ?", [
    clean(note, 1000) || null,
    leadId,
    partnerId,
  ]);
  if (!r.affectedRows) throw new HttpError(404, "not_found", "Lead not found.");
}

export async function reportLeadIssue(partnerId, leadId, note) {
  const text = clean(note, 500);
  if (text.length < 5) throw bad("Please describe the problem (at least 5 characters).");
  await withTransaction(async (conn) => {
    const l = await lockOwnLead(conn, partnerId, leadId);
    if (!["accepted", "completed"].includes(l.status)) throw new HttpError(409, "bad_state", "You can report a problem only on accepted leads.");
    if (l.refunded_at) throw new HttpError(409, "refunded", "This lead was already refunded.");
    await conn.query("UPDATE partner_leads SET issue_note = ?, issue_reported_at = NOW() WHERE id = ?", [text, leadId]);
  });
}

/* ── CRM forwarding (cron + lazy) ─────────────────────────────────────── */

async function forwardOne(leadId) {
  const [[l]] = await db.query(
    `SELECT l.*, p.slug FROM partner_leads l JOIN partners p ON p.id = l.partner_id
      WHERE l.id = ? AND l.crm_status IN ('pending','failed') AND l.crm_attempts < ?`,
    [leadId, MAX_CRM_ATTEMPTS]
  );
  if (!l) return;
  // Claim this attempt so two workers never forward the same lead.
  const [claim] = await db.query(
    "UPDATE partner_leads SET crm_attempts = crm_attempts + 1 WHERE id = ? AND crm_attempts = ? AND crm_status IN ('pending','failed')",
    [l.id, l.crm_attempts]
  );
  if (!claim.affectedRows) return;
  const r = await forwardLeadToCrm({ ...l, services: parseServices(l) }, l.slug || "");
  await db.query(
    `UPDATE partner_leads SET crm_status = ?, crm_response = ?, crm_sent_at = IF(? IN ('sent','duplicate'), NOW(), crm_sent_at) WHERE id = ?`,
    [r.status, r.message.slice(0, 500), r.status, l.id]
  );
}

let lastRun = 0;

/**
 * Move leads along: direct leads past 15 minutes open to the city (or go
 * to the CRM when nobody else is eligible), open leads past their 15
 * minutes expire to the CRM, and pending CRM forwards are pushed. Runs
 * from the cron endpoint and opportunistically (throttled) on dashboard
 * loads, so leads still move even if the cron is late.
 */
export async function processDueLeads({ force = false } = {}) {
  if (!force && Date.now() - lastRun < 60_000) return { skipped: true };
  lastRun = Date.now();

  // 1) Direct window over → open pool.
  const [directDue] = await db.query(
    "SELECT id FROM partner_leads WHERE status = 'new' AND phase = 'direct' AND expires_at <= NOW() ORDER BY id LIMIT 100"
  );
  let opened = 0;
  let expired = 0;
  for (const { id } of directDue) {
    const r = await withTransaction(async (conn) => {
      const [[l]] = await conn.query("SELECT * FROM partner_leads WHERE id = ? FOR UPDATE", [id]);
      if (!l || l.status !== "new" || l.phase !== "direct") return null;
      return { lead: l, ...(await openLead(conn, l)) };
    }).catch((e) => (console.error("[leads] open", e?.message), null));
    if (!r) continue;
    const l = r.lead;
    if (r.opened) {
      opened++;
      await notifyPartner(l.partner_id, {
        type: "lead_missed",
        title: `Lead #${l.id} opened to other partners`,
        body: `You didn't accept ${l.service_name} within ${LEAD_WINDOW_MIN} minutes. It is now open to all partners in ${l.address_city} for ${OPEN_WINDOW_MIN} minutes — you can still accept it.`,
        link: "/partner/dashboard?tab=leads",
      });
      await notifyPool(l, r.partnerIds);
    } else {
      expired++;
      await notifyPartner(l.partner_id, {
        type: "lead_missed",
        title: `Lead missed: ${l.service_name}`,
        body: `Lead #${l.id} wasn't accepted within ${LEAD_WINDOW_MIN} minutes and went to our support team.`,
        link: "/partner/dashboard?tab=leads",
      });
    }
  }

  // 2) Open window over → expired, CRM.
  const [openDue] = await db.query(
    "SELECT id, original_partner_id, service_name FROM partner_leads WHERE status = 'new' AND phase = 'open' AND expires_at <= NOW() ORDER BY id LIMIT 100"
  );
  for (const l of openDue) {
    const [r] = await db.query("UPDATE partner_leads SET status = 'expired', crm_status = 'pending' WHERE id = ? AND status = 'new'", [l.id]);
    if (!r.affectedRows) continue;
    expired++;
    if (l.original_partner_id) {
      await notifyPartner(l.original_partner_id, {
        type: "lead_missed",
        title: `Lead #${l.id} went to support`,
        body: `No partner accepted ${l.service_name} within ${OPEN_WINDOW_MIN} minutes, so our support team is handling it.`,
        link: "/partner/dashboard?tab=leads",
      });
    }
  }
  const [due] = await db.query(
    `SELECT id FROM partner_leads WHERE crm_status IN ('pending','failed') AND crm_attempts < ? ORDER BY id LIMIT 20`,
    [MAX_CRM_ATTEMPTS]
  );
  for (const d of due) await forwardOne(d.id);
  return { opened, expired, forwarded: due.length };
}

/* ── admin ────────────────────────────────────────────────────────────── */

export async function refundLead(admin, leadId, note) {
  return withTransaction(async (conn) => {
    const [[l]] = await conn.query("SELECT * FROM partner_leads WHERE id = ? FOR UPDATE", [leadId]);
    if (!l) throw new HttpError(404, "not_found", "Lead not found.");
    if (!["accepted", "completed"].includes(l.status)) throw new HttpError(409, "bad_state", "Only accepted leads were charged.");
    if (l.refunded_at) throw new HttpError(409, "refunded", "Already refunded.");
    const balance = await applyTxn(conn, {
      partnerId: l.partner_id,
      type: "refund",
      amount: Number(l.coin_cost),
      leadId,
      note: clean(note, 255) || `Refund for lead #${leadId}`,
      actorType: "admin",
      actorId: admin.id,
    });
    await conn.query("UPDATE partner_leads SET refunded_at = NOW(), refunded_by = ? WHERE id = ?", [admin.id, leadId]);
    return { balance, partnerId: l.partner_id, coins: Number(l.coin_cost) };
  }).then(async (r) => {
    await notifyPartner(r.partnerId, {
      type: "refund",
      title: `${r.coins} coins refunded`,
      body: `Refund for lead #${leadId}. ${clean(note, 200)}`.trim(),
      link: "/partner/dashboard?tab=wallet",
    });
    return { balance: r.balance };
  });
}

export async function retryCrm(leadId) {
  await db.query(
    "UPDATE partner_leads SET crm_status = 'pending', crm_attempts = 0 WHERE id = ? AND crm_status = 'failed'",
    [leadId]
  );
  await forwardOne(leadId);
}
