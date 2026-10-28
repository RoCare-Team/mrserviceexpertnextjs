import db from "@/lib/db";
import { ok, handle, requireAdmin, readJson, toInt, HttpError } from "@/lib/partners/http";
import { getApplication, getChangeRequests } from "@/lib/partners/application";
import { getWallet } from "@/lib/partners/wallet";
import { listReviewsForOwner } from "@/lib/partners/reviews";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function partnerId(ctx) {
  const id = toInt((await ctx.params).id);
  if (!id) throw new HttpError(404, "not_found", "Partner not found.");
  return id;
}

export const GET = handle(async (req, ctx) => {
  await requireAdmin(req);
  const id = await partnerId(ctx);
  const app = await getApplication(id, { forAdmin: true });
  if (!app) throw new HttpError(404, "not_found", "Partner not found.");
  const [wallet, reviews, changeRequests] = await Promise.all([getWallet(id, { limit: 20 }), listReviewsForOwner(id), getChangeRequests(id)]);
  return ok({ ...app, wallet, reviews, change_requests: changeRequests });
});

/** Internal note only — status changes go through /status. */
export const PATCH = handle(async (req, ctx) => {
  await requireAdmin(req);
  const id = await partnerId(ctx);
  const body = await readJson(req);
  const note = String(body.admin_note ?? "").trim().slice(0, 2000);
  const [r] = await db.query("UPDATE partners SET admin_note = ? WHERE id = ? AND deleted_at IS NULL", [note || null, id]);
  if (!r.affectedRows) throw new HttpError(404, "not_found", "Partner not found.");
  return ok(await getApplication(id, { forAdmin: true }));
});
