import { ok, handle, requireAdmin, readJson, toInt, HttpError } from "@/lib/partners/http";
import { adminSetVerification, getApplication } from "@/lib/partners/application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** { field: identity|business|gst, verified: boolean, note? } */
export const PATCH = handle(async (req, ctx) => {
  const admin = await requireAdmin(req);
  const id = toInt((await ctx.params).id);
  if (!id) throw new HttpError(404, "not_found", "Partner not found.");
  const body = await readJson(req);
  await adminSetVerification(id, admin, body.field, !!body.verified, body.note);
  return ok(await getApplication(id, { forAdmin: true }));
});
