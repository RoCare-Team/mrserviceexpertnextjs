import { after } from "next/server";
import { ok, handle, readJson, rateLimit, clientIp, assertSameOrigin } from "@/lib/careers/http";
import { submitApplication, logEvent } from "@/lib/careers/applications";
import { getSettings } from "@/lib/careers/settings";
import { sendAdminNewApplication, sendCandidateConfirmation } from "@/lib/careers/mail";
import db from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** POST — submit an application (no login). Emails go out after the response. */
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const ip = clientIp(req);
  rateLimit(`careers-apply:${ip}`, 6, 10 * 60_000);
  const body = await readJson(req);
  const settings = await getSettings();
  const app = await submitApplication(body, { ip, userAgent: req.headers.get("user-agent"), settings });

  // Notifications never affect the saved application.
  after(async () => {
    try {
      if (settings.notify_admin_new_application) {
        const sent = await sendAdminNewApplication(settings, app, app.job);
        if (!sent) await logEvent(db, app.id, "email_failed", { remarks: "Admin notification email was not sent (SMTP not configured or failed)." });
      }
      if (settings.notify_candidate_confirmation) {
        const sent = await sendCandidateConfirmation(settings, app, app.job);
        await logEvent(db, app.id, sent ? "email_sent" : "email_failed", {
          remarks: sent ? "Application confirmation emailed to the candidate." : "Candidate confirmation email could not be sent.",
        });
      }
    } catch (err) {
      console.error("[careers] post-submit notifications", err?.message);
    }
  });

  return ok({
    applicationCode: app.application_code,
    jobTitle: app.job.title,
    message: settings.application_confirmation_message,
  });
});
