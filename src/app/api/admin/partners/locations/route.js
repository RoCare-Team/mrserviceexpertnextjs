import db from "@/lib/db";
import { ok, handle, requireAdmin, readJson, toInt, HttpError } from "@/lib/partners/http";
import { withTransaction, logHistory } from "@/lib/partners/application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Locality hierarchy (city_parent_map) + partners' "my locality isn't listed"
 * requests.
 *
 * GET  ?search=sohna          → any city_tb rows (with their parent, if any)
 * GET  ?parentId=316          → localities mapped under that city
 * GET                          → pending locality requests
 * POST { city_id, parent_city_id }          → make city_id a locality of parent
 * DELETE ?cityId=355                         → un-map (only if no partner uses it)
 * PATCH { request_id, action: map|reject, locality_id? }
 */
export const GET = handle(async (req) => {
  await requireAdmin(req);
  const sp = new URL(req.url).searchParams;

  const search = String(sp.get("search") || "").trim().slice(0, 60);
  if (search) {
    const [rows] = await db.query(
      `SELECT c.id, c.city_name, c.city_url, c.state, m.parent_city_id, p.city_name AS parent_name,
              (SELECT COUNT(*) FROM city_parent_map x WHERE x.parent_city_id = c.id) AS child_count
         FROM city_tb c
         LEFT JOIN city_parent_map m ON m.city_id = c.id
         LEFT JOIN city_tb p ON p.id = m.parent_city_id
        WHERE c.city_name LIKE ? AND c.status = '1'
        ORDER BY c.city_name LIMIT 30`,
      [`${search.replace(/[%_\\]/g, "\\$&")}%`]
    );
    return ok(rows);
  }

  const parentId = toInt(sp.get("parentId"));
  if (parentId) {
    const [rows] = await db.query(
      `SELECT c.id, c.city_name, c.city_url,
              (SELECT COUNT(*) FROM partner_service_areas a WHERE a.locality_id = c.id) AS partner_count
         FROM city_parent_map m JOIN city_tb c ON c.id = m.city_id
        WHERE m.parent_city_id = ? ORDER BY c.city_name`,
      [parentId]
    );
    return ok(rows);
  }

  const [requests] = await db.query(
    `SELECT r.id, r.partner_id, p.business_name, p.full_name, r.city_id, c.city_name, r.requested_name, r.created_at
       FROM partner_location_requests r
       JOIN partners p ON p.id = r.partner_id
       JOIN city_tb c ON c.id = r.city_id
      WHERE r.status = 'pending' ORDER BY r.id DESC LIMIT 200`
  );
  return ok(requests);
});

export const POST = handle(async (req) => {
  await requireAdmin(req);
  const body = await readJson(req);
  const cityId = toInt(body.city_id);
  const parentId = toInt(body.parent_city_id);
  if (!cityId || !parentId || cityId === parentId) throw new HttpError(422, "validation_error", "Choose a locality and a different parent city.");

  const [[child]] = await db.query("SELECT id FROM city_tb WHERE id = ?", [cityId]);
  const [[parent]] = await db.query("SELECT id FROM city_tb WHERE id = ?", [parentId]);
  if (!child || !parent) throw new HttpError(404, "not_found", "City not found.");
  const [[parentIsChild]] = await db.query("SELECT 1 AS x FROM city_parent_map WHERE city_id = ?", [parentId]);
  if (parentIsChild) throw new HttpError(409, "conflict", "The parent is itself a locality. Choose a top-level city.");
  const [[hasChildren]] = await db.query("SELECT 1 AS x FROM city_parent_map WHERE parent_city_id = ? LIMIT 1", [cityId]);
  if (hasChildren) throw new HttpError(409, "conflict", "This city has its own localities, so it can't become a locality.");
  const [[usedAsCity]] = await db.query("SELECT 1 AS x FROM partner_service_areas WHERE city_id = ? LIMIT 1", [cityId]);
  if (usedAsCity) throw new HttpError(409, "conflict", "Partners already serve this as a city. Update their coverage first.");

  await db.query(
    `INSERT INTO city_parent_map (city_id, parent_city_id) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE parent_city_id = VALUES(parent_city_id)`,
    [cityId, parentId]
  );
  return ok({ city_id: cityId, parent_city_id: parentId });
});

export const DELETE = handle(async (req) => {
  await requireAdmin(req);
  const cityId = toInt(new URL(req.url).searchParams.get("cityId"));
  if (!cityId) throw new HttpError(422, "validation_error", "cityId is required.");
  const [[used]] = await db.query("SELECT COUNT(*) AS n FROM partner_service_areas WHERE locality_id = ?", [cityId]);
  if (used.n) throw new HttpError(409, "conflict", `${used.n} partner service area(s) use this locality. Update them first.`);
  await db.query("DELETE FROM city_parent_map WHERE city_id = ?", [cityId]);
  return ok(null);
});

export const PATCH = handle(async (req) => {
  const admin = await requireAdmin(req);
  const body = await readJson(req);
  const requestId = toInt(body.request_id);
  if (!requestId || !["map", "reject"].includes(body.action)) throw new HttpError(422, "validation_error", "Invalid request.");

  return withTransaction(async (conn) => {
    const [[r]] = await conn.query("SELECT * FROM partner_location_requests WHERE id = ? FOR UPDATE", [requestId]);
    if (!r || r.status !== "pending") throw new HttpError(404, "not_found", "Request not found or already handled.");

    if (body.action === "reject") {
      await conn.query(
        "UPDATE partner_location_requests SET status = 'rejected', resolved_by = ?, resolved_at = NOW() WHERE id = ?",
        [admin.id, requestId]
      );
      return ok(null);
    }

    const localityId = toInt(body.locality_id);
    const [[m]] = await conn.query("SELECT 1 AS x FROM city_parent_map WHERE city_id = ? AND parent_city_id = ?", [localityId, r.city_id]);
    if (!m) throw new HttpError(422, "validation_error", "Map the request to a locality of the same city (add it under Localities first).");

    await conn.query(
      "INSERT IGNORE INTO partner_service_areas (partner_id, city_id, locality_id) VALUES (?, ?, ?)",
      [r.partner_id, r.city_id, localityId]
    );
    await conn.query(
      `UPDATE partner_location_requests SET status = 'mapped', mapped_locality_id = ?, resolved_by = ?, resolved_at = NOW()
        WHERE id = ?`,
      [localityId, admin.id, requestId]
    );
    await logHistory(conn, {
      partnerId: r.partner_id,
      action: "locality_added",
      reason: `Requested “${r.requested_name}” mapped to locality #${localityId}`,
      actorType: "admin",
      actorId: admin.id,
    });
    return ok(null);
  });
});
