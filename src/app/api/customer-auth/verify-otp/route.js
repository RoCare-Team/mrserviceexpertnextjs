import { ok, fail, handle, readJson, assertSameOrigin, clientIp, rateLimit } from "@/lib/partners/http";
import { normalizeMobile, validName } from "@/lib/partners/validation";
import { verifyPartnerOtp, OTP_LENGTH } from "@/lib/partners/otp";
import { upsertVerifiedCustomer, createCustomerSessionCookie, normalizeAddresses } from "@/lib/partners/customerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async (req) => {
  assertSameOrigin(req);
  rateLimit(`cust-otp-verify:${clientIp(req)}`, 20, 10 * 60_000);
  const body = await readJson(req);
  const mobile = normalizeMobile(body.mobile);
  const otp = String(body.otp ?? "").trim();
  if (!mobile) return fail(422, "validation_error", "Enter a valid mobile number.");
  if (!new RegExp(`^\\d{${OTP_LENGTH}}$`).test(otp)) return fail(422, "validation_error", `Enter the ${OTP_LENGTH}-digit OTP.`);

  let typedName = "";
  if (body.name) {
    const n = validName(body.name);
    if (n.error) return fail(422, "validation_error", n.error, { name: n.error });
    typedName = n.value;
  }

  // Provider response carries the existing customer's name, id and addresses.
  const data = await verifyPartnerOtp(mobile, otp);
  const customer = await upsertVerifiedCustomer(mobile, {
    name: typedName || String(data?.name || "").trim().slice(0, 120),
    phpCustomerId: data?.c_id ? String(data.c_id).slice(0, 40) : null,
  });

  const res = ok({
    customer: { name: customer.name, mobile: customer.mobile },
    addresses: normalizeAddresses(data?.address),
  });
  await createCustomerSessionCookie(res, customer.id);
  return res;
});
