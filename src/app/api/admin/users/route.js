import { NextResponse } from "next/server";
import db from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { getSession } from "@/lib/session";
import { TEAMS, parseModules } from "@/lib/adminAccess";

export const runtime = "nodejs";

const ROLES = ["super_admin", "admin"];

// Adapt to whatever columns the admin_users table actually has, so the
// feature works whether the timestamp column is `created_at` or `create_at`,
// and whether `last_login` exists at all.
let _adminCols = null;
async function getAdminColumns(connection) {
  if (_adminCols) return _adminCols;
  const [cols] = await connection.query(`SHOW COLUMNS FROM admin_users`);
  _adminCols = new Set(cols.map((c) => c.Field));
  return _adminCols;
}
function createdColumn(cols) {
  return cols.has("created_at") ? "created_at" : cols.has("create_at") ? "create_at" : null;
}

// Only a signed-in super admin may touch this resource.
async function requireSuperAdmin(request) {
  const session = await getSession(request);
  if (!session) return { error: NextResponse.json({ success: false, message: "Not authenticated." }, { status: 401 }) };
  if (session.role !== "super_admin")
    return { error: NextResponse.json({ success: false, message: "Super admin access required." }, { status: 403 }) };
  return { session };
}

// Team label + section list. Super admins always see everything → stored as NULL.
// Returns [] when the access columns don't exist yet (migration not run).
function accessColumns(cols, role, body) {
  if (!cols.has("modules") || !cols.has("team")) return [];
  if (role === "super_admin") return [["team", null], ["modules", null]];
  const team = TEAMS[body.team] ? body.team : null;
  const modules = parseModules(Array.isArray(body.modules) ? body.modules : TEAMS[team]?.modules || []);
  return [["team", team], ["modules", modules.join(",")]];
}

const isEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

