import { ok, handle, readJson, assertSameOrigin, rateLimit, toInt, HttpError } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { acceptLead, rejectLead, completeLead, reportLeadIssue, listPartnerLeads } from "@/lib/partners/leads";
import { getWallet } from "@/lib/partners/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** { action: accept | reject | complete | report, reason?, note? } */
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
      await completeLead(p.id, leadId);
      break;
    case "report":
      await reportLeadIssue(p.id, leadId, body.note);
      break;
    default:
      throw new HttpError(400, "bad_action", "Unknown action.");
  }
  const [leads, wallet] = await Promise.all([listPartnerLeads(p.id), getWallet(p.id, { limit: 1 })]);
  return ok({ leads, balance: wallet.balance });
});
