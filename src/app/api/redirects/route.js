import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";

// The `?lookup=` GET is called by middleware (no session) and is read-only.
// Everything else (admin list + create/update/delete) requires a session.
async function requireAuth(request) {
  const session = await getSession(request);
  if (!session)
    return NextResponse.json(
      { success: false, message: "Authentication required." },
      { status: 401 }
    );
  return null;
}

const ALLOWED_TYPES = [301, 302, 410, 404];

const SORTABLE = [
  "id",
  "source_url",
  "redirect_url",
  "redirect_type",
  "status",
  "created_at",
  "updated_at",
];

// ─────────────────────────────────────────────
// GET
// ?lookup=/some/path          → used by middleware (single row, fast)
// ?page=&limit=&search=&...   → used by admin panel (paginated list)
// ─────────────────────────────────────────────
export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    connection = await db.getConnection();

    // ── fast single-row lookup for middleware ──
    const lookup = searchParams.get("lookup");
    if (lookup) {
      const [rows] = await connection.query(
        `SELECT id, source_url, redirect_url, redirect_type
         FROM redirects_tb
         WHERE source_url = ? AND status = 1
         LIMIT 1`,
        [lookup]
      );
      return NextResponse.json({
        success: true,
        redirect: rows[0] || null,
      });
    }

    // ── paginated admin list ──
    const authErr = await requireAuth(request);
    if (authErr) return authErr;

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "25", 10))
    );
    const offset = (page - 1) * limit;

    const search = (searchParams.get("search") || "").trim();
    const statusFilter = (searchParams.get("status") || "").trim();
    const typeFilter = (searchParams.get("redirect_type") || "").trim();

    let sortBy = searchParams.get("sortBy") || "id";
    if (!SORTABLE.includes(sortBy)) sortBy = "id";
    let sortDir = (searchParams.get("sortDir") || "DESC").toUpperCase();
    if (!["ASC", "DESC"].includes(sortDir)) sortDir = "DESC";

    const where = [];
    const params = [];

    if (search) {
      where.push("(source_url LIKE ? OR redirect_url LIKE ? OR note LIKE ?)");
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (statusFilter === "0" || statusFilter === "1") {
      where.push("status = ?");
      params.push(statusFilter);
    }
    if (typeFilter && ALLOWED_TYPES.includes(parseInt(typeFilter))) {
      where.push("redirect_type = ?");
      params.push(parseInt(typeFilter));
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total FROM redirects_tb ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await connection.query(
      `SELECT * FROM redirects_tb ${whereSql}
       ORDER BY ${sortBy} ${sortDir}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return NextResponse.json({
      success: true,
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

// ─────────────────────────────────────────────
// POST — create
// ─────────────────────────────────────────────
export async function POST(request) {
  const authErr = await requireAuth(request);
  if (authErr) return authErr;
  let connection;
  try {
    const body = await request.json();
    const { source_url, redirect_url, redirect_type, status, note } = body;

    // ── validation ──
    if (!source_url || !source_url.trim()) {
      return NextResponse.json(
        { success: false, message: "Source URL is required." },
        { status: 400 }
      );
    }

    const type = parseInt(redirect_type, 10);
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          message: `redirect_type must be one of: ${ALLOWED_TYPES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 301/302 need a destination; 404/410 do not
    if ((type === 301 || type === 302) && !redirect_url?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Redirect URL is required for 301 and 302 redirects.",
        },
        { status: 400 }
      );
    }

    // normalise: always store with leading slash, no trailing slash, lowercase
    const normSource = normaliseUrl(source_url);
    const normDest =
      redirect_url?.trim() ? normaliseUrl(redirect_url) : null;

    connection = await db.getConnection();

    // ── duplicate check ──
    const [existing] = await connection.query(
      `SELECT id FROM redirects_tb WHERE source_url = ? LIMIT 1`,
      [normSource]
    );
    if (existing.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `A redirect for "${normSource}" already exists (ID: ${existing[0].id}). Edit it instead.`,
        },
        { status: 409 }
      );
    }

    const [result] = await connection.query(
      `INSERT INTO redirects_tb
        (source_url, redirect_url, redirect_type, status, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        normSource,
        normDest,
        type,
        status === "0" || status === 0 ? 0 : 1,
        note?.trim() || null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Redirect created successfully.",
        id: result.insertId,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

// ─────────────────────────────────────────────
// PUT — update
// ─────────────────────────────────────────────
export async function PUT(request) {
  const authErr = await requireAuth(request);
  if (authErr) return authErr;
  let connection;
  try {
    const body = await request.json();
    const { id, source_url, redirect_url, redirect_type, status, note } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing id." },
        { status: 400 }
      );
    }
    if (!source_url?.trim()) {
      return NextResponse.json(
        { success: false, message: "Source URL is required." },
        { status: 400 }
      );
    }

    const type = parseInt(redirect_type, 10);
    if (!ALLOWED_TYPES.includes(type)) {
      return NextResponse.json(
        { success: false, message: `redirect_type must be one of: ${ALLOWED_TYPES.join(", ")}` },
        { status: 400 }
      );
    }
    if ((type === 301 || type === 302) && !redirect_url?.trim()) {
      return NextResponse.json(
        { success: false, message: "Redirect URL is required for 301 and 302 redirects." },
        { status: 400 }
      );
    }

    const normSource = normaliseUrl(source_url);
    const normDest = redirect_url?.trim() ? normaliseUrl(redirect_url) : null;

    connection = await db.getConnection();

    // duplicate check excluding self
    const [dup] = await connection.query(
      `SELECT id FROM redirects_tb WHERE source_url = ? AND id <> ? LIMIT 1`,
      [normSource, id]
    );
    if (dup.length) {
      return NextResponse.json(
        {
          success: false,
          message: `Another redirect already uses source URL "${normSource}" (ID: ${dup[0].id}).`,
        },
        { status: 409 }
      );
    }

    await connection.query(
      `UPDATE redirects_tb
       SET source_url=?, redirect_url=?, redirect_type=?, status=?, note=?, updated_at=NOW()
       WHERE id=?`,
      [
        normSource,
        normDest,
        type,
        status === "0" || status === 0 ? 0 : 1,
        note?.trim() || null,
        id,
      ]
    );

    return NextResponse.json({ success: true, message: "Redirect updated successfully." });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

// ─────────────────────────────────────────────
// DELETE — ?id=
// ─────────────────────────────────────────────
export async function DELETE(request) {
  const authErr = await requireAuth(request);
  if (authErr) return authErr;
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0", 10);
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing id." },
        { status: 400 }
      );
    }
    connection = await db.getConnection();
    await connection.query(`DELETE FROM redirects_tb WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, message: "Redirect deleted." });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────
function normaliseUrl(url = "") {
  let u = url.trim().toLowerCase();
  // ensure leading slash for relative URLs
  if (!u.startsWith("http") && !u.startsWith("/")) u = "/" + u;
  // strip trailing slash (unless it's just "/")
  if (u.length > 1 && u.endsWith("/")) u = u.slice(0, -1);
  return u;
}