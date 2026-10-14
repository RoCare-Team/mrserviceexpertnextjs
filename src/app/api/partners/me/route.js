import { ok, handle, readJson, assertSameOrigin, rateLimit, HttpError } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { getApplication, saveStep } from "@/lib/partners/application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The signed-in partner's own application (the only one they can read). */
export const GET = handle(async (req) => {
  const p = await requirePartner(req);
  return ok(await getApplication(p.id));
});

/** Save one wizard step: { step, version, data }. */
export const PATCH = handle(async (req) => {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  rateLimit(`partner-save:${p.id}`, 60, 60_000);

  const body = await readJson(req);
  const step = Number(body.step);
  if (!Number.isInteger(step) || step < 1 || step > 6) throw new HttpError(400, "bad_step", "Unknown step.");
  await saveStep(p.id, step, body.data, body.version);
  return ok(await getApplication(p.id));
});
