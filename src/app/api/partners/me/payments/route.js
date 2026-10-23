import { ok, handle } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { listPartnerPayments } from "@/lib/partners/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Every recharge attempt — success, failed and pending — with gateway details. */
export const GET = handle(async (req) => {
  const p = await requirePartner(req);
  return ok(await listPartnerPayments(p.id));
});
