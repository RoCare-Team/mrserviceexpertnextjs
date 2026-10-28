import { ok, handle, readJson, assertSameOrigin, rateLimit, clientIp } from "@/lib/partners/http";
import { requireCustomer } from "@/lib/partners/customerAuth";
import { createLead } from "@/lib/partners/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Customer "Book now" on a partner card / profile. */
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const customer = await requireCustomer(req);
  rateLimit(`lead-create:${customer.id}`, 5, 10 * 60_000);
  rateLimit(`lead-create-ip:${clientIp(req)}`, 15, 10 * 60_000);
  const body = await readJson(req);
  return ok(await createLead(customer, body));
});
