// Partner leads: created by a customer's "Book now", offered to that partner
// for 30 minutes, paid for with coins (50% of the service price) on accept,
// and forwarded to the CRM when rejected or not accepted in time.

import db from "@/lib/db";
import { HttpError } from "@/lib/partners/http";
import { withTransaction } from "@/lib/partners/application";
import { applyTxn } from "@/lib/partners/wallet";
import { CRM_LEAD_TYPES, crmBrands, crmServices, crmPincode, forwardLeadToCrm } from "@/lib/partners/crm";
import { brandKey, validName } from "@/lib/partners/validation";

export const LEAD_WINDOW_MIN = 30;
export const LEAD_SHARE = 0.5; // partner pays 50% of the service price in coins
const MAX_CRM_ATTEMPTS = 3;

const bad = (message, fields) => new HttpError(422, "validation_error", message, fields);
const round2 = (n) => Math.round(Number(n) * 100) / 100;
const clean = (v, max) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/* ── create ───────────────────────────────────────────────────────────── */

export async function createLead(customer, input) {
  const slug = String(input.partner || "");
  const [[partner]] = await db.query(
    `SELECT id, slug FROM partners
      WHERE slug = ? AND status = 'approved' AND is_listed = 1 AND mobile_verified_at IS NOT NULL AND deleted_at IS NULL`,
    [slug]
  );
  if (!partner) throw new HttpError(404, "partner_unavailable", "This partner isn't taking bookings right now.");

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

  const services = await crmServices(leadType, phpBrandId);
  const service = services.find((s) => s.id === Number(input.php_service_id));
  if (!service || !(service.price > 0)) throw bad("Please choose a service.", { service: "Choose a service." });

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

  return withTransaction(async (conn) => {
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
         (partner_id, customer_id, customer_name, customer_mobile, category_id, brand_id, php_lead_type, php_brand_id, brand_name,
          php_service_id, service_name, service_price, coin_cost, appointment_date, appointment_time,
          house_no, area, landmark, pincode, address_city, address_state, php_city_id, page_url, page_city_id, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW() + INTERVAL ${LEAD_WINDOW_MIN} MINUTE)`,
      [
        partner.id, customer.id, name.value, customer.mobile, cat.id, ourBrand?.id || null, leadType, brand.id, brand.name,
        service.id, service.name, service.price, round2(service.price * LEAD_SHARE), date, slot,
        address.house_no, address.area, address.landmark, address.pincode, loc.city, loc.state, loc.cityId, pageUrl, pageCityId,
      ]
    );
    return { id: ins.insertId, service: service.name, price: service.price };
  });
}

/* ── partner side ─────────────────────────────────────────────────────── */

const mask = (m) => `${m.slice(0, 2)}******${m.slice(-2)}`;

/** Customer contact + full address are revealed only after accepting. */
function shapeForPartner(l) {
  const open = l.status === "accepted" || l.status === "completed";
  return {
    id: l.id,
    status: l.status,
    category: l.category_name,
    brand: l.brand_name,
    service: l.service_name,
    service_price: Number(l.service_price),
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
  };
}

export async function listPartnerLeads(partnerId, { status = null, limit = 50 } = {}) {
  await processDueLeads().catch((e) => console.error("[leads] process", e?.message));
  const params = [partnerId];
  let where = "l.partner_id = ?";
  if (status) {
    where += " AND l.status = ?";
    params.push(status);
  }
  const [rows] = await db.query(
    `SELECT l.*, c.category_name, TIMESTAMPDIFF(SECOND, NOW(), l.expires_at) AS seconds_left
       FROM partner_leads l JOIN category_tb c ON c.id = l.category_id
      WHERE ${where}
      ORDER BY (l.status = 'new') DESC, l.id DESC
      LIMIT ${Math.min(Number(limit) || 50, 200)}`,
    params
  );
  return rows.map(shapeForPartner);
}

async function lockOwnLead(conn, partnerId, leadId) {
  const [[l]] = await conn.query(
    "SELECT *, TIMESTAMPDIFF(SECOND, NOW(), expires_at) AS seconds_left FROM partner_leads WHERE id = ? AND partner_id = ? FOR UPDATE",
    [leadId, partnerId]
  );
  if (!l) throw new HttpError(404, "not_found", "Lead not found.");
  return l;
}

export async function acceptLead(partnerId, leadId) {
  return withTransaction(async (conn) => {
    const [[p]] = await conn.query("SELECT status FROM partners WHERE id = ?", [partnerId]);
    if (p?.status !== "approved") throw new HttpError(403, "not_active", "Only active partners can accept leads.");
    const l = await lockOwnLead(conn, partnerId, leadId);
    if (l.status !== "new") throw new HttpError(409, "not_available", "This lead is no longer available.");
    if (Number(l.seconds_left) <= 0) throw new HttpError(409, "expired", "The 30-minute window for this lead has ended.");
    const balance = await applyTxn(conn, {
      partnerId,
      type: "lead_debit",
      amount: -Number(l.coin_cost),
      leadId,
      note: `Lead #${leadId} — ${l.service_name}`,
      actorType: "partner",
      actorId: partnerId,
    });
    await conn.query("UPDATE partner_leads SET status = 'accepted', accepted_at = NOW() WHERE id = ?", [leadId]);
    return { balance };
  });
}

