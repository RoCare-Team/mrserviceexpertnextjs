import { ok, handle, assertSameOrigin } from "@/lib/partners/http";
import { clearPartnerSessionCookie } from "@/lib/partners/auth";

export const runtime = "nodejs";

export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const res = ok(null);
  clearPartnerSessionCookie(res);
  return res;
});
