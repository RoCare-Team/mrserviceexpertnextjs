import { ok, handle, readJson, assertSameOrigin, clientIp, rateLimit } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { submitApplication, getApplication } from "@/lib/partners/application";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  rateLimit(`partner-submit:${p.id}`, 5, 60_000);

  const body = await readJson(req);
  const result = await submitApplication(p.id, {
    consents: body.consents,
    ip: clientIp(req),
    userAgent: req.headers.get("user-agent"),
  });
  return ok({ ...result, application: await getApplication(p.id) });
});
