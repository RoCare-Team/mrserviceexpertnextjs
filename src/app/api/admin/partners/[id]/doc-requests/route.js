import { ok, handle, requireAdmin, readJson, toInt, HttpError } from "@/lib/partners/http";
import { getApplication } from "@/lib/partners/application";
import { createDocRequest, cancelDocRequest } from "@/lib/partners/docRequests";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function partnerId(ctx) {
  const id = toInt((await ctx.params).id);
  if (!id) throw new HttpError(404, "not_found", "Partner not found.");
  return id;
}

/** Ask the partner for a document: { doc_type, note?, due_date? (YYYY-MM-DD) } */
export const POST = handle(async (req, ctx) => {
  const admin = await requireAdmin(req);
  const id = await partnerId(ctx);
  const body = await readJson(req);
  await createDocRequest(admin, id, body);
  return ok(await getApplication(id, { forAdmin: true }));
});

/** Withdraw a request: { request_id } */
export const DELETE = handle(async (req, ctx) => {
  const admin = await requireAdmin(req);
  const id = await partnerId(ctx);
  const requestId = toInt(new URL(req.url).searchParams.get("request_id"));
  if (!requestId) throw new HttpError(400, "bad_request", "Missing request_id.");
  await cancelDocRequest(admin, id, requestId);
  return ok(await getApplication(id, { forAdmin: true }));
});
