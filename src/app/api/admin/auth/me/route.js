import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession, signSession, sessionCookieOptions } from "@/lib/session";
import { parseModules, sessionModules } from "@/lib/adminAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Current admin. Also re-reads the account from the database and re-issues
 * the session cookie (same expiry), so role / section changes made by a super
 * admin — or disabling the account — take effect on the next page load.
 */
export async function GET(request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ success: false, message: "Not authenticated." }, { status: 401 });
  }

  let fresh = session;
  let reissue = false;
  try {
    const [[u]] = await db.query("SELECT * FROM admin_users WHERE id = ? LIMIT 1", [session.sub]);
    if (!u || String(u.status) !== "1") {
      const res = NextResponse.json({ success: false, message: "This account is disabled." }, { status: 401 });
      const opts = sessionCookieOptions(0);
      res.cookies.set(opts.name, "", opts);
      return res;
    }
    fresh = {
      sub: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      team: u.team || null,
      modules: parseModules(u.modules),
    };
    const was = JSON.stringify([session.role, session.team ?? null, session.modules ?? null, session.name]);
    reissue = was !== JSON.stringify([fresh.role, fresh.team, fresh.modules, fresh.name]);
  } catch (err) {
    // DB unreachable: fall back to what the signed token says.
    console.error("[admin/me]", err?.message);
  }

  const res = NextResponse.json({
    success: true,
    user: {
      id: fresh.sub,
      name: fresh.name,
      email: fresh.email,
      role: fresh.role,
      team: fresh.team ?? null,
      modules: sessionModules(fresh),
    },
  });
  const ttl = Math.floor(Number(session.exp) - Date.now() / 1000);
  if (reissue && ttl > 60) {
    const opts = sessionCookieOptions(ttl);
    res.cookies.set(opts.name, await signSession(fresh, ttl), opts);
  }
  return res;
}
