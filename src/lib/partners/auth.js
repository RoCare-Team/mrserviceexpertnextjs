// Partner sessions: a signed, httpOnly cookie separate from the admin one.
// Signed with a key derived from AUTH_SECRET so a partner token can never be
// accepted as an admin session (and vice versa).

import { cookies } from "next/headers";
import db from "@/lib/db";
import { signSession, verifySession, getSecret } from "@/lib/session";
import { HttpError } from "@/lib/partners/http";

export const PARTNER_COOKIE = "mse_partner_session";
const TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

const partnerSecret = () => `${getSecret()}::partner-session`;

export async function createPartnerSessionCookie(res, partner) {
  const token = await signSession({ typ: "partner", pid: partner.id }, TTL_SECONDS, partnerSecret());
  res.cookies.set(PARTNER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export function clearPartnerSessionCookie(res) {
  res.cookies.set(PARTNER_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

async function readToken(req) {
  if (req?.cookies?.get) return req.cookies.get(PARTNER_COOKIE)?.value;
  return (await cookies()).get(PARTNER_COOKIE)?.value;
}

/** Partner id from the cookie, or null. Works in route handlers (pass req)
 *  and server components (no arg). */
export async function getPartnerId(req) {
  const payload = await verifySession(await readToken(req), partnerSecret());
  if (!payload || payload.typ !== "partner") return null;
  const id = Number(payload.pid);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** Loads the signed-in partner row; throws 401 when there is none. */
export async function requirePartner(req) {
  const id = await getPartnerId(req);
  if (!id) throw new HttpError(401, "unauthorized", "Please verify your mobile number to continue.");
  const [rows] = await db.query(
    "SELECT * FROM partners WHERE id = ? AND deleted_at IS NULL LIMIT 1",
    [id]
  );
  if (!rows.length) throw new HttpError(401, "unauthorized", "Your session has expired. Please sign in again.");
  return rows[0];
}
