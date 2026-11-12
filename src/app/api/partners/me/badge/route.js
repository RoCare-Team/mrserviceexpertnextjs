import { ok, handle, readJson, assertSameOrigin, rateLimit, HttpError } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { validEmail } from "@/lib/partners/validation";
import { startGatewayPayment } from "@/lib/partners/payments";
import { BADGE_PERIOD, BADGE_NAME, badgePrice, lockedItems, chooseActive } from "@/lib/partners/badge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const siteOrigin = (req) => process.env.SITE_URL?.replace(/\/$/, "") || new URL(req.url).origin;

/** Buy / renew the Featured Partner badge (also during registration): { email } → { payUrl }. Price is fixed server-side. */
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  // Approved partners get the days now; during registration / review they start on approval.
  if (!["approved", "draft", "rejected", "info_requested", "pending"].includes(p.status)) {
    throw new HttpError(403, "not_active", "The badge isn't available for your account right now. Contact support.");
  }
  if (p.status === "approved" && !p.is_listed) {
    throw new HttpError(409, "not_listed", "Your profile isn't live on the website yet, so the badge would have no effect. Contact support.");
  }
  rateLimit(`badge:${p.id}`, 6, 10 * 60_000);

  const email = validEmail((await readJson(req)).email);
  if (email.error || !email.value) throw new HttpError(422, "validation_error", "Enter a valid email for the payment receipt.", { email: "Required." });

  const payUrl = await startGatewayPayment({
    partner: p,
    amount: badgePrice(),
    email: email.value,
    purpose: "badge",
    productinfo: `MSE ${BADGE_NAME} Badge (${BADGE_PERIOD})`,
    returnUrl: `${siteOrigin(req)}/api/payments/easebuzz/return`,
  });
  return ok({ payUrl });
});

/** Free-plan locks: what is live and what is hidden (null before migration 011). */
export const GET = handle(async (req) => {
  const p = await requirePartner(req);
  return ok({ items: await lockedItems(p.id) });
});

/** No badge: choose what stays live — { category_ids, brand_ids }. */
export const PATCH = handle(async (req) => {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  if (p.status !== "approved") throw new HttpError(409, "not_approved", "Available once your profile is approved.");
  await chooseActive(p.id, await readJson(req));
  return ok({ items: await lockedItems(p.id) });
});
