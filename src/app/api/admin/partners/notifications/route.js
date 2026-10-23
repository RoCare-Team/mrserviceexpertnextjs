import db from "@/lib/db";
import { ok, handle, requireAdmin } from "@/lib/partners/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Counts behind the admin sidebar badge (polled every minute). */
export const GET = handle(async (req) => {
  await requireAdmin(req);
  try {
    const [[r]] = await db.query(
      `SELECT
         (SELECT COUNT(*) FROM partners WHERE status = 'pending' AND deleted_at IS NULL) AS pending_applications,
         (SELECT COUNT(*) FROM partner_location_requests WHERE status = 'pending') AS locality_requests,
         (SELECT COUNT(*) FROM partner_leads WHERE issue_reported_at IS NOT NULL AND refunded_at IS NULL) AS lead_issues,
         (SELECT COUNT(*) FROM partner_leads WHERE crm_status = 'failed') AS crm_failed`
    );
    const counts = Object.fromEntries(Object.entries(r).map(([k, v]) => [k, Number(v || 0)]));
    return ok({ ...counts, total: Object.values(counts).reduce((a, b) => a + b, 0) });
  } catch (err) {
    if (err?.code === "ER_NO_SUCH_TABLE") return ok({ total: 0 });
    throw err;
  }
});
