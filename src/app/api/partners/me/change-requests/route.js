import { ok, handle, readJson, assertSameOrigin, rateLimit } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { submitChangeRequest, getChangeRequests } from "@/lib/partners/application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  const p = await requirePartner(req);
  return ok(await getChangeRequests(p.id));
});

/**
 * Business name / type / GSTIN / categories / services / brands. The live
 * profile keeps its current data until an admin approves.
 */
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  rateLimit(`change-req:${p.id}`, 10, 60 * 60_000);
  await submitChangeRequest(p.id, await readJson(req));
  return ok(await getChangeRequests(p.id));
});
