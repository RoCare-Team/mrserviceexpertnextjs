import { after } from "next/server";
import db from "@/lib/db";
import { ok, handle, requireAdmin, readJson, assertSameOrigin, logAdmin, toInt, HttpError } from "@/lib/careers/http";
import { getApplication, changeStatus, addNote, anonymizeApplication, logEvent } from "@/lib/careers/applications";
import { getSettings } from "@/lib/careers/settings";
import { sendCandidateStatus } from "@/lib/careers/mail";
import { NOTIFY_STATUSES, APPLICATION_STATUSES } from "@/lib/careers/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function appId(ctx) {
  const id = toInt((await ctx.params).id);
  if (!id) throw new HttpError(400, "bad_request", "Invalid application id.");
  return id;
}

export const GET = handle(async (req, ctx) => {
  await requireAdmin(req);
  const data = await getApplication(await appId(ctx));
  const settings = await getSettings();
  return ok({ ...data, can_email_status: settings.notify_candidate_status, can_email_interview: settings.notify_candidate_interview });
});

/**
 * POST { action: "status", status, remarks?, notify? }
 *      { action: "note", note }
 *      { action: "anonymize", reason? }   (super admin only)
 */
export const POST = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const admin = await requireAdmin(req);
  const id = await appId(ctx);
  const body = await readJson(req);

  if (body.action === "status") {
    const remarks = String(body.remarks || "").trim().slice(0, 1000) || null;
    const r = await changeStatus(id, String(body.status || ""), { remarks, admin });
    await logAdmin(admin, "application", id, "status", `${r.from} → ${r.to}`, req);
    let emailQueued = false;
    if (body.notify && NOTIFY_STATUSES.includes(r.to)) {
      const settings = await getSettings();
      if (settings.notify_candidate_status) {
        emailQueued = true;
        after(async () => {
          const sent = await sendCandidateStatus(r.app, r.app.job_title, r.to);
          await logEvent(db, id, sent ? "email_sent" : "email_failed", {
            admin,
            remarks: `${APPLICATION_STATUSES[r.to]} email ${sent ? "sent to the candidate" : "could not be sent"}.`,
          }).catch(() => {});
        });
      }
    }
    return ok({ status: r.to, emailQueued });
  }

  if (body.action === "note") {
    await addNote(id, body.note, admin);
    await logAdmin(admin, "application", id, "note", null, req);
    return ok({ added: true });
  }

  if (body.action === "anonymize") {
    if (admin.role !== "super_admin") throw new HttpError(403, "forbidden", "Only a super admin can erase candidate data.");
    const reason = String(body.reason || "").trim().slice(0, 300) || "Personal data erased on request.";
    const done = await anonymizeApplication(id, admin, reason);
    await logAdmin(admin, "application", id, "anonymize", reason, req);
    return ok({ anonymized: done });
  }

  throw new HttpError(400, "bad_request", "Unknown action.");
});
