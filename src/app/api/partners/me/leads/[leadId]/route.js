import { ok, handle, readJson, assertSameOrigin, rateLimit, toInt, HttpError } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { acceptLead, rejectLead, completeLead, reportLeadIssue, saveLeadNote } from "@/lib/partners/leads";
import { getWallet } from "@/lib/partners/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * { action: accept | reject | complete | report | note,
 *   reason?, note?, final_amount?, work_done? }
 * Returns the new wallet balance; the dashboard reloads its current list.
 */
export const POST = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  rateLimit(`lead-action:${p.id}`, 60, 60_000);
  const leadId = toInt((await ctx.params).leadId);
  if (!leadId) throw new HttpError(404, "not_found", "Lead not found.");
  const body = await readJson(req);

  switch (body.action) {
    case "accept":
      await acceptLead(p.id, leadId);
      break;
    case "reject":
      await rejectLead(p.id, leadId, body.reason);
      break;
    case "complete":
      await completeLead(p.id, leadId, { final_amount: body.final_amount, work_done: body.work_done });
      break;
    case "report":
      await reportLeadIssue(p.id, leadId, body.note);
      break;
    case "note":
      await saveLeadNote(p.id, leadId, body.note);
      break;
    default:
      throw new HttpError(400, "bad_action", "Unknown action.");
  }
  const wallet = await getWallet(p.id, { limit: 1 });
  return ok({ balance: wallet.balance });
});
