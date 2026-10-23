import db from "@/lib/db";
import { ok, handle, assertSameOrigin, toInt, HttpError } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { getApplication } from "@/lib/partners/application";
import { deleteObject } from "@/lib/partners/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const DELETE = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  const id = toInt((await ctx.params).photoId);
  const [[ph]] = await db.query("SELECT id, s3_key FROM partner_photos WHERE id = ? AND partner_id = ?", [id || 0, p.id]);
  if (!ph) throw new HttpError(404, "not_found", "Photo not found.");
  await db.query("DELETE FROM partner_photos WHERE id = ?", [ph.id]);
  await deleteObject(ph.s3_key);
  return ok(await getApplication(p.id));
});
