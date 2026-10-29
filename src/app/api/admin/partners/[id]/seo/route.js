import { ok, handle, requireAdmin, readJson, toInt, HttpError } from "@/lib/partners/http";
import { getApplication } from "@/lib/partners/application";
import { generatePartnerSeo } from "@/lib/partners/seo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Admin: rewrite a partner's search copy. { about: "always" | "auto" | "never" } (default "auto"). */
export const POST = handle(async (req, ctx) => {
  await requireAdmin(req);
  const id = toInt((await ctx.params).id);
  if (!id) throw new HttpError(404, "not_found", "Partner not found.");
  const body = await readJson(req);
  const about = ["always", "never"].includes(body.about) ? body.about : "auto";
  const r = await generatePartnerSeo(id, { force: true, about });
  if (!r.ok) throw new HttpError(422, "incomplete", "Partner needs a business name and at least one category first.");
  return ok({ ...(await getApplication(id, { forAdmin: true })), seo_result: r });
});