// ── LIST ──────────────────────────────────────────────────────────────
export async function GET(request) {
  const guard = await requireSuperAdmin(request);
  if (guard.error) return guard.error;

  let connection;
  try {
    connection = await db.getConnection();
    const cols = await getAdminColumns(connection);
    const createdCol = createdColumn(cols);
    const createdSel = createdCol ? `${createdCol} AS created_at` : "NULL AS created_at";
    const lastLoginSel = cols.has("last_login") ? "last_login" : "NULL AS last_login";
    const accessSel = cols.has("modules") && cols.has("team") ? "team, modules" : "NULL AS team, NULL AS modules";
    const [rows] = await connection.query(
      `SELECT id, name, email, role, status, ${accessSel}, ${createdSel}, ${lastLoginSel}
       FROM admin_users ORDER BY id ASC`
    );
    const data = rows.map((r) => ({ ...r, modules: parseModules(r.modules) })); // null = all sections
    return NextResponse.json({ success: true, data, total: rows.length });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// ── CREATE ────────────────────────────────────────────────────────────
export async function POST(request) {
  const guard = await requireSuperAdmin(request);
  if (guard.error) return guard.error;

  let connection;
  try {
    const body = await request.json();
    const name = (body.name || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const role = ROLES.includes(body.role) ? body.role : "admin";
    const password = body.password || "";

    if (!name) return NextResponse.json({ success: false, message: "Name is required." }, { status: 400 });
    if (!isEmail(email)) return NextResponse.json({ success: false, message: "A valid email is required." }, { status: 400 });
    if (password.length < 8)
      return NextResponse.json({ success: false, message: "Password must be at least 8 characters." }, { status: 400 });

    connection = await db.getConnection();
    const [dup] = await connection.query(`SELECT id FROM admin_users WHERE email = ? LIMIT 1`, [email]);
    if (dup.length)
      return NextResponse.json({ success: false, message: "An admin with this email already exists." }, { status: 409 });

    const hash = await hashPassword(password);
    const cols = await getAdminColumns(connection);
    const createdCol = createdColumn(cols);
    const access = accessColumns(cols, role, body);
    const extraCol = (createdCol ? `, ${createdCol}` : "") + access.map(([c]) => `, ${c}`).join("");
    const extraVal = (createdCol ? `, NOW()` : "") + access.map(() => ", ?").join("");
    const [result] = await connection.query(
      `INSERT INTO admin_users (name, email, password, role, status${extraCol})
       VALUES (?, ?, ?, ?, '1'${extraVal})`,
      [name, email, hash, role, ...access.map(([, v]) => v)]
    );

    return NextResponse.json(
      { success: true, message: "Admin created.", id: result.insertId },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// ── UPDATE (role / status / optional password reset) ────────────────────
export async function PUT(request) {
  const guard = await requireSuperAdmin(request);
  if (guard.error) return guard.error;

  let connection;
  try {
    const body = await request.json();
    const id = parseInt(body.id, 10);
    if (!id) return NextResponse.json({ success: false, message: "Missing id." }, { status: 400 });

    connection = await db.getConnection();
    const [rows] = await connection.query(`SELECT id, role, status FROM admin_users WHERE id = ? LIMIT 1`, [id]);
    const target = rows[0];
    if (!target) return NextResponse.json({ success: false, message: "Admin not found." }, { status: 404 });

    const sets = [];
    const params = [];

    if (body.name !== undefined && String(body.name).trim()) {
      sets.push("name = ?");
      params.push(String(body.name).trim());
    }
    if (body.role !== undefined && ROLES.includes(body.role)) {
      // never strip the last remaining super admin
      if (target.role === "super_admin" && body.role !== "super_admin") {
        const [supers] = await connection.query(
          `SELECT COUNT(*) AS n FROM admin_users WHERE role='super_admin' AND status='1'`
        );
        if (supers[0].n <= 1)
          return NextResponse.json(
            { success: false, message: "Cannot demote the last active super admin." },
            { status: 409 }
          );
      }
      sets.push("role = ?");
      params.push(body.role);
    }
    if (body.status !== undefined) {
      const status = body.status === "0" || body.status === 0 ? "0" : "1";
      if (target.role === "super_admin" && status === "0") {
        const [supers] = await connection.query(
          `SELECT COUNT(*) AS n FROM admin_users WHERE role='super_admin' AND status='1'`
        );
        if (supers[0].n <= 1)
          return NextResponse.json(
            { success: false, message: "Cannot disable the last active super admin." },
            { status: 409 }
          );
      }
      sets.push("status = ?");
      params.push(status);
    }
    // Team / sections: sent together from the Manage dialog.
    if (body.team !== undefined || body.modules !== undefined || body.role === "super_admin") {
      const role = ROLES.includes(body.role) ? body.role : target.role;
      for (const [col, val] of accessColumns(await getAdminColumns(connection), role, body)) {
        sets.push(`${col} = ?`);
        params.push(val);
      }
    }
    if (body.password) {
      if (String(body.password).length < 8)
        return NextResponse.json({ success: false, message: "Password must be at least 8 characters." }, { status: 400 });
      sets.push("password = ?");
      params.push(await hashPassword(body.password));
    }

    if (!sets.length)
      return NextResponse.json({ success: false, message: "Nothing to update." }, { status: 400 });

    await connection.query(`UPDATE admin_users SET ${sets.join(", ")} WHERE id = ?`, [...params, id]);
    return NextResponse.json({ success: true, message: "Admin updated." });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}

// ── DELETE ──────────────────────────────────────────────────────────────
export async function DELETE(request) {
  const guard = await requireSuperAdmin(request);
  if (guard.error) return guard.error;

  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const id = parseInt(searchParams.get("id") || "0", 10);
    if (!id) return NextResponse.json({ success: false, message: "Missing id." }, { status: 400 });

    if (id === Number(guard.session.sub))
      return NextResponse.json({ success: false, message: "You cannot delete your own account." }, { status: 409 });

    connection = await db.getConnection();
    const [rows] = await connection.query(`SELECT role FROM admin_users WHERE id = ? LIMIT 1`, [id]);
    const target = rows[0];
    if (!target) return NextResponse.json({ success: false, message: "Admin not found." }, { status: 404 });

    if (target.role === "super_admin") {
      const [supers] = await connection.query(
        `SELECT COUNT(*) AS n FROM admin_users WHERE role='super_admin' AND status='1'`
      );
      if (supers[0].n <= 1)
        return NextResponse.json(
          { success: false, message: "Cannot delete the last active super admin." },
          { status: 409 }
        );
    }

    await connection.query(`DELETE FROM admin_users WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, message: "Admin deleted." });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  } finally {
    if (connection) connection.release();
  }
}
