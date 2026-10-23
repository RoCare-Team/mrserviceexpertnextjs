// Easebuzz payment gateway for wallet recharges (server-side only).
//
// Env: NEXT_PUBLIC_EASEBUZZ_MODE = test | live
//      EASEBUZZ_TEST_KEY / EASEBUZZ_TEST_SALT
//      EASEBUZZ_LIVE_KEY / EASEBUZZ_LIVE_SALT
//
// Flow: initiateLink → redirect to hosted page → Easebuzz POSTs to our
// surl/furl → we verify the response hash AND re-check the transaction with
// the Retrieve API before crediting coins.

import crypto from "node:crypto";
import { HttpError } from "@/lib/partners/http";

export function easebuzzMode() {
  // Tolerates "live   # comment" style values.
  const m = String(process.env.NEXT_PUBLIC_EASEBUZZ_MODE || "test").split("#")[0].trim().toLowerCase();
  return m === "live" ? "live" : "test";
}

function creds(mode = easebuzzMode()) {
  const key = mode === "live" ? process.env.EASEBUZZ_LIVE_KEY : process.env.EASEBUZZ_TEST_KEY;
  const salt = mode === "live" ? process.env.EASEBUZZ_LIVE_SALT : process.env.EASEBUZZ_TEST_SALT;
  if (!key || !salt) throw new HttpError(503, "payments_unavailable", "Online payments are not configured.");
  return { key: key.trim(), salt: salt.trim() };
}

const HOSTS = {
  test: { pay: "https://testpay.easebuzz.in", dashboard: "https://testdashboard.easebuzz.in" },
  live: { pay: "https://pay.easebuzz.in", dashboard: "https://dashboard.easebuzz.in" },
};

const sha512 = (s) => crypto.createHash("sha512").update(s).digest("hex");

/** Returns the hosted checkout URL for a new payment. */
export async function initiatePayment({ txnid, amount, firstname, email, phone, productinfo, surl, furl, mode = easebuzzMode() }) {
  const { key, salt } = creds(mode);
  const amt = Number(amount).toFixed(2);
  const udf = ["", "", "", "", "", "", "", "", "", ""];
  // key|txnid|amount|productinfo|firstname|email|udf1..udf10|salt
  const hash = sha512([key, txnid, amt, productinfo, firstname, email, ...udf, salt].join("|"));

  const body = new URLSearchParams({ key, txnid, amount: amt, productinfo, firstname, email, phone, surl, furl, hash });
  const res = await fetch(`${HOSTS[mode].pay}/payment/initiateLink`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  if (json?.status !== 1 || !json.data) {
    console.error("[easebuzz] initiate failed:", JSON.stringify(json).slice(0, 300));
    throw new HttpError(502, "payment_init_failed", "Could not start the payment. Please try again.");
  }
  return `${HOSTS[mode].pay}/pay/${json.data}`;
}

/** Verify the hash Easebuzz posts back to surl/furl. */
export function verifyResponseHash(p, mode = easebuzzMode()) {
  const { key, salt } = creds(mode);
  // salt|status|udf10..udf1|email|firstname|productinfo|amount|txnid|key
  const udfs = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((i) => p[`udf${i}`] || "");
  const expected = sha512([salt, p.status, ...udfs, p.email, p.firstname, p.productinfo, p.amount, p.txnid, key].join("|"));
  const got = String(p.hash || "");
  return got.length === expected.length && crypto.timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}

/** Server-to-server status check (Transaction Retrieve API). */
export async function retrieveTransaction(txnid, mode = easebuzzMode()) {
  const { key, salt } = creds(mode);
  const hash = sha512([key, txnid, salt].join("|"));
  const res = await fetch(`${HOSTS[mode].dashboard}/transaction/v1/retrieve`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({ key, txnid, hash }),
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  const msg = Array.isArray(json?.msg) ? json.msg[0] : json?.msg;
  if (!json?.status || !msg || typeof msg !== "object") return null;
  return {
    status: String(msg.status || ""),
    amount: Number(msg.amount),
    easepayid: String(msg.easepayid || ""),
    txnid: String(msg.txnid || ""),
    raw: msg,
  };
}
