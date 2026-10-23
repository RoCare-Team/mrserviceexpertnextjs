// Customer sessions for partner bookings and reviews. Issued only after the
// existing customer OTP API confirms the code on our server, so a booking or
// review can't be made by editing localStorage.

import { cookies } from "next/headers";
import db from "@/lib/db";
import { signSession, verifySession, getSecret } from "@/lib/session";
import { HttpError } from "@/lib/partners/http";

export const CUSTOMER_COOKIE = "mse_customer_session";
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

const customerSecret = () => `${getSecret()}::customer-session`;

export async function createCustomerSessionCookie(res, customerId) {
  const token = await signSession({ typ: "customer", cid: customerId }, TTL_SECONDS, customerSecret());
  res.cookies.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: TTL_SECONDS,
  });
}

export function clearCustomerSessionCookie(res) {
  res.cookies.set(CUSTOMER_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getCustomerId(req) {
  const raw = req?.cookies?.get ? req.cookies.get(CUSTOMER_COOKIE)?.value : (await cookies()).get(CUSTOMER_COOKIE)?.value;
  const payload = await verifySession(raw, customerSecret());
  if (!payload || payload.typ !== "customer") return null;
  const id = Number(payload.cid);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function getCustomer(req) {
  const id = await getCustomerId(req);
  if (!id) return null;
  const [[c]] = await db.query("SELECT id, mobile, name, php_customer_id FROM site_customers WHERE id = ?", [id]);
  return c || null;
}

export async function requireCustomer(req) {
  const c = await getCustomer(req);
  if (!c) throw new HttpError(401, "customer_login", "Please verify your mobile number to continue.");
  return c;
}

/** Upsert after a provider-confirmed OTP. */
export async function upsertVerifiedCustomer(mobile, { name, phpCustomerId }) {
  await db.query(
    `INSERT INTO site_customers (mobile, name, php_customer_id, last_login_at)
     VALUES (?, ?, ?, NOW())
     ON DUPLICATE KEY UPDATE
       name = IF(VALUES(name) <> '', VALUES(name), name),
       php_customer_id = COALESCE(VALUES(php_customer_id), php_customer_id),
       last_login_at = NOW()`,
    [mobile, name || "", phpCustomerId || null]
  );
  const [[c]] = await db.query("SELECT id, mobile, name FROM site_customers WHERE mobile = ?", [mobile]);
  return c;
}

/** Normalise the customer API's saved addresses into one shape. */
export function normalizeAddresses(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map((a) => ({
      id: String(a.id ?? a.address_id ?? ""),
      house_no: String(a.flat_no ?? a.house_no ?? "").trim(),
      area: String(a.area ?? "").trim(),
      landmark: String(a.landmark ?? "").trim(),
      city: String(a.city ?? "").trim(),
      state: String(a.state ?? "").trim(),
      pincode: String(a.pincode ?? "").replace(/\D/g, "").slice(0, 6),
    }))
    .filter((a) => a.house_no || a.area);
}
