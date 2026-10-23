import { ok, handle } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { listPartnerLeads } from "@/lib/partners/leads";
import { getWallet } from "@/lib/partners/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The partner's own leads + wallet balance (polled by the dashboard). */
export const GET = handle(async (req) => {
  const p = await requirePartner(req);
  const [leads, wallet] = await Promise.all([listPartnerLeads(p.id), getWallet(p.id, { limit: 1 })]);
  return ok({ leads, balance: wallet.balance });
});
