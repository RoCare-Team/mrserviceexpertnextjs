import db from "@/lib/db";
import { ok, handle, requireAdmin, toInt } from "@/lib/partners/http";
import { processDueLeads } from "@/lib/partners/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["new", "accepted", "rejected", "expired", "completed"];
const CRM = ["none", "pending", "sent", "duplicate", "failed"];

/** GET ?status=&crm=&issues=1&partnerId=&search=&page=&limit= */
export const GET = handle(async (req) => {
  await requireAdmin(req);
  processDueLeads().catch((e) => console.error("[leads] process", e?.message));
  const sp = new URL(req.url).searchParams;
  const page = toInt(sp.get("page")) || 1;
  const limit = Math.min(toInt(sp.get("limit")) || 25, 100);

  const where = ["1=1"];
  const params = [];
  if (STATUSES.includes(sp.get("status"))) (where.push("l.status = ?"), params.push(sp.get("status")));
  if (CRM.includes(sp.get("crm"))) (where.push("l.crm_status = ?"), params.push(sp.get("crm")));
  if (sp.get("issues") === "1") where.push("l.issue_reported_at IS NOT NULL AND l.refunded_at IS NULL");
  const partnerId = toInt(sp.get("partnerId"));
  if (partnerId) (where.push("l.partner_id = ?"), params.push(partnerId));
  const search = String(sp.get("search") || "").trim().slice(0, 60);
  if (search) {
    const like = `%${search.replace(/[%_\\]/g, "\\$&")}%`;
    where.push("(l.customer_name LIKE ? OR l.customer_mobile LIKE ? OR p.business_name LIKE ? OR l.id = ?)");
    params.push(like, like, like, toInt(search) || 0);
  }
  const w = where.join(" AND ");

  const [[[{ total }]], [rows], [counts]] = await Promise.all([
    db.query(`SELECT COUNT(*) AS total FROM partner_leads l JOIN partners p ON p.id = l.partner_id WHERE ${w}`, params),
    db.query(
      `SELECT l.id, l.status, l.crm_status, l.crm_response, l.customer_name, l.customer_mobile, l.service_name, l.service_price,
              l.coin_cost, l.brand_name, l.appointment_date, l.appointment_time, l.area, l.address_city, l.pincode, l.page_url,
              l.issue_note, l.issue_reported_at, l.refunded_at, l.created_at, l.expires_at, l.accepted_at,
              c.category_name, p.id AS partner_id, p.business_name
         FROM partner_leads l
         JOIN partners p ON p.id = l.partner_id
         JOIN category_tb c ON c.id = l.category_id
        WHERE ${w} ORDER BY l.id DESC LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      params
    ),
    db.query(
      `SELECT SUM(status = 'new') AS new_count, SUM(crm_status = 'failed') AS crm_failed,
              SUM(issue_reported_at IS NOT NULL AND refunded_at IS NULL) AS issues
         FROM partner_leads`
    ),
  ]);
  return ok({
    rows,
    total: Number(total),
    totalPages: Math.max(1, Math.ceil(Number(total) / limit)),
    counts: {
      new: Number(counts[0].new_count || 0),
      crm_failed: Number(counts[0].crm_failed || 0),
      issues: Number(counts[0].issues || 0),
    },
  });
});
