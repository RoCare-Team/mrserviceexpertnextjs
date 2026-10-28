import { ok, handle, toInt, HttpError } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { getPartnerPayment } from "@/lib/partners/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (req, ctx) => {
  const p = await requirePartner(req);
  const id = toInt((await ctx.params).paymentId);
  const row = id ? await getPartnerPayment(p.id, id) : null;
  if (!row) throw new HttpError(404, "not_found", "Payment not found.");
  return ok(row);
});
