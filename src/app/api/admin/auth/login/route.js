import { NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { signSession, sessionCookieOptions } from "@/lib/session";

// Runs on the Node runtime (scrypt + mysql2 are Node-only).
export const runtime = "nodejs";

export async function POST(request) {
  let connection;
  try {
    const { email, password } = await request.json();

    console.log("Login attempt:", email);
    console.log("Login attempt:", password);
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required." },
        { status: 400 }
      );
    }

    connection = await db.getConnection();
    const [rows] = await connection.query(
      `SELECT id, name, email, password, role, status
       FROM admin_users WHERE email = ? LIMIT 1`,
      [String(email).trim().toLowerCase()]
    );

    const user = rows[0];


    
    // Same generic message whether the email is unknown or the password is
    // wrong — never reveal which accounts exist.
    const invalid = NextResponse.json(
      { success: false, message: "Invalid email or password." },
      { status: 401 }
    );

    if (!user) return invalid;
    if (String(user.status) !== "1") {
      return NextResponse.json(
        { success: false, message: "This account is disabled. Contact a super admin." },
        { status: 403 }
      );
    }

    const ok = await verifyPassword(password, user.password);
    if (!ok) return invalid;

    const token = await signSession({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // best-effort last-login stamp; ignore if the column doesn't exist
    try {
      await connection.query(`UPDATE admin_users SET last_login = NOW() WHERE id = ?`, [user.id]);
    } catch {}

    const res = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
    const opts = sessionCookieOptions();
    res.cookies.set(opts.name, token, opts);

    return res;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
