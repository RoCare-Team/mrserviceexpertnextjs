import db from "@/lib/db";
import { ok, handle, readJson, assertSameOrigin, HttpError } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { logHistory, withTransaction } from "@/lib/partners/application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** { is_available?: boolean, low_balance_alert?: number } */
export const PATCH = handle(async (req) => {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  const body = await readJson(req);
  const sets = [];
  const vals = [];
  if (body.is_available !== undefined) {
    sets.push("is_available = ?");
    vals.push(body.is_available ? 1 : 0);
  }
  if (body.low_balance_alert !== undefined) {
    const n = Number(body.low_balance_alert);
    if (!Number.isInteger(n) || n < 0 || n > 100000) throw new HttpError(422, "validation_error", "Enter a whole number of coins (0–100000).");
    sets.push("low_balance_alert = ?");
    vals.push(n);
  }
  if (!sets.length) throw new HttpError(422, "validation_error", "Nothing to update.");

  await withTransaction(async (conn) => {
    await conn.query(`UPDATE partners SET ${sets.join(", ")} WHERE id = ?`, [...vals, p.id]);
    if (body.is_available !== undefined && !!body.is_available !== !!p.is_available) {
      await logHistory(conn, {
        partnerId: p.id,
        action: body.is_available ? "went_online" : "went_offline",
        actorType: "partner",
        actorId: p.id,
      });
    }
  });
  const [[row]] = await db.query("SELECT is_available, low_balance_alert FROM partners WHERE id = ?", [p.id]);
  return ok({ is_available: !!row.is_available, low_balance_alert: row.low_balance_alert });
});
