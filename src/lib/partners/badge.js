// "Featured Partner" badge.
//
//   • Partner buys it for ₹PARTNER_BADGE_PRICE (default 499) via Easebuzz →
//     1 year (365 days). Buying again while active adds a year to the current end.
//     Bought during registration → the days start when the admin approves.
//   • An admin can grant days for free, or remove the badge.
//   • Badge holders are listed first on city / locality pages (see listing.js).
//   • Free plan limits (plan.js): 1 city, 2 categories, 2 brands per category.
//     Without an active badge everything above that is kept but locked
//     (badge_locked = 1) — hidden from listings and leads — until renewal.
//   • 7 days before expiry the partner gets a renewal reminder (cron).

import db from "@/lib/db";
import { HttpError } from "@/lib/partners/http";
import { withTransaction, logHistory } from "@/lib/partners/application";
import { notifyPartner } from "@/lib/partners/notify";
import { hasColumn } from "@/lib/partners/schema";
import { FREE_LIMITS } from "@/lib/partners/plan";

export const BADGE_NAME = "Featured Partner";
export const BADGE_DAYS = 365;
export const BADGE_PERIOD = "1 year";
export const badgePrice = () => {
  const n = Number(process.env.PARTNER_BADGE_PRICE);
  return Number.isInteger(n) && n > 0 ? n : 499;
};

/**
 * SQL for "badge is active" on alias p. Falls back to always-false until
 * migration 2026_11_11_010 has added the column, so public pages never break.
 */
export async function featuredSql() {
  return (await hasColumn("partners", "featured_until")) ? "(p.featured_until IS NOT NULL AND p.featured_until > NOW())" : "(p.id < 0)"; // always false, never "ORDER BY 0" (= column position)
}

/** Migration 2026_11_12_011 (free-plan locks) has run. */
export const locksReady = () => hasColumn("partner_categories", "badge_locked");

/** " AND <alias>.badge_locked = 0" once the lock columns exist, else "". */
export async function unlockedSql(alias) {
  return (await locksReady()) ? ` AND ${alias}.badge_locked = 0` : "";
}

export function badgeInfo(featuredUntil) {
  const until = featuredUntil ? new Date(featuredUntil) : null;
  const active = !!until && until.getTime() > Date.now();
  return { active, until: until ? until.toISOString() : null };
}

/** Add `days` to the badge (from its current end if still active, else from now). */
export async function extendBadge(conn, partnerId, days, { actorType, actorId = null, reason }) {
  await conn.query(
    `UPDATE partners
        SET featured_until = DATE_ADD(GREATEST(COALESCE(featured_until, NOW()), NOW()), INTERVAL ? DAY),
            featured_reminded_at = NULL
      WHERE id = ?`,
    [days, partnerId]
  );
  await logHistory(conn, { partnerId, action: "badge_added", reason, actorType, actorId });
  await syncBadgeLocks(conn, partnerId); // badge on → everything unlocked
  const [[p]] = await conn.query("SELECT featured_until FROM partners WHERE id = ?", [partnerId]);
  return p?.featured_until || null;
}

/**
 * A badge payment settled. Approved partners get the days now; anyone still
 * registering / under review gets them on approval (featured_pending_days).
 * Returns { until } or { pendingDays }.
 */
export async function creditBadgePayment(conn, partnerId, reason) {
  const [[p]] = await conn.query("SELECT status FROM partners WHERE id = ? FOR UPDATE", [partnerId]);
  if (p?.status !== "approved" && (await hasColumn("partners", "featured_pending_days"))) {
    await conn.query("UPDATE partners SET featured_pending_days = featured_pending_days + ? WHERE id = ?", [BADGE_DAYS, partnerId]);
    await logHistory(conn, { partnerId, action: "badge_paid", reason: `${reason} — starts on approval`, actorType: "system" });
    const [[r]] = await conn.query("SELECT featured_pending_days FROM partners WHERE id = ?", [partnerId]);
    return { pendingDays: Number(r.featured_pending_days) };
  }
  return { until: await extendBadge(conn, partnerId, BADGE_DAYS, { actorType: "system", reason }) };
}

