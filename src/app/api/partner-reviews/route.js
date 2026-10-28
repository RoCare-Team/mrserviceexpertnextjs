import { ok, handle, readJson, assertSameOrigin, rateLimit } from "@/lib/partners/http";
import { requireCustomer, getCustomer } from "@/lib/partners/customerAuth";
import { upsertReview, getOwnReview } from "@/lib/partners/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?partner=slug → the signed-in customer's own review (to edit). */
export const GET = handle(async (req) => {
  const c = await getCustomer(req);
  if (!c) return ok({ customer: null, review: null });
  const slug = new URL(req.url).searchParams.get("partner");
  return ok({ customer: { name: c.name }, review: await getOwnReview(c.id, slug) });
});

/** { partner, rating, comment } — posts or edits the customer's review. */
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const c = await requireCustomer(req);
  rateLimit(`review:${c.id}`, 10, 60 * 60_000);
  const body = await readJson(req);
  return ok(await upsertReview(c, body.partner, body));
});
