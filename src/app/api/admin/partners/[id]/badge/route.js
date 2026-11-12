import { ok, handle, requireAdmin, readJson, toInt, HttpError } from "@/lib/partners/http";
import { getApplication } from "@/lib/partners/application";
import { adminGrantBadge, adminRevokeBadge } from "@/lib/partners/badge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** { action: "grant", days } — free badge (adds to an active one) | { action: "revoke", reason? } */
export const PATCH = handle(async (req, ctx) => {
  const admin = await requireAdmin(req);
  const id = toInt((await ctx.params).id);
  if (!id) throw new HttpError(404, "not_found", "Partner not found.");
  const body = await readJson(req);
  if (body.action === "grant") await adminGrantBadge(admin, id, body.days);
  else if (body.action === "revoke") await adminRevokeBadge(admin, id, body.reason);
  else throw new HttpError(400, "bad_action", "Unknown action.");
  return ok(await getApplication(id, { forAdmin: true }));
});
