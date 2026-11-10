import db from "@/lib/db";
import { ok, handle, requireAdmin } from "@/lib/careers/http";
import { adminListApplications } from "@/lib/careers/applications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?search=&jobId=&status=&city=&experience=&from=&to=&sort=&dir=&page=&limit= */
export const GET = handle(async (req) => {
  await requireAdmin(req);
  const sp = new URL(req.url).searchParams;
  const [data, [jobs], [counts]] = await Promise.all([
    adminListApplications(sp),
    db.query("SELECT id, title, status FROM career_jobs ORDER BY status = 'archived', title"),
    db.query("SELECT status, COUNT(*) AS n FROM career_applications GROUP BY status"),
  ]);
  return ok({ ...data, jobs, counts: Object.fromEntries(counts.map((c) => [c.status, Number(c.n)])) });
});
