import { ok, handle } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { getPartnerStats } from "@/lib/partners/stats";
import { processDueLeads } from "@/lib/partners/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  const p = await requirePartner(req);
  await processDueLeads().catch(() => {});
  return ok(await getPartnerStats(p.id));
});
