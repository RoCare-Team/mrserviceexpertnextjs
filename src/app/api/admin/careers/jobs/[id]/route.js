import { ok, handle, requireAdmin, readJson, assertSameOrigin, logAdmin, toInt, HttpError } from "@/lib/careers/http";
import { adminGetJob } from "@/lib/careers/jobs";
import { updateJob, jobAction } from "@/lib/careers/jobAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function jobId(ctx) {
  const id = toInt((await ctx.params).id);
  if (!id) throw new HttpError(400, "bad_request", "Invalid job id.");
  return id;
}

export const GET = handle(async (req, ctx) => {
  await requireAdmin(req);
  return ok(await adminGetJob(await jobId(ctx)));
});

/** PUT { ...job, intent: "update" | "draft" | "publish" } */
export const PUT = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const admin = await requireAdmin(req);
  const id = await jobId(ctx);
  const body = await readJson(req);
  const r = await updateJob(id, body, admin);
  await logAdmin(admin, "job", id, "update", r.from !== r.to ? `status ${r.from} → ${r.to}` : null, req);
  return ok({ id, status: r.to });
});

/** POST { action: publish | unpublish | close | reopen | duplicate | archive | restore } */
export const POST = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const admin = await requireAdmin(req);
  const id = await jobId(ctx);
  const { action } = await readJson(req);
  const r = await jobAction(id, String(action || ""), admin);
  await logAdmin(admin, "job", id, String(action), r.id ? `copy #${r.id}` : null, req);
  return ok(r);
});
