import db from "@/lib/db";
import { ok, handle, readJson, assertSameOrigin, HttpError } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { endpointHash } from "@/lib/partners/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parse(body) {
  const sub = body?.subscription;
  const endpoint = String(sub?.endpoint || "");
  if (!/^https:\/\/.{10,590}$/.test(endpoint)) throw new HttpError(422, "validation_error", "Invalid push subscription.");
  return { endpoint, p256dh: String(sub?.keys?.p256dh || "").slice(0, 200), auth: String(sub?.keys?.auth || "").slice(0, 100) };
}

/** Save this browser's push subscription. */
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  const s = parse(await readJson(req));
  if (!s.p256dh || !s.auth) throw new HttpError(422, "validation_error", "Invalid push subscription.");
  await db.query(
    `INSERT INTO partner_push_subscriptions (partner_id, endpoint, endpoint_hash, p256dh, auth, user_agent)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE partner_id = VALUES(partner_id), p256dh = VALUES(p256dh), auth = VALUES(auth)`,
    [p.id, s.endpoint, endpointHash(s.endpoint), s.p256dh, s.auth, String(req.headers.get("user-agent") || "").slice(0, 255)]
  );
  return ok(null);
});

export const DELETE = handle(async (req) => {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  const s = parse(await readJson(req));
  await db.query("DELETE FROM partner_push_subscriptions WHERE endpoint_hash = ? AND partner_id = ?", [endpointHash(s.endpoint), p.id]);
  return ok(null);
});
