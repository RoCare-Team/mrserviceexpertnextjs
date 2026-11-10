import { after } from "next/server";
import db from "@/lib/db";
import { ok, handle, requireAdmin, readJson, assertSameOrigin, logAdmin, toInt, HttpError } from "@/lib/careers/http";
import { listInterviews, scheduleInterview } from "@/lib/careers/interviews";
import { logEvent } from "@/lib/careers/applications";
import { getSettings } from "@/lib/careers/settings";
import { sendCandidateInterview } from "@/lib/careers/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?scope=upcoming|past|cancelled|all */
export const GET = handle(async (req) => {
  await requireAdmin(req);
  return ok({ rows: await listInterviews(new URL(req.url).searchParams) });
});

/** POST { applicationId, round_no?, round_name, date, time, duration_minutes, mode, meeting_link, location, interviewer_name, notify } */
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const admin = await requireAdmin(req);
  const body = await readJson(req);
  const applicationId = toInt(body.applicationId);
  if (!applicationId) throw new HttpError(400, "bad_request", "Invalid application.");
  const { iv, app, statusChanged } = await scheduleInterview(applicationId, body, admin);
  await logAdmin(admin, "interview", iv.id, "schedule", `application #${applicationId}`, req);

  let emailQueued = false;
  if (body.notify && (await getSettings()).notify_candidate_interview) {
    emailQueued = true;
    after(async () => {
      const sent = await sendCandidateInterview(app, app.job_title, iv, "scheduled");
      await logEvent(db, applicationId, sent ? "email_sent" : "email_failed", {
        admin,
        remarks: `Interview invitation (round ${iv.round_no}) ${sent ? "emailed to the candidate" : "could not be emailed"}.`,
      }).catch(() => {});
    });
  }
  return ok({ id: iv.id, statusChanged, emailQueued }, { status: 201 });
});
