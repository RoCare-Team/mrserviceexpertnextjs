// Route helpers for the careers APIs. Re-uses the partner response contract
// ({ success, data } / { success:false, error }) and adds a careers-specific
// error wrapper + admin activity logging.

import db from "@/lib/db";
import { ok, fail, HttpError, readJson, assertSameOrigin, clientIp, rateLimit, requireAdmin, toInt } from "@/lib/partners/http";

export { ok, fail, HttpError, readJson, assertSameOrigin, clientIp, rateLimit, requireAdmin, toInt };

export function handle(fn) {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      if (err instanceof HttpError) return fail(err.status, err.code, err.message, err.fields);
      console.error("[careers]", err);
      if (err?.code === "ER_NO_SUCH_TABLE" || err?.code === "ER_BAD_FIELD_ERROR") {
        return fail(503, "not_configured", "Careers database is not set up yet (run scripts/run-migrations.mjs --commit).");
      }
      return fail(500, "server_error", "Something went wrong. Please try again.");
    }
  };
}

export async function requireSuperAdmin(req) {
  const admin = await requireAdmin(req);
  if (admin.role !== "super_admin") throw new HttpError(403, "forbidden", "Only a super admin can do this.");
  return admin;
}

/** Best-effort audit trail; never throws. */
export async function logAdmin(admin, entity, entityId, action, details = null, req = null) {
  try {
    await db.query(
      "INSERT INTO career_admin_activity (admin_id, admin_name, entity, entity_id, action, details, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [admin?.id || null, admin?.name || null, entity, entityId || null, action, details ? String(details).slice(0, 1000) : null, req ? clientIp(req) || null : null]
    );
  } catch (err) {
    console.error("[careers] activity log failed:", err?.message);
  }
}
