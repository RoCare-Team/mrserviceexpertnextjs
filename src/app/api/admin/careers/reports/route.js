import db from "@/lib/db";
import { ok, handle, requireAdmin, toInt } from "@/lib/careers/http";
import { recruitmentReport } from "@/lib/careers/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** GET ?from=YYYY-MM-DD&to=YYYY-MM-DD&jobId= */
export const GET = handle(async (req) => {
  await requireAdmin(req);
  const sp = new URL(req.url).searchParams;
  const from = DATE.test(sp.get("from") || "") ? sp.get("from") : null;
  const to = DATE.test(sp.get("to") || "") ? sp.get("to") : null;
  const [report, [jobs]] = await Promise.all([
    recruitmentReport({ from, to, jobId: toInt(sp.get("jobId")) }),
    db.query("SELECT id, title FROM career_jobs ORDER BY title"),
  ]);
  return ok({ ...report, jobs });
});
