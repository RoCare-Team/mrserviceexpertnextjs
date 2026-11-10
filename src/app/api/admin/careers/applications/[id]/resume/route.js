import db from "@/lib/db";
import { ok, handle, requireAdmin, logAdmin, toInt, HttpError, rateLimit } from "@/lib/careers/http";
import { getResumeKey, logEvent } from "@/lib/careers/applications";
import { resumeDownloadUrl } from "@/lib/careers/resume";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET [?inline=1] → { url } valid for 5 minutes. Every access is logged. */
export const GET = handle(async (req, ctx) => {
  const admin = await requireAdmin(req);
  rateLimit(`careers-resume:${admin.id}`, 60, 10 * 60_000);
  const id = toInt((await ctx.params).id);
  if (!id) throw new HttpError(400, "bad_request", "Invalid application id.");
  const a = await getResumeKey(id);
  const inline = new URL(req.url).searchParams.get("inline") === "1";
  const url = await resumeDownloadUrl(a.resume_key, a.resume_original_name || `${a.full_name}-resume`, { inline });
  await logEvent(db, id, "resume_downloaded", { admin, remarks: inline ? "Resume viewed." : "Resume downloaded." });
  await logAdmin(admin, "application", id, "resume_download", null, req);
  return ok({ url, expiresIn: 300 });
});
