import { after } from "next/server";
import db from "@/lib/db";
import { ok, handle, requireAdmin, readJson, assertSameOrigin, logAdmin, toInt, HttpError } from "@/lib/careers/http";
import { updateInterview } from "@/lib/careers/interviews";
import { logEvent } from "@/lib/careers/applications";
import { getSettings } from "@/lib/careers/settings";
import { sendCandidateInterview } from "@/lib/careers/mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST { action: "reschedule", date, time, …, notify }
 *      { action: "cancel", reason, notify }
 *      { action: "feedback" | "complete", feedback, result }
 */
export const POST = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const admin = await requireAdmin(req);
  const id = toInt((await ctx.params).id);
  if (!id) throw new HttpError(400, "bad_request", "Invalid interview id.");
  const body = await readJson(req);
  const action = String(body.action || "");
  const { iv, app, kind } = await updateInterview(id, action, body, admin);
  await logAdmin(admin, "interview", id, action, `application #${iv.application_id}`, req);

  let emailQueued = false;
  if (kind && body.notify && (await getSettings()).notify_candidate_interview) {
    emailQueued = true;
    after(async () => {
      const sent = await sendCandidateInterview(app, app.job_title, iv, kind);
      await logEvent(db, iv.application_id, sent ? "email_sent" : "email_failed", {
        admin,
        remarks: `Interview ${kind} email (round ${iv.round_no}) ${sent ? "sent" : "could not be sent"}.`,
      }).catch(() => {});
    });
  }
  return ok({ id, emailQueued });
});
