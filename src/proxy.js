import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/**
 * One middleware, two jobs:
 *
 *  1. Admin gate — every /admin page (except /admin/login) requires a valid
 *     signed session cookie. Unauthenticated hits bounce to the login page.
 *
 *  2. Redirect engine — for normal public paths we ask the redirects API
 *     (its fast `?lookup=` endpoint) whether a 301/302/410/404 rule applies,
 *     and honour it. This is what actually "switches on" the redirects table.
 */

const ADMIN_PREFIX = "/admin";
const LOGIN_PATH = "/admin/login";
const API_ADMIN_PREFIX = "/api/admin";
// Endpoints under /api/admin that must stay reachable without a session.
const API_PUBLIC = new Set(["/api/admin/auth/login"]);

// Mirror the normalisation used when redirects are stored
// (lowercase, leading slash, no trailing slash).
function normalisePath(pathname) {
  let u = pathname.toLowerCase();
  if (!u.startsWith("/")) u = "/" + u;
  if (u.length > 1 && u.endsWith("/")) u = u.slice(0, -1);
  return u;
}

const json401 = () =>
  new NextResponse(
    JSON.stringify({ success: false, message: "Authentication required." }),
    { status: 401, headers: { "content-type": "application/json" } }
  );

export async function proxy(req) {
  const { pathname, search, origin } = req.nextUrl;

  /* ── 0. Protect the admin data APIs ────────────────────────── */
  if (pathname.startsWith(API_ADMIN_PREFIX)) {
    if (API_PUBLIC.has(pathname)) return NextResponse.next();
    const session = await getSession(req);
    if (!session) return json401();
    return NextResponse.next();
  }

  /* ── 1. Admin authentication (pages) ───────────────────────── */
  if (pathname === ADMIN_PREFIX || pathname.startsWith(ADMIN_PREFIX + "/")) {
    const session = await getSession(req);

    if (pathname === LOGIN_PATH) {
      // already signed in? skip the login screen
      if (session) return NextResponse.redirect(new URL(ADMIN_PREFIX, req.url));
      return NextResponse.next();
    }

    if (!session) {
      const url = new URL(LOGIN_PATH, req.url);
      url.searchParams.set("next", pathname + (search || ""));
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  /* ── 2. Redirect rules for public paths ────────────────────── */
  if (req.method !== "GET") return NextResponse.next();

  const source = normalisePath(pathname);
  if (source === "/" ) return NextResponse.next();

  try {
    const lookupUrl = `${origin}/api/redirects?lookup=${encodeURIComponent(source)}`;
    const res = await fetch(lookupUrl, { headers: { "x-mw": "1" } });
    if (!res.ok) return NextResponse.next();

    const { redirect } = await res.json();
    if (!redirect) return NextResponse.next();

    const type = Number(redirect.redirect_type);

    if (type === 301 || type === 302) {
      let dest = redirect.redirect_url;
      if (!dest) return NextResponse.next();
      // relative destinations resolve against the current origin
      const target = dest.startsWith("http") ? dest : new URL(dest, req.url).toString();
      // guard against a rule that points back at itself
      if (normalisePath(new URL(target, req.url).pathname) === source && target.startsWith(origin)) {
        return NextResponse.next();
      }
      return NextResponse.redirect(target, type);
    }

    if (type === 410) {
      return new NextResponse("410 Gone — this page has been permanently removed.", {
        status: 410,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }

    if (type === 404) {
      return new NextResponse("404 Not Found", {
        status: 404,
        headers: { "content-type": "text/plain; charset=utf-8" },
      });
    }
  } catch {
    // never let a redirect-lookup failure take the whole site down
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  // Run on /api/admin (auth gate) + everything except Next internals,
  // the rest of /api, and static asset files (redirect engine).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|assets|.*\\..*).*)",
    "/api/admin/:path*",
  ],
};
