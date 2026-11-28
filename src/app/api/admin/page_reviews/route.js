// api/admin/page_reviews — customer reviews per service page URL.
//
//   GET    ?url=delhi/ac (optional) -> reviews (all, or for that page) + per-page counts
//   POST                            -> create
//   PUT    { id, ... }              -> update
//   DELETE ?id=                     -> remove

import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { normalizePageUrl } from "@/lib/pageReviews";

export const runtime = "nodejs";

const bad = (message, status = 400, extra = {}) =>
  NextResponse.json({ success: false, message, ...extra }, { status });

async function guard(request) {
  const session = await getSession(request);
  return session ? null : bad("Not authenticated.", 401);
}

const dbError = (error) =>
  error?.code === "ER_NO_SUCH_TABLE"
    ? bad("Reviews table is missing. Run: node scripts/run-migrations.mjs --commit", 503)
    : bad(error.message, 500);

function readBody(body) {
  const page_url = normalizePageUrl(body.page_url);
  const customer_name = String(body.customer_name || "").trim().slice(0, 100);
  const customer_city = String(body.customer_city || "").trim().slice(0, 100) || null;
  const review_text = String(body.review_text || "").trim().slice(0, 2000);
  const rating = Number(body.rating);
  const date = String(body.review_date || "").trim();
  const errors = {};
  const parts = page_url ? page_url.split("/").length : 0;
  if (parts < 2 || parts > 3) errors.page_url = "Use a service page URL: /city/category (e.g. /delhi/ac) or /city/brand/category (e.g. /delhi/samsung/ac).";
  if (!customer_name) errors.customer_name = "Customer name is required.";
  if (review_text.length < 10) errors.review_text = "Write at least 10 characters.";
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = "Rating must be 1 to 5.";
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.review_date = "Use a valid date.";
  return {
    errors,
    row: {
      page_url,
      customer_name,
      customer_city,
      rating,
      review_text,
      review_date: date || null,
      status: body.status === "0" || body.status === 0 ? "0" : "1",
      sort_order: Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0,
    },
  };
}

export async function GET(request) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    const raw = new URL(request.url).searchParams.get("url");
    const url = raw ? normalizePageUrl(raw) : "";
    const [reviews] = await db.query(
      `SELECT id, page_url, customer_name, customer_city, rating, review_text,
              DATE_FORMAT(review_date, '%Y-%m-%d') AS review_date, status, sort_order, created_at
         FROM page_reviews
        ${url ? "WHERE page_url = ?" : ""}
        ORDER BY page_url ASC, sort_order ASC, id DESC
        LIMIT 1000`,
      url ? [url] : []
    );
    const [pages] = await db.query(
      `SELECT page_url, COUNT(*) AS total, SUM(status = '1') AS active
         FROM page_reviews GROUP BY page_url ORDER BY page_url ASC`
    );
    return NextResponse.json({ success: true, reviews, pages });
  } catch (error) {
    return dbError(error);
  }
}

export async function POST(request) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    const { errors, row } = readBody(await request.json());
    if (Object.keys(errors).length) return bad("Validation failed.", 422, { errors });
    const [res] = await db.query(
      `INSERT INTO page_reviews (page_url, customer_name, customer_city, rating, review_text, review_date, status, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [row.page_url, row.customer_name, row.customer_city, row.rating, row.review_text, row.review_date, row.status, row.sort_order]
    );
    return NextResponse.json({ success: true, id: res.insertId, message: "Review added." });
  } catch (error) {
    return dbError(error);
  }
}

export async function PUT(request) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const id = Number(body.id);
    if (!id) return bad("Missing id.");
    const { errors, row } = readBody(body);
    if (Object.keys(errors).length) return bad("Validation failed.", 422, { errors });
    const [res] = await db.query(
      `UPDATE page_reviews SET page_url = ?, customer_name = ?, customer_city = ?, rating = ?, review_text = ?,
              review_date = ?, status = ?, sort_order = ? WHERE id = ?`,
      [row.page_url, row.customer_name, row.customer_city, row.rating, row.review_text, row.review_date, row.status, row.sort_order, id]
    );
    if (!res.affectedRows) return bad("Review not found.", 404);
    return NextResponse.json({ success: true, message: "Review updated." });
  } catch (error) {
    return dbError(error);
  }
}

export async function DELETE(request) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!id) return bad("Missing id.");
    const [res] = await db.query(`DELETE FROM page_reviews WHERE id = ?`, [id]);
    if (!res.affectedRows) return bad("Review not found.", 404);
    return NextResponse.json({ success: true, message: "Review deleted." });
  } catch (error) {
    return dbError(error);
  }
}
