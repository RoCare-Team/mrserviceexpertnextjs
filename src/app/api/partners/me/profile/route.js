import { ok, handle, readJson, assertSameOrigin, rateLimit, HttpError } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { saveLiveDetails, saveLiveLocations, getApplication } from "@/lib/partners/application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Live edits for approved partners — visible immediately, no re-review.
 * { kind: "details", data: { description, operating_hours, experience_years, business_email } }
 * { kind: "locations", data: { address, areas, locality_requests } }
 */
export const PATCH = handle(async (req) => {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  rateLimit(`profile-live:${p.id}`, 30, 60_000);
  const body = await readJson(req);
  if (body.kind === "details") await saveLiveDetails(p.id, body.data || {});
  else if (body.kind === "locations") await saveLiveLocations(p.id, body.data || {});
  else throw new HttpError(400, "bad_kind", "Unknown profile section.");
  return ok(await getApplication(p.id));
});
