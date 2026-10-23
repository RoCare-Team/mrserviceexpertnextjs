import { ok, handle, assertSameOrigin, toInt, HttpError } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { removeReview, listReviewsForOwner } from "@/lib/partners/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Partner removes a review on their own profile. */
export const DELETE = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  const id = toInt((await ctx.params).reviewId);
  if (!id) throw new HttpError(404, "not_found", "Review not found.");
  await removeReview(id, { type: "partner", id: p.id, partnerId: p.id });
  return ok(await listReviewsForOwner(p.id));
});
