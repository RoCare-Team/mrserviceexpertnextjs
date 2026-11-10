import { ok, handle, requireAdmin, readJson, assertSameOrigin, logAdmin } from "@/lib/careers/http";
import { adminListJobs, expireJobs } from "@/lib/careers/jobs";
import { createJob } from "@/lib/careers/jobAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?search=&status=&department=&city=&sort=&dir=&page=&limit= */
export const GET = handle(async (req) => {
  await requireAdmin(req);
  await expireJobs().catch((e) => console.error("[careers] expire", e?.message));
  return ok(await adminListJobs(new URL(req.url).searchParams));
});

/** POST { ...job, intent: "draft" | "publish" } */
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const admin = await requireAdmin(req);
  const body = await readJson(req);
  const id = await createJob(body, admin);
  await logAdmin(admin, "job", id, body.intent === "publish" ? "create_publish" : "create_draft", body.title, req);
  return ok({ id }, { status: 201 });
});
