import { ok, handle, requireAdmin, readJson, toInt, HttpError } from "@/lib/partners/http";
import { decideChangeRequest, getApplication } from "@/lib/partners/application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** { approve: boolean, reason? } — approving applies the changes to the live profile. */
export const POST = handle(async (req, ctx) => {
  const admin = await requireAdmin(req);
  const id = toInt((await ctx.params).requestId);
  if (!id) throw new HttpError(404, "not_found", "Request not found.");
  const body = await readJson(req);
  const partnerId = await decideChangeRequest(admin, id, { approve: !!body.approve, reason: body.reason });
  return ok(await getApplication(partnerId, { forAdmin: true }));
});
