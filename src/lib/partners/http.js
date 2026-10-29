// Shared helpers for the partner / admin-partner route handlers:
// response contract, origin check, client IP, a small in-process rate limiter
// and the admin-session guard.

import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const NO_STORE = { "Cache-Control": "private, no-store" };

/** { success: true, data } — private responses are never cached. */
export function ok(data = null, init = {}) {
  return NextResponse.json(
    { success: true, data },
    { ...init, headers: { ...NO_STORE, ...(init.headers || {}) } }
  );
}

/** { success: false, error: { code, message, fields? } } */
export function fail(status, code, message, fields) {
  return NextResponse.json(
    { success: false, error: { code, message, ...(fields ? { fields } : {}) } },
    { status, headers: NO_STORE }
  );
}

export class HttpError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

/** Wrap a handler so thrown HttpErrors become structured responses and
 *  anything else becomes a generic 500 (details only in the server log). */
export function handle(fn) {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return fail(err.status, err.code, err.message, err.fields);
      console.error("[partners]", err);
      // Partner tables missing → migration not applied (see PARTNERS_SETUP.md).
      if (err?.code === "ER_NO_SUCH_TABLE") {
        return fail(503, "not_configured", "Partner registration is not set up yet. Please try again later.");
      }
      // A column from a newer migration is missing → say so instead of a bare 500.
      if (err?.code === "ER_BAD_FIELD_ERROR") {
        return fail(503, "not_configured", "A database update is pending for this feature (run scripts/run-migrations.mjs --commit).");
      }
      return fail(500, "server_error", "Something went wrong. Please try again.");
    }
  };
}

export async function readJson(req) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body;
  } catch {
    throw new HttpError(400, "bad_request", "Invalid JSON body.");
  }
}

/**
 * CSRF defence for cookie-authenticated writes: the browser always sends
 * Origin on cross-site POST/PATCH/DELETE, so reject any that don't match the
 * host. (Cookies are also SameSite=Lax.)
 */
export function assertSameOrigin(req) {
  const origin = req.headers.get("origin");
  if (!origin) return; // same-origin fetches from older browsers / server calls
  let host;
  try {
    host = new URL(origin).host;
  } catch {
    throw new HttpError(403, "forbidden", "Cross-site request blocked.");
  }
  const expected = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host !== expected) throw new HttpError(403, "forbidden", "Cross-site request blocked.");
}

export function clientIp(req) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim().slice(0, 45);
  return (req.headers.get("x-real-ip") || "").slice(0, 45);
}

// Fixed-window limiter, per process. Good enough for a single cPanel Node
// app; OTP limits that matter are additionally enforced in the database.
const buckets = globalThis._partnerRateBuckets ?? new Map();
globalThis._partnerRateBuckets = buckets;

export function rateLimit(key, limit, windowMs) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset <= now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
    }
    return;
  }
  b.count++;
  if (b.count > limit) {
    throw new HttpError(429, "rate_limited", "Too many requests. Please wait a moment and try again.");
  }
}

/** Admin guard for /api/admin/partners/*. The proxy already blocks
 *  anonymous calls; this re-checks and returns the admin identity from the
 *  signed session (never from the request body). */
export async function requireAdmin(req) {
  const session = await getSession(req);
  if (!session?.sub) throw new HttpError(401, "unauthorized", "Authentication required.");
  return { id: Number(session.sub), role: session.role, name: session.name };
}

export function toInt(v) {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
}
