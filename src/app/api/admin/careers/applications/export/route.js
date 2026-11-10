import { handle, requireAdmin, logAdmin } from "@/lib/careers/http";
import { exportApplications } from "@/lib/careers/applications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET (same filters as the list) [&contact=1] → CSV download.
 * Never includes resumes, cover letters, salaries or notes. Contact details
 * only when explicitly requested; every export is written to the audit log.
 */
export const GET = handle(async (req) => {
  const admin = await requireAdmin(req);
  const sp = new URL(req.url).searchParams;
  const includeContact = sp.get("contact") === "1";
  const { csv, count } = await exportApplications(sp, { includeContact });
  const filters = [...sp.entries()].filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join("&");
  await logAdmin(admin, "export", null, includeContact ? "export_with_contact" : "export", `${count} rows${filters ? ` · ${filters}` : ""}`, req);
  const stamp = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="applications-${stamp}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
});
