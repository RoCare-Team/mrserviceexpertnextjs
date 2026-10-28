import { ok, fail, handle, readJson, assertSameOrigin, clientIp, rateLimit } from "@/lib/partners/http";
import { normalizeMobile } from "@/lib/partners/validation";
import { sendPartnerOtp } from "@/lib/partners/otp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Customer OTP (same provider + limits as partner OTP). */
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  rateLimit(`cust-otp-send:${ip}`, 10, 10 * 60_000);
  const body = await readJson(req);
  const mobile = normalizeMobile(body.mobile);
  if (!mobile) return fail(422, "validation_error", "Enter a valid 10-digit mobile number.", { mobile: "Invalid mobile number." });
  return ok(await sendPartnerOtp(mobile, ip));
});
