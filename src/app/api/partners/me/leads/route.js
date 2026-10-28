import { ok, handle } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { listPartnerLeads } from "@/lib/partners/leads";
import { getWallet } from "@/lib/partners/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?group=new|accepted|completed|missed&search=&from=&to= (polled by the dashboard). */
export const GET = handle(async (req) => {
  const p = await requirePartner(req);
  const sp = new URL(req.url).searchParams;
  const [leads, wallet] = await Promise.all([
    listPartnerLeads(p.id, { group: sp.get("group"), search: sp.get("search") || "", from: sp.get("from"), to: sp.get("to"), limit: 100 }),
    getWallet(p.id, { limit: 1 }),
  ]);
  return ok({ leads, balance: wallet.balance });
});