export async function rejectLead(partnerId, leadId, reason) {
  await withTransaction(async (conn) => {
    const l = await lockOwnLead(conn, partnerId, leadId);
    if (l.status !== "new") throw new HttpError(409, "not_available", "This lead is no longer available.");
    await conn.query(
      "UPDATE partner_leads SET status = 'rejected', rejected_at = NOW(), reject_reason = ?, crm_status = 'pending' WHERE id = ?",
      [clean(reason, 255) || null, leadId]
    );
  });
  // Rejected leads go to the CRM right away.
  await forwardOne(leadId).catch((e) => console.error("[leads] forward", e?.message));
}

export async function completeLead(partnerId, leadId) {
  await withTransaction(async (conn) => {
    const l = await lockOwnLead(conn, partnerId, leadId);
    if (l.status !== "accepted") throw new HttpError(409, "bad_state", "Only accepted leads can be marked completed.");
    await conn.query("UPDATE partner_leads SET status = 'completed', completed_at = NOW() WHERE id = ?", [leadId]);
  });
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
  const r = await forwardLeadToCrm(l, l.slug || "");
  await db.query(
    `UPDATE partner_leads SET crm_status = ?, crm_response = ?, crm_sent_at = IF(? IN ('sent','duplicate'), NOW(), crm_sent_at) WHERE id = ?`,
    [r.status, r.message.slice(0, 500), r.status, l.id]
  );
}

let lastRun = 0;

/**
 * Expire leads past their 30-minute window and push pending ones to the CRM.
 * Runs from the cron endpoint and opportunistically (throttled) on dashboard
 * loads, so leads still move even if the cron is late.
 */
export async function processDueLeads({ force = false } = {}) {
  if (!force && Date.now() - lastRun < 60_000) return { skipped: true };
  lastRun = Date.now();
  const [exp] = await db.query(
    `UPDATE partner_leads SET status = 'expired', crm_status = 'pending'
      WHERE status = 'new' AND expires_at <= NOW()
      ORDER BY id LIMIT 100`
  );
  const [due] = await db.query(
    `SELECT id FROM partner_leads WHERE crm_status IN ('pending','failed') AND crm_attempts < ? ORDER BY id LIMIT 20`,
    [MAX_CRM_ATTEMPTS]
  );
  for (const d of due) await forwardOne(d.id);
  return { expired: exp.affectedRows, forwarded: due.length };
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
    return { balance };
  });
}

export async function retryCrm(leadId) {
  await db.query(
    "UPDATE partner_leads SET crm_status = 'pending', crm_attempts = 0 WHERE id = ? AND crm_status = 'failed'",
    [leadId]
  );
  await forwardOne(leadId);
}
