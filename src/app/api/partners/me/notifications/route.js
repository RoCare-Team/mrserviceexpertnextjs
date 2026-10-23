import db from "@/lib/db";
import { ok, handle, readJson, assertSameOrigin } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { vapidPublicKey } from "@/lib/partners/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  const p = await requirePartner(req);
  const [rows] = await db.query(
    "SELECT id, type, title, body, link, read_at, created_at FROM partner_notifications WHERE partner_id = ? ORDER BY id DESC LIMIT 50",
    [p.id]
  );
  const [[{ unread }]] = await db.query("SELECT COUNT(*) AS unread FROM partner_notifications WHERE partner_id = ? AND read_at IS NULL", [p.id]);
  return ok({ items: rows, unread: Number(unread), vapidPublicKey: vapidPublicKey() });
});

/** { ids?: number[] } — marks those (or all) as read. */
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  const body = await readJson(req);
  const ids = Array.isArray(body.ids) ? body.ids.map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 200) : null;
  if (ids?.length) {
    await db.query("UPDATE partner_notifications SET read_at = NOW() WHERE partner_id = ? AND id IN (?) AND read_at IS NULL", [p.id, ids]);
  } else {
    await db.query("UPDATE partner_notifications SET read_at = NOW() WHERE partner_id = ? AND read_at IS NULL", [p.id]);
  }
  return ok(null);
});