/** On approval: start a badge that was paid during registration. */
export async function activatePendingBadge(conn, partnerId) {
  if (!(await hasColumn("partners", "featured_pending_days"))) return null;
  const [[p]] = await conn.query("SELECT featured_pending_days FROM partners WHERE id = ?", [partnerId]);
  const days = Number(p?.featured_pending_days || 0);
  if (days > 0) {
    await conn.query("UPDATE partners SET featured_pending_days = 0 WHERE id = ?", [partnerId]);
    return extendBadge(conn, partnerId, days, { actorType: "system", reason: `${days} days (paid during registration)` });
  }
  await syncBadgeLocks(conn, partnerId);
  return null;
}

/**
 * Apply (no badge) or clear (badge active) the free-plan locks. Keeps the
 * partner's current choice: the primary city, then whatever was already
 * unlocked, then the oldest. Returns how many items are locked.
 */
export async function syncBadgeLocks(conn, partnerId) {
  if (!(await locksReady())) return 0;
  const [[p]] = await conn.query("SELECT featured_until FROM partners WHERE id = ?", [partnerId]);
  if (!p) return 0;
  if (badgeInfo(p.featured_until).active) {
    await conn.query("UPDATE partner_service_areas SET badge_locked = 0 WHERE partner_id = ? AND badge_locked = 1", [partnerId]);
    await conn.query("UPDATE partner_categories SET badge_locked = 0 WHERE partner_id = ? AND badge_locked = 1", [partnerId]);
    await conn.query("UPDATE partner_brands SET badge_locked = 0 WHERE partner_id = ? AND badge_locked = 1", [partnerId]);
    await conn.query("UPDATE partners SET badge_limits_applied = 0 WHERE id = ?", [partnerId]);
    return 0;
  }

  let locked = 0;
  // Cities: every area row of the kept city stays; the primary city is kept.
  const [areas] = await conn.query(
    "SELECT city_id, MAX(is_primary) AS prim, MIN(badge_locked) AS lk, MIN(id) AS first FROM partner_service_areas WHERE partner_id = ? GROUP BY city_id ORDER BY prim DESC, lk ASC, first ASC",
    [partnerId]
  );
  const keepCities = areas.slice(0, FREE_LIMITS.cities).map((a) => a.city_id);
  if (areas.length) {
    await conn.query("UPDATE partner_service_areas SET badge_locked = IF(city_id IN (?), 0, 1) WHERE partner_id = ?", [
      keepCities.length ? keepCities : [0],
      partnerId,
    ]);
    locked += areas.length - keepCities.length;
  }

  const [cats] = await conn.query("SELECT category_id FROM partner_categories WHERE partner_id = ? ORDER BY badge_locked ASC, category_id ASC", [partnerId]);
  const keepCats = cats.slice(0, FREE_LIMITS.categories).map((c) => c.category_id);
  if (cats.length) {
    await conn.query("UPDATE partner_categories SET badge_locked = IF(category_id IN (?), 0, 1) WHERE partner_id = ?", [keepCats.length ? keepCats : [0], partnerId]);
    locked += cats.length - keepCats.length;
  }

  const [brands] = await conn.query("SELECT id, category_id FROM partner_brands WHERE partner_id = ? ORDER BY badge_locked ASC, id ASC", [partnerId]);
  const keepBrands = [];
  const perCat = {};
  for (const b of brands) {
    perCat[b.category_id] = (perCat[b.category_id] || 0) + 1;
    if (perCat[b.category_id] <= FREE_LIMITS.brandsPerCategory) keepBrands.push(b.id);
  }
  if (brands.length) {
    await conn.query("UPDATE partner_brands SET badge_locked = IF(id IN (?), 0, 1) WHERE partner_id = ?", [keepBrands.length ? keepBrands : [0], partnerId]);
    locked += brands.length - keepBrands.length;
  }

  await conn.query("UPDATE partners SET badge_limits_applied = 1 WHERE id = ?", [partnerId]);
  return locked;
}

