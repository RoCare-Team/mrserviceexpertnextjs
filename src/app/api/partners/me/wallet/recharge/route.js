import { ok, handle, readJson, assertSameOrigin, rateLimit, HttpError } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { MIN_RECHARGE, MAX_RECHARGE } from "@/lib/partners/wallet";
import { validEmail } from "@/lib/partners/validation";
import { startGatewayPayment } from "@/lib/partners/payments";

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

  const payUrl = await startGatewayPayment({
    partner: p,
    amount,
    email: email.value,
    purpose: "recharge",
    productinfo: "MSE Partner Wallet Recharge",
    returnUrl: `${siteOrigin(req)}/api/payments/easebuzz/return`,
  });
  return ok({ payUrl });
});
