import { ok, handle, requireAdmin, readJson, toInt, HttpError } from "@/lib/partners/http";
import { refundLead, retryCrm } from "@/lib/partners/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** { action: refund | retry_crm, note? } */
export const POST = handle(async (req, ctx) => {
  const admin = await requireAdmin(req);
  const leadId = toInt((await ctx.params).leadId);
  if (!leadId) throw new HttpError(404, "not_found", "Lead not found.");
  const body = await readJson(req);
  if (body.action === "refund") return ok(await refundLead(admin, leadId, body.note));
  if (body.action === "retry_crm") {
    await retryCrm(leadId);
    return ok(null);
  }
  throw new HttpError(400, "bad_action", "Unknown action.");
});
