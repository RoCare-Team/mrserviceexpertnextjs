import { ok, handle, requireAdmin, readJson, toInt, HttpError } from "@/lib/partners/http";
import { adminSetListing, getApplication } from "@/lib/partners/application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** { listed: boolean } — only approved partners can be listed. */
export const PATCH = handle(async (req, ctx) => {
  const admin = await requireAdmin(req);
  const id = toInt((await ctx.params).id);
  if (!id) throw new HttpError(404, "not_found", "Partner not found.");
  const body = await readJson(req);
  await adminSetListing(id, admin, !!body.listed);
  return ok(await getApplication(id, { forAdmin: true }));
});
