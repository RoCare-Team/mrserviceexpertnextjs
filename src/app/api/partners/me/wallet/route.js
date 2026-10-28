import { ok, handle } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { getWallet, MIN_RECHARGE } from "@/lib/partners/wallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  const p = await requirePartner(req);
  return ok({ ...(await getWallet(p.id, { limit: 200 })), min_recharge: MIN_RECHARGE, email: p.business_email || "" });
});
