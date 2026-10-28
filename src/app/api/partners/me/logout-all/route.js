import db from "@/lib/db";
import { ok, handle, assertSameOrigin } from "@/lib/partners/http";
import { requirePartner, clearPartnerSessionCookie } from "@/lib/partners/auth";

export const runtime = "nodejs";

/** Invalidates every partner session (all devices), including this one. */
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  await db.query("UPDATE partners SET session_version = session_version + 1 WHERE id = ?", [p.id]);
  const res = ok(null);
  clearPartnerSessionCookie(res);
  return res;
});
