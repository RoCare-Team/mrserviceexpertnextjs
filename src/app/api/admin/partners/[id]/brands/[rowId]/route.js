import db from "@/lib/db";
import { ok, handle, requireAdmin, readJson, toInt, HttpError } from "@/lib/partners/http";
import { getApplication } from "@/lib/partners/application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Approve / reject a partner's custom "Other" brand name. { status } */
export const PATCH = handle(async (req, ctx) => {
  await requireAdmin(req);
  const params = await ctx.params;
  const id = toInt(params.id);
  const rowId = toInt(params.rowId);
  const body = await readJson(req);
  if (!id || !rowId || !["approved", "rejected", "pending"].includes(body.status)) {
    throw new HttpError(422, "validation_error", "Invalid request.");
  }
  const [r] = await db.query(
    "UPDATE partner_brands SET custom_status = ? WHERE id = ? AND partner_id = ? AND custom_name IS NOT NULL",
    [body.status, rowId, id]
  );
  if (!r.affectedRows) throw new HttpError(404, "not_found", "Custom brand not found.");
  return ok(await getApplication(id, { forAdmin: true }));
});
