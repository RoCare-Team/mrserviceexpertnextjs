import { ok, handle, assertSameOrigin } from "@/lib/partners/http";
import { clearCustomerSessionCookie } from "@/lib/partners/customerAuth";

export const runtime = "nodejs";

export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const res = ok(null);
  clearCustomerSessionCookie(res);
  return res;
});
