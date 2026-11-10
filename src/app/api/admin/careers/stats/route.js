import { ok, handle, requireAdmin } from "@/lib/careers/http";
import { dashboardStats } from "@/lib/careers/stats";
import { expireJobs } from "@/lib/careers/jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handle(async (req) => {
  await requireAdmin(req);
  // Opportunistic expiry so the dashboard is right even without the cron.
  await expireJobs().catch((e) => console.error("[careers] expire", e?.message));
  return ok(await dashboardStats());
});
