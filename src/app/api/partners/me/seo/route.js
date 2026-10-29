import { ok, handle, readJson, assertSameOrigin, rateLimit, HttpError } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { getApplication } from "@/lib/partners/application";
import { generatePartnerSeo } from "@/lib/partners/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120; // one OpenAI call, retried once

/**
 * Regenerate the partner's search copy (overview + meta) and, optionally, the
 * About text.  { about: "always" | "never" }  — defaults to "never" so a
 * partner refreshing the snippet never loses an About they wrote themselves.
 */
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  rateLimit(`partner-seo:${p.id}`, 6, 60 * 60_000);
  const body = await readJson(req);
  const about = body.about === "always" ? "always" : "never";
  const r = await generatePartnerSeo(p.id, { force: true, about });
  if (!r.ok) {
    throw new HttpError(422, "incomplete", "Add at least one category and your business name first — the text is written from those.");
  }
  return ok(await getApplication(p.id));
});
