import db from "@/lib/db";
import { ok, handle, requireAdmin, toInt } from "@/lib/partners/http";
import { partnerRef } from "@/lib/partners/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SORTS = {
  id: "p.id",
  business_name: "p.business_name",
  status: "p.status",
  submitted_at: "p.submitted_at",
  reviewed_at: "p.reviewed_at",
};
const STATUSES = ["draft", "pending", "info_requested", "approved", "rejected", "suspended"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/admin/partners?search=&status=&categoryId=&cityId=&from=&to=&sortBy=&sortDir=&page=&limit=
 * cityId matches a city-wide area in that city, a locality inside it, or a
 * locality itself.
 */
export const GET = handle(async (req) => {
  await requireAdmin(req);
  const sp = new URL(req.url).searchParams;

  const page = toInt(sp.get("page")) || 1;
  const limit = Math.min(toInt(sp.get("limit")) || 25, 100);
  const sortBy = SORTS[sp.get("sortBy")] || "p.id";
  const sortDir = sp.get("sortDir") === "ASC" ? "ASC" : "DESC";

  const where = ["p.deleted_at IS NULL"];
  const params = [];

  const search = String(sp.get("search") || "").trim().slice(0, 80);
  if (search) {
    const like = `%${search.replace(/[%_\\]/g, "\\$&")}%`;
    const digits = search.replace(/\D/g, "");
    where.push(`(p.full_name LIKE ? OR p.business_name LIKE ?${digits.length >= 4 ? " OR p.mobile LIKE ?" : ""}${toInt(search.replace(/^MSE-P/i, "")) ? " OR p.id = ?" : ""})`);
    params.push(like, like);
    if (digits.length >= 4) params.push(`%${digits}%`);
    const refId = toInt(search.replace(/^MSE-P/i, ""));
    if (refId) params.push(refId);
  }
  const status = sp.get("status");
  if (STATUSES.includes(status)) {
    where.push("p.status = ?");
    params.push(status);
  }
  const categoryId = toInt(sp.get("categoryId"));
  if (categoryId) {
    where.push("EXISTS (SELECT 1 FROM partner_categories pc WHERE pc.partner_id = p.id AND pc.category_id = ?)");
    params.push(categoryId);
  }
  const cityId = toInt(sp.get("cityId"));
  if (cityId) {
    where.push("EXISTS (SELECT 1 FROM partner_service_areas a WHERE a.partner_id = p.id AND (a.city_id = ? OR a.locality_id = ?))");
    params.push(cityId, cityId);
  }
  const from = sp.get("from");
  if (from && DATE_RE.test(from)) {
    where.push("p.created_at >= ?");
    params.push(`${from} 00:00:00`);
  }
  const to = sp.get("to");
  if (to && DATE_RE.test(to)) {
    where.push("p.created_at <= ?");
    params.push(`${to} 23:59:59`);
  }

  const whereSql = where.join(" AND ");
  const offset = (page - 1) * limit;

  const [[[{ total }]], [rows], [countRows]] = await Promise.all([
    db.query(`SELECT COUNT(*) AS total FROM partners p WHERE ${whereSql}`, params),
    db.query(
      `SELECT p.id, p.full_name, p.business_name, p.mobile, p.mobile_verified_at IS NOT NULL AS mobile_verified,
              p.status, p.is_listed, p.submitted_at, p.reviewed_at, p.created_at, p.slug,
              (SELECT GROUP_CONCAT(c.category_name ORDER BY c.id SEPARATOR ', ')
                 FROM partner_categories pc JOIN category_tb c ON c.id = pc.category_id
                WHERE pc.partner_id = p.id) AS categories,
              (SELECT GROUP_CONCAT(COALESCE(CONCAT(l.city_name, ' (', c.city_name, ')'), c.city_name)
                                   ORDER BY a.is_primary DESC, a.id SEPARATOR ', ')
                 FROM partner_service_areas a
                 JOIN city_tb c ON c.id = a.city_id
                 LEFT JOIN city_tb l ON l.id = a.locality_id
                WHERE a.partner_id = p.id) AS coverage
         FROM partners p
        WHERE ${whereSql}
        ORDER BY ${sortBy} ${sortDir}, p.id DESC
        LIMIT ${limit} OFFSET ${offset}`,
      params
    ),
    db.query("SELECT status, COUNT(*) AS n FROM partners WHERE deleted_at IS NULL GROUP BY status"),
  ]);

  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  for (const r of countRows) counts[r.status] = Number(r.n);

  return ok({
    rows: rows.map((r) => ({ ...r, ref: partnerRef(r.id), mobile_verified: !!r.mobile_verified, is_listed: !!r.is_listed })),
    total: Number(total),
    page,
    totalPages: Math.max(1, Math.ceil(Number(total) / limit)),
    counts,
  });
});
