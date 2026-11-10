import { ok, handle, rateLimit, clientIp, HttpError } from "@/lib/careers/http";
import { listOpenJobs, publicFilters } from "@/lib/careers/jobs";
import { getSettings } from "@/lib/careers/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?q=&department=&city=&type=&experience=&page= — open jobs only. */
export const GET = handle(async (req) => {
  rateLimit(`careers-list:${clientIp(req)}`, 120, 60_000);
  const settings = await getSettings();
  if (!settings.careers_page_visible) throw new HttpError(404, "not_found", "Careers page is not available.");
  const sp = new URL(req.url).searchParams;
  const data = await listOpenJobs(publicFilters(sp), { page: Number(sp.get("page")) || 1, limit: 9 });
  return ok(data);
});
