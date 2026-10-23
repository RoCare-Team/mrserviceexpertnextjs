import crypto from "node:crypto";
import db from "@/lib/db";
import { ok, handle, readJson, assertSameOrigin, rateLimit, HttpError } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { MIN_RECHARGE, MAX_RECHARGE } from "@/lib/partners/wallet";
import { validEmail } from "@/lib/partners/validation";
import { easebuzzMode, initiatePayment } from "@/lib/partners/easebuzz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const siteOrigin = (req) => process.env.SITE_URL?.replace(/\/$/, "") || new URL(req.url).origin;

/** { amount, email } → { payUrl } (Easebuzz hosted checkout). */
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  if (p.status !== "approved") throw new HttpError(403, "not_active", "Your profile must be approved before recharging.");
  rateLimit(`recharge:${p.id}`, 10, 10 * 60_000);

  const body = await readJson(req);
  const amount = Number(body.amount);
  if (!Number.isInteger(amount) || amount < MIN_RECHARGE || amount > MAX_RECHARGE) {
    throw new HttpError(422, "validation_error", `Enter a whole amount between ₹${MIN_RECHARGE} and ₹${MAX_RECHARGE}.`, { amount: "Invalid amount." });
  }
  const email = validEmail(body.email);
  if (email.error || !email.value) throw new HttpError(422, "validation_error", "Enter a valid email for the payment receipt.", { email: "Required." });

  const mode = easebuzzMode();
  const txnid = `MSEW${p.id}T${Date.now()}${crypto.randomBytes(2).toString("hex")}`.slice(0, 40);
  await db.query("INSERT INTO partner_payments (partner_id, txnid, amount, email, mode) VALUES (?, ?, ?, ?, ?)", [
    p.id, txnid, amount, email.value, mode,
  ]);

  const back = `${siteOrigin(req)}/api/payments/easebuzz/return`;
  let payUrl;
  try {
    payUrl = await initiatePayment({
      txnid,
      amount,
      firstname: (p.full_name || "Partner").replace(/[^\p{L} .]/gu, "").slice(0, 60) || "Partner",
      email: email.value,
      phone: p.mobile,
      productinfo: "MSE Partner Wallet Recharge",
      surl: back,
      furl: back,
      mode,
    });
  } catch (err) {
    // Keep the attempt on record as failed so both sides can see it.
    await db.query(
      "UPDATE partner_payments SET status = 'failed', error_message = ?, gateway_msg = 'initiate_failed', completed_at = NOW() WHERE txnid = ?",
      [String(err?.message || "Could not start payment").slice(0, 255), txnid]
    );
    throw err;
  }
  return ok({ payUrl });
});
