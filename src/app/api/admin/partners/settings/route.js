import { ok, handle, requireAdmin, readJson } from "@/lib/partners/http";
import { getRefundPercent, setRefundPercent } from "@/lib/partners/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  await requireAdmin(req);
  return ok({ lead_refund_percent: await getRefundPercent() });
});

/** { lead_refund_percent: 1–100 } */
export const PUT = handle(async (req) => {
  const admin = await requireAdmin(req);
  const body = await readJson(req);
  return ok({ lead_refund_percent: await setRefundPercent(admin, body.lead_refund_percent) });
});
