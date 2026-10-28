// Partner reviews: any OTP-verified customer may post one review per partner
// (re-posting edits it). Reviews are public immediately; an admin or the
// partner can remove them.

import db from "@/lib/db";
import { HttpError } from "@/lib/partners/http";
import { notifyPartner } from "@/lib/partners/notify";

const firstName = (n) => String(n || "Customer").trim().split(/\s+/)[0];

export async function getPublicReviews(partnerId, { limit = 20 } = {}) {
  const [[agg]] = await db.query(
    "SELECT COUNT(*) AS n, AVG(rating) AS avg FROM partner_reviews WHERE partner_id = ? AND status = 'published'",
    [partnerId]
  );
  const [rows] = await db.query(
    `SELECT r.id, r.rating, r.comment, r.reply, r.replied_at, r.created_at, r.updated_at, c.name, c.mobile
       FROM partner_reviews r JOIN site_customers c ON c.id = r.customer_id
      WHERE r.partner_id = ? AND r.status = 'published'
      ORDER BY r.id DESC LIMIT ${Math.min(Number(limit) || 20, 100)}`,
    [partnerId]
  );
  return {
    count: Number(agg.n),
    average: agg.n ? Math.round(Number(agg.avg) * 10) / 10 : null,
    // Only a first name and the last 2 digits are public.
    items: rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      reply: r.reply,
      replied_at: r.replied_at,
      author: `${firstName(r.name)} (••${r.mobile.slice(-2)})`,
      created_at: r.created_at,
      edited: +new Date(r.updated_at) - +new Date(r.created_at) > 60_000,
    })),
  };
}

/** Rating summaries for many partners at once (listing cards). */
export async function getRatingSummaries(partnerIds) {
  if (!partnerIds.length) return new Map();
  const [rows] = await db.query(
    `SELECT partner_id, COUNT(*) AS n, AVG(rating) AS avg FROM partner_reviews
      WHERE partner_id IN (?) AND status = 'published' GROUP BY partner_id`,
    [partnerIds]
  );
  return new Map(rows.map((r) => [r.partner_id, { count: Number(r.n), average: Math.round(Number(r.avg) * 10) / 10 }]));
}

export async function upsertReview(customer, partnerSlug, { rating, comment }) {
  const stars = Number(rating);
  if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
    throw new HttpError(422, "validation_error", "Choose a rating from 1 to 5 stars.", { rating: "Required." });
  }
  const text = String(comment ?? "").replace(/\s+\n/g, "\n").trim().slice(0, 1000);
  const [[p]] = await db.query(
    "SELECT id FROM partners WHERE slug = ? AND status = 'approved' AND is_listed = 1 AND deleted_at IS NULL",
    [String(partnerSlug || "")]
  );
  if (!p) throw new HttpError(404, "not_found", "Partner not found.");

  // A removed review stays removed; the customer can't silently re-publish it.
  const [[existing]] = await db.query("SELECT status FROM partner_reviews WHERE partner_id = ? AND customer_id = ?", [p.id, customer.id]);
  if (existing?.status === "removed") {
    throw new HttpError(409, "review_removed", "Your earlier review for this partner was removed and can't be re-posted.");
  }
  await db.query(
    `INSERT INTO partner_reviews (partner_id, customer_id, rating, comment) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)`,
    [p.id, customer.id, stars, text]
  );
  if (!existing) {
    await notifyPartner(p.id, {
      type: "review",
      title: `New ${stars}★ review from ${firstName(customer.name)}`,
      body: text.slice(0, 200),
      link: "/partner/dashboard?tab=reviews",
    });
  }
  return getPublicReviews(p.id);
}

export async function getOwnReview(customerId, partnerSlug) {
  const [[r]] = await db.query(
    `SELECT r.rating, r.comment, r.status FROM partner_reviews r JOIN partners p ON p.id = r.partner_id
      WHERE p.slug = ? AND r.customer_id = ?`,
    [String(partnerSlug || ""), customerId]
  );
  return r || null;
}

/** by: { type: "admin" | "partner", id, partnerId? } — partners only their own. */
export async function removeReview(reviewId, by) {
  const params = [by.type, by.id, reviewId];
  let scope = "";
  if (by.type === "partner") {
    scope = " AND partner_id = ?";
    params.push(by.partnerId);
  }
  const [r] = await db.query(
    `UPDATE partner_reviews SET status = 'removed', removed_by = ?, removed_by_id = ?, removed_at = NOW()
      WHERE id = ? AND status = 'published'${scope}`,
    params
  );
  if (!r.affectedRows) throw new HttpError(404, "not_found", "Review not found.");
}

/** All reviews (incl. removed) for the partner dashboard / admin. */
export async function listReviewsForOwner(partnerId) {
  const [rows] = await db.query(
    `SELECT r.id, r.rating, r.comment, r.reply, r.replied_at, r.status, r.removed_by, r.created_at, c.name
       FROM partner_reviews r JOIN site_customers c ON c.id = r.customer_id
      WHERE r.partner_id = ? ORDER BY r.id DESC LIMIT 200`,
    [partnerId]
  );
  return rows.map((r) => ({ ...r, author: firstName(r.name) }));
}

/** Partner's public reply on a review of their own profile ("" removes it). */
export async function replyToReview(partnerId, reviewId, text) {
  const reply = String(text ?? "").trim().slice(0, 1000);
  const [r] = await db.query(
    "UPDATE partner_reviews SET reply = ?, replied_at = IF(? IS NULL, NULL, NOW()), updated_at = updated_at WHERE id = ? AND partner_id = ? AND status = 'published'",
    [reply || null, reply || null, reviewId, partnerId]
  );
  if (!r.affectedRows) throw new HttpError(404, "not_found", "Review not found.");
}
