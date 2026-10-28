import { ok, handle, requireAdmin, readJson, toInt, HttpError } from "@/lib/partners/http";
import { adminChangeStatus, getApplication } from "@/lib/partners/application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** { action: approve|reject|request_info|suspend|reactivate, reason?, publish? } */
export const PATCH = handle(async (req, ctx) => {
  const admin = await requireAdmin(req);
  const id = toInt((await ctx.params).id);
  if (!id) throw new HttpError(404, "not_found", "Partner not found.");
  const body = await readJson(req);
  await adminChangeStatus(id, admin, { action: body.action, reason: body.reason, publish: !!body.publish });
  return ok(await getApplication(id, { forAdmin: true }));
});
