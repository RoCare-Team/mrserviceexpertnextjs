import { ok, handle, readJson, rateLimit, clientIp, assertSameOrigin } from "@/lib/careers/http";
import { createResumeUpload } from "@/lib/careers/applications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST { jobId, fileName, fileSize, mimeType } → { uploadUrl, uploadToken, contentType }
 * Validates size (≤ 5 MB) / format BEFORE any S3 URL is issued.
 */
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  rateLimit(`careers-upload:${ip}`, 10, 10 * 60_000);
  const body = await readJson(req);
  const data = await createResumeUpload({
    jobId: Number(body.jobId),
    fileName: String(body.fileName || ""),
    fileSize: Number(body.fileSize),
    mimeType: String(body.mimeType || ""),
    ip,
  });
  return ok(data);
});
