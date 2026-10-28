import { ok, handle, requireAdmin, toInt, HttpError } from "@/lib/partners/http";
import { removeReview } from "@/lib/partners/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const DELETE = handle(async (req, ctx) => {
  const admin = await requireAdmin(req);
  const id = toInt((await ctx.params).reviewId);
  if (!id) throw new HttpError(404, "not_found", "Review not found.");
  await removeReview(id, { type: "admin", id: admin.id });
  return ok(null);
});
