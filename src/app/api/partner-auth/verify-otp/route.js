import { ok, fail, handle, readJson, assertSameOrigin, clientIp, rateLimit } from "@/lib/partners/http";
import { normalizeMobile, validName } from "@/lib/partners/validation";
import { verifyPartnerOtp, OTP_LENGTH } from "@/lib/partners/otp";
import { findOrCreateByVerifiedMobile } from "@/lib/partners/application";
import { createPartnerSessionCookie } from "@/lib/partners/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  rateLimit(`otp-verify:${ip}`, 20, 10 * 60_000);

  const body = await readJson(req);
  const mobile = normalizeMobile(body.mobile);
  const otp = String(body.otp ?? "").trim();
  if (!mobile) return fail(422, "validation_error", "Enter a valid mobile number.");
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otp)) {
    return fail(422, "validation_error", `Enter the ${OTP_LENGTH}-digit OTP.`, { otp: "Invalid OTP." });
  }

  // Name is optional here: required for a new registration, ignored on login.
  let fullName = "";
  if (body.full_name) {
    const n = validName(body.full_name);
    if (n.error) return fail(422, "validation_error", n.error, { full_name: n.error });
    fullName = n.value;
  }

  await verifyPartnerOtp(mobile, otp);
  const { id, created } = await findOrCreateByVerifiedMobile(mobile, fullName);

  const res = ok({ created });
  await createPartnerSessionCookie(res, { id });
  return res;
});
