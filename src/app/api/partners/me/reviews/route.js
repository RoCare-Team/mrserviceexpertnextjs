import { ok, handle } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { listReviewsForOwner } from "@/lib/partners/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  const p = await requirePartner(req);
  return ok(await listReviewsForOwner(p.id));
});
