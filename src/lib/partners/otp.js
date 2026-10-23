// Partner OTP. The SMS is sent and the code checked by the existing OTP API
// (the same one the customer login uses), always called from the server.
// Our own `partner_otp_challenges` ledger enforces cooldown, hourly caps,
// expiry and attempt limits — the browser is never trusted to say "verified".
//
// Env:
//   PARTNER_OTP_SEND_URL    (default: NEXT_PUBLIC_API_SEND_OTP)
//   PARTNER_OTP_VERIFY_URL  (default: the customer verify endpoint below)
//   OTP_TOKEN               (sent as X-App-Token to the send endpoint)

import db from "@/lib/db";
import { HttpError } from "@/lib/partners/http";

const DEFAULT_VERIFY_URL =
  "https://waterpurifierservicecenter.in/customer/ro_customer/service_otp_verify.php";

export const OTP_LENGTH = 4;
const RESEND_COOLDOWN_SEC = 60;
const EXPIRY_MIN = 10;
const MAX_SENDS_PER_HOUR_MOBILE = 5;
const MAX_SENDS_PER_HOUR_IP = 15;
const MAX_ATTEMPTS = 5;
const SOURCE = "mrserviceexpert website";

async function callProvider(url, body, headers = {}) {
  if (!url) throw new HttpError(503, "otp_unavailable", "OTP service is not configured.");
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    });
    return await res.json();
  } catch (err) {
    console.error("[partner-otp] provider error:", err?.message);
    throw new HttpError(502, "otp_provider_error", "Could not reach the OTP service. Please try again.");
  } finally {
    clearTimeout(timer);
  }
}

export async function sendPartnerOtp(mobile, ip) {
  const [[stats]] = await db.query(
    `SELECT
        SUM(mobile = ? AND created_at > NOW() - INTERVAL 1 HOUR) AS mobile_hour,
        SUM(ip = ? AND created_at > NOW() - INTERVAL 1 HOUR) AS ip_hour,
        MIN(CASE WHEN mobile = ? THEN TIMESTAMPDIFF(SECOND, created_at, NOW()) END) AS since_last
       FROM partner_otp_challenges
      WHERE (mobile = ? OR ip = ?) AND created_at > NOW() - INTERVAL 1 HOUR`,
    [mobile, ip, mobile, mobile, ip]
  );

  const sinceLast = stats.since_last === null ? null : Number(stats.since_last);
  if (sinceLast !== null && sinceLast < RESEND_COOLDOWN_SEC) {
    throw new HttpError(429, "otp_cooldown", `Please wait ${RESEND_COOLDOWN_SEC - sinceLast}s before requesting a new OTP.`, {
      retryAfter: RESEND_COOLDOWN_SEC - sinceLast,
    });
  }
  if (Number(stats.mobile_hour || 0) >= MAX_SENDS_PER_HOUR_MOBILE || Number(stats.ip_hour || 0) >= MAX_SENDS_PER_HOUR_IP) {
    throw new HttpError(429, "otp_limit", "Too many OTP requests. Please try again after an hour.");
  }

  // Record first so concurrent double-clicks hit the cooldown.
  const [ins] = await db.query(
    `INSERT INTO partner_otp_challenges (mobile, ip, expires_at)
     VALUES (?, ?, NOW() + INTERVAL ${EXPIRY_MIN} MINUTE)`,
    [mobile, ip]
  );

  const data = await callProvider(
    process.env.PARTNER_OTP_SEND_URL || process.env.NEXT_PUBLIC_API_SEND_OTP,
    { phoneNumber: mobile, source: SOURCE },
    { "X-App-Token": process.env.OTP_TOKEN || "" }
  );

  if (data?.error !== false) {
    await db.query("UPDATE partner_otp_challenges SET status = 'failed' WHERE id = ?", [ins.insertId]);
    throw new HttpError(502, "otp_send_failed", "Could not send the OTP. Please check the number and try again.");
  }

  return { resendAfter: RESEND_COOLDOWN_SEC, expiresInMin: EXPIRY_MIN, length: OTP_LENGTH };
}

/** Resolves to the provider response only after it confirms the code
 *  (contains name / c_id / address for existing customers). */
export async function verifyPartnerOtp(mobile, otp) {
  const [rows] = await db.query(
    `SELECT id, attempts FROM partner_otp_challenges
      WHERE mobile = ? AND status = 'sent' AND expires_at > NOW()
      ORDER BY id DESC LIMIT 1`,
    [mobile]
  );
  if (!rows.length) {
    throw new HttpError(400, "otp_expired", "OTP expired or not requested. Please request a new OTP.");
  }
  const challenge = rows[0];

  // Reserve an attempt atomically before asking the provider.
  const [upd] = await db.query(
    `UPDATE partner_otp_challenges SET attempts = attempts + 1
      WHERE id = ? AND status = 'sent' AND attempts < ?`,
    [challenge.id, MAX_ATTEMPTS]
  );
  if (!upd.affectedRows) {
    await db.query("UPDATE partner_otp_challenges SET status = 'failed' WHERE id = ?", [challenge.id]);
    throw new HttpError(429, "otp_attempts", "Too many wrong attempts. Please request a new OTP.");
  }

  const data = await callProvider(process.env.PARTNER_OTP_VERIFY_URL || DEFAULT_VERIFY_URL, {
    phoneNumber: mobile,
    newOtp: otp,
  });

  if (data?.error === false) {
    await db.query(
      "UPDATE partner_otp_challenges SET status = 'verified', verified_at = NOW() WHERE id = ?",
      [challenge.id]
    );
    return data;
  }

  const left = MAX_ATTEMPTS - (challenge.attempts + 1);
  if (left <= 0) {
    await db.query("UPDATE partner_otp_challenges SET status = 'failed' WHERE id = ?", [challenge.id]);
    throw new HttpError(400, "otp_invalid", "Incorrect OTP. No attempts left — please request a new OTP.");
  }
  throw new HttpError(400, "otp_invalid", `Incorrect OTP. ${left} attempt${left === 1 ? "" : "s"} left.`);
}
