// api/admin/other_cities
//
// CRUD for the "Other Cities" links rendered on the homepage.
//
//   GET                 -> all links, admin order
//   POST                -> create
//   PUT    { id, ... }  -> update
//   DELETE ?id=         -> remove
//
// The rendered href is built by normalizeLinkUrl(), which only lets through
// internal paths and http(s) URLs.

import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import { normalizeLinkUrl } from "@/lib/otherCityLinks";

export const runtime = "nodejs";

const bad = (message, status = 400, extra = {}) =>
  NextResponse.json({ success: false, message, ...extra }, { status });

async function guard(request) {
  const session = await getSession(request);
  return session ? null : bad("Not authenticated.", 401);
}

/** Shared validation for create and update. */
function readBody(body) {
  const title = (body.title || "").trim();
  const url = normalizeLinkUrl(body.url);
  const errors = {};
  if (!title) errors.title = "Title is required.";
  if (!body.url || !String(body.url).trim()) errors.url = "URL is required.";
  else if (!url) errors.url = "Use an internal path like /gurgaon/ac, or a full https:// URL.";
  return {
    errors,
    row: {
      title,
      url,
      sort_order: Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0,
      status: body.status === "0" ? "0" : "1",
    },
  };
}

export async function GET(request) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    const [rows] = await db.query(
      `SELECT id, title, url, sort_order, status, created_at, updated_at
         FROM other_city_links_tb
        ORDER BY sort_order ASC, title ASC`
    );
    return NextResponse.json({ success: true, links: rows });
  } catch (error) {
    return bad(error.message, 500);
  }
}

export async function POST(request) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    const { errors, row } = readBody(await request.json());
    if (Object.keys(errors).length) return bad("Validation failed.", 422, { errors });

    const [res] = await db.query(
      `INSERT INTO other_city_links_tb (title, url, sort_order, status) VALUES (?, ?, ?, ?)`,
      [row.title, row.url, row.sort_order, row.status]
    );
    return NextResponse.json({ success: true, id: res.insertId, message: "Link added." });
  } catch (error) {
    return bad(error.message, 500);
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
      `UPDATE other_city_links_tb SET title = ?, url = ?, sort_order = ?, status = ? WHERE id = ?`,
      [row.title, row.url, row.sort_order, row.status, id]
    );
    if (!res.affectedRows) return bad("Link not found.", 404);
    return NextResponse.json({ success: true, message: "Link updated." });
  } catch (error) {
    return bad(error.message, 500);
  }
}

export async function DELETE(request) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!id) return bad("Missing id.");
    const [res] = await db.query(`DELETE FROM other_city_links_tb WHERE id = ?`, [id]);
    if (!res.affectedRows) return bad("Link not found.", 404);
    return NextResponse.json({ success: true, message: "Link deleted." });
  } catch (error) {
    return bad(error.message, 500);
  }
}