/** Hidden (locked) items, for the dashboard. */
export async function lockedItems(partnerId) {
  if (!(await locksReady())) return null;
  const [[cities], [cats], [brands]] = await Promise.all([
    db.query(
      `SELECT DISTINCT a.city_id AS id, c.city_name AS name, MIN(a.badge_locked) AS locked
         FROM partner_service_areas a JOIN city_tb c ON c.id = a.city_id
        WHERE a.partner_id = ? GROUP BY a.city_id, c.city_name ORDER BY MAX(a.is_primary) DESC, MIN(a.id)`,
      [partnerId]
    ),
    db.query(
      `SELECT pc.category_id AS id, c.category_name AS name, pc.badge_locked AS locked
         FROM partner_categories pc JOIN category_tb c ON c.id = pc.category_id
        WHERE pc.partner_id = ? ORDER BY pc.badge_locked, pc.category_id`,
      [partnerId]
    ),
    db.query(
      `SELECT pb.id, pb.category_id, COALESCE(b.brand_name, pb.custom_name) AS name, pb.badge_locked AS locked
         FROM partner_brands pb LEFT JOIN brand_tb b ON b.id = pb.brand_id
        WHERE pb.partner_id = ? ORDER BY pb.badge_locked, pb.id`,
      [partnerId]
    ),
  ]);
  const norm = (rows) => rows.map((r) => ({ ...r, locked: !!Number(r.locked) }));
  const out = { cities: norm(cities), categories: norm(cats), brands: norm(brands) };
  out.count = [...out.cities, ...out.categories, ...out.brands].filter((x) => x.locked).length;
  return out;
}

/**
 * Partner (no badge) picks what stays active: { category_ids: [..≤2], brand_ids: [pb.id…, ≤2 per category] }.
 * The active city is the primary city (changed under Address & areas).
 */
export async function chooseActive(partnerId, { category_ids, brand_ids }) {
  if (!(await locksReady())) throw new HttpError(409, "not_ready", "Please try again later.");
  const cats = [...new Set((Array.isArray(category_ids) ? category_ids : []).map(Number))].filter((n) => Number.isInteger(n) && n > 0);
  const brandIds = [...new Set((Array.isArray(brand_ids) ? brand_ids : []).map(Number))].filter((n) => Number.isInteger(n) && n > 0);
  if (!cats.length || cats.length > FREE_LIMITS.categories) {
    throw new HttpError(422, "validation_error", `Choose 1 to ${FREE_LIMITS.categories} categories to keep active.`);
  }
  await withTransaction(async (conn) => {
    const [[p]] = await conn.query("SELECT featured_until FROM partners WHERE id = ? FOR UPDATE", [partnerId]);
    if (badgeInfo(p?.featured_until).active) throw new HttpError(409, "has_badge", "Your badge is active — everything is already live.");
    const [own] = await conn.query("SELECT category_id FROM partner_categories WHERE partner_id = ? AND category_id IN (?)", [partnerId, cats]);
    if (own.length !== cats.length) throw new HttpError(422, "validation_error", "Choose from your own categories.");
    const [ownBrands] = brandIds.length
      ? await conn.query("SELECT id, category_id FROM partner_brands WHERE partner_id = ? AND id IN (?)", [partnerId, brandIds])
      : [[]];
    if (ownBrands.length !== brandIds.length) throw new HttpError(422, "validation_error", "Choose from your own brands.");
    const per = {};
    for (const b of ownBrands) per[b.category_id] = (per[b.category_id] || 0) + 1;
    if (Object.values(per).some((n) => n > FREE_LIMITS.brandsPerCategory)) {
      throw new HttpError(422, "validation_error", `Keep at most ${FREE_LIMITS.brandsPerCategory} brands per category.`);
    }
    await conn.query("UPDATE partner_categories SET badge_locked = IF(category_id IN (?), 0, 1) WHERE partner_id = ?", [cats, partnerId]);
    await conn.query("UPDATE partner_brands SET badge_locked = IF(id IN (?), 0, 1) WHERE partner_id = ?", [brandIds.length ? brandIds : [0], partnerId]);
    await syncBadgeLocks(conn, partnerId); // fills free slots left empty, never exceeds limits
  });
}

const fmtDay = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });

