import { NextResponse } from "next/server";
import db from "@/lib/db";

export const runtime = "nodejs";

// Admin side of contact_us_tb. The /api/admin prefix is session-gated in
// src/proxy.js, so no per-handler auth check is needed here.

const STATUSES = ["new", "read", "resolved"];
const SORTABLE = ["id", "name", "email", "phone", "status", "created_at"];

const fail = (message, status = 400) =>
  NextResponse.json({ success: false, message }, { status });

// ─────────────────────────────────────────────
// GET — paginated list + per-status counts
// ─────────────────────────────────────────────
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "25", 10)));
    const offset = (page - 1) * limit;

    const search = (searchParams.get("search") || "").trim();
    const statusFilter = (searchParams.get("status") || "").trim();

    let sortBy = searchParams.get("sortBy") || "id";
    if (!SORTABLE.includes(sortBy)) sortBy = "id";
    let sortDir = (searchParams.get("sortDir") || "DESC").toUpperCase();
    if (!["ASC", "DESC"].includes(sortDir)) sortDir = "DESC";

    const where = [];
    const params = [];
    if (search) {
      where.push("(name LIKE ? OR email LIKE ? OR phone LIKE ? OR subject LIKE ? OR message LIKE ?)");
      params.push(...Array(5).fill(`%${search}%`));
    }
    if (STATUSES.includes(statusFilter)) {
      where.push("status = ?");
      params.push(statusFilter);
    }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM contact_us_tb ${whereSql}`,
      params
    );
    const [rows] = await db.query(
      `SELECT * FROM contact_us_tb ${whereSql}
       ORDER BY ${sortBy} ${sortDir}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    const [countRows] = await db.query(
      "SELECT status, COUNT(*) AS n FROM contact_us_tb GROUP BY status"
    );
    const counts = { new: 0, read: 0, resolved: 0 };
    for (const r of countRows) counts[r.status] = Number(r.n);

    return NextResponse.json({
      success: true,
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      counts,
    });
  } catch (error) {
    return fail(error.message, 500);
  }
}

// ─────────────────────────────────────────────
// PUT — update status and/or admin note
// ─────────────────────────────────────────────
export async function PUT(request) {
  try {
    const { id, status, admin_note } = await request.json();
    if (!id) return fail("id is required.");

    const sets = [];
    const params = [];
    if (status !== undefined) {
      if (!STATUSES.includes(status)) return fail(`status must be one of: ${STATUSES.join(", ")}`);
      sets.push("status = ?");
      params.push(status);
    }
    if (admin_note !== undefined) {
      sets.push("admin_note = ?");
      params.push(String(admin_note).trim().slice(0, 500) || null);
    }
    if (!sets.length) return fail("Nothing to update.");

    const [result] = await db.query(
      `UPDATE contact_us_tb SET ${sets.join(", ")} WHERE id = ?`,
      [...params, id]
    );
    if (!result.affectedRows) return fail("Enquiry not found.", 404);
    return NextResponse.json({ success: true, message: "Enquiry updated." });
  } catch (error) {
    return fail(error.message, 500);
  }
}

// ─────────────────────────────────────────────
// DELETE — ?id=
// ─────────────────────────────────────────────
export async function DELETE(request) {
  try {
    const id = parseInt(new URL(request.url).searchParams.get("id") || "", 10);
    if (!id) return fail("id is required.");
    const [result] = await db.query("DELETE FROM contact_us_tb WHERE id = ?", [id]);
    if (!result.affectedRows) return fail("Enquiry not found.", 404);
    return NextResponse.json({ success: true, message: "Enquiry deleted." });
  } catch (error) {
    return fail(error.message, 500);
  }
}
