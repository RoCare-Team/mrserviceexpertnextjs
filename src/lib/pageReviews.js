// Customer reviews for service pages (table page_reviews, migration 013).
// Managed per exact URL from /admin/page_reviews.

import db from "@/lib/db";

/**
 * "https://www.mrserviceexpert.com/Delhi/AC/?x=1" | "/delhi/ac" → "delhi/ac".
 * Only internal page paths are accepted; anything else returns "".
 */
export function normalizePageUrl(input) {
  let s = String(input || "").trim();
  if (!s) return "";
  s = s.replace(/^https?:\/\/[^/]+/i, "");
  s = s.split(/[?#]/)[0];
  s = s.toLowerCase().replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
  return /^[a-z0-9-]+(\/[a-z0-9-]+){0,3}$/.test(s) ? s : "";
}

/** Active reviews for one page, admin order. [] if none or before migration 013. */
export async function getPageReviews(path) {
  const url = normalizePageUrl(path);
  if (!url) return [];
  try {
    const [rows] = await db.query(
      `SELECT id, customer_name, customer_city, rating, review_text, review_date
         FROM page_reviews
        WHERE page_url = ? AND status = '1'
        ORDER BY sort_order ASC, review_date DESC, id DESC
        LIMIT 30`,
      [url]
    );
    return rows.map((r) => ({
      name: r.customer_name,
      city: r.customer_city || "",
      rating: Math.min(5, Math.max(1, Number(r.rating) || 5)),
      text: r.review_text,
      date: r.review_date ? new Date(r.review_date).toISOString().slice(0, 10) : null,
    }));
  } catch (err) {
    if (err?.code === "ER_NO_SUCH_TABLE") return [];
    console.error("[page-reviews]", err?.message);
    return [];
  }
}