/** Admin: give the badge for free. */
export async function adminGrantBadge(admin, partnerId, days) {
  const n = Number(days);
  if (!Number.isInteger(n) || n < 1 || n > 730) throw new HttpError(422, "validation_error", "Days must be a whole number from 1 to 730.");
  const until = await withTransaction(async (conn) => {
    const [[p]] = await conn.query("SELECT id, status FROM partners WHERE id = ? AND deleted_at IS NULL FOR UPDATE", [partnerId]);
    if (!p) throw new HttpError(404, "not_found", "Partner not found.");
    if (p.status !== "approved") throw new HttpError(409, "not_approved", "Only approved partners can get the badge.");
    return extendBadge(conn, partnerId, n, { actorType: "admin", actorId: admin.id, reason: `${n} days (given by admin)` });
  });
  await notifyPartner(
    partnerId,
    { type: "badge", title: `You're a ${BADGE_NAME}!`, body: `Your badge is active till ${fmtDay(until)}. You now appear first in your areas.`, link: "/partner/dashboard?tab=wallet" },
    { push: true }
  );
}

/** Admin: remove the badge now. */
export async function adminRevokeBadge(admin, partnerId, reason) {
  await withTransaction(async (conn) => {
    const [[p]] = await conn.query("SELECT id, featured_until FROM partners WHERE id = ? AND deleted_at IS NULL FOR UPDATE", [partnerId]);
    if (!p) throw new HttpError(404, "not_found", "Partner not found.");
    if (!badgeInfo(p.featured_until).active) throw new HttpError(409, "no_badge", "This partner has no active badge.");
    await conn.query("UPDATE partners SET featured_until = NULL, featured_reminded_at = NULL WHERE id = ?", [partnerId]);
    await logHistory(conn, {
      partnerId,
      action: "badge_removed",
      reason: String(reason || "").trim().slice(0, 500) || null,
      actorType: "admin",
      actorId: admin.id,
    });
    await syncBadgeLocks(conn, partnerId);
  });
}

/** Cron: remind partners whose badge ends within 7 days (once per period). */
export async function sendBadgeReminders() {
  if (!(await hasColumn("partners", "featured_until"))) return 0;
  const [rows] = await db.query(
    `SELECT id, featured_until FROM partners
      WHERE featured_until > NOW() AND featured_until <= NOW() + INTERVAL 7 DAY
        AND featured_reminded_at IS NULL AND deleted_at IS NULL
      LIMIT 100`
  );
  for (const p of rows) {
    const [r] = await db.query("UPDATE partners SET featured_reminded_at = NOW() WHERE id = ? AND featured_reminded_at IS NULL", [p.id]);
    if (!r.affectedRows) continue;
    await notifyPartner(
      p.id,
      {
        type: "badge",
        title: `Your ${BADGE_NAME} badge ends on ${fmtDay(p.featured_until)}`,
        body: `Renew for ₹${badgePrice()} to stay at the top and keep all your cities, categories and brands live.`,
        link: "/partner/dashboard?tab=wallet",
      },
      { push: true }
    );
  }
  return rows.length;
}

/** Cron: badge ended (or never bought) → lock everything above the free plan, once per period. */
export async function applyBadgeLimits() {
  if (!(await locksReady()) || !(await hasColumn("partners", "featured_until"))) return 0;
  const [rows] = await db.query(
    `SELECT id FROM partners
      WHERE badge_limits_applied = 0 AND (featured_until IS NULL OR featured_until <= NOW())
        AND status IN ('approved','suspended') AND deleted_at IS NULL
      LIMIT 100`
  );
  for (const { id } of rows) {
    const locked = await withTransaction((conn) => syncBadgeLocks(conn, id)).catch((e) => (console.error("[badge] limits", id, e?.message), 0));
    if (locked > 0) {
      await notifyPartner(
        id,
        {
          type: "badge",
          title: `${locked} of your service areas / categories / brands are hidden`,
          body: `The free plan shows ${FREE_LIMITS.cities} city, ${FREE_LIMITS.categories} categories and ${FREE_LIMITS.brandsPerCategory} brands per category. Get the ${BADGE_NAME} badge (₹${badgePrice()}) to show everything and appear first.`,
          link: "/partner/dashboard?tab=wallet",
        },
        { push: true }
      ).catch(() => {});
    }
  }
  return rows.length;
}
