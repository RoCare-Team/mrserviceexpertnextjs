// Interview rounds per application: schedule, reschedule, cancel, feedback
// and result. Every change is written to the application's activity log.

import db from "@/lib/db";
import { HttpError } from "@/lib/careers/http";
import { logEvent } from "@/lib/careers/applications";
import { INTERVIEW_RESULTS } from "@/lib/careers/constants";

function parseWhen(date, time) {
  const d = String(date || "");
  const t = String(time || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !/^\d{2}:\d{2}$/.test(t)) return null;
  return `${d} ${t}:00`;
}

function validate(body, { requireWhen = true } = {}) {
  const f = {};
  const out = {
    round_name: String(body.round_name || "").trim().slice(0, 80),
    mode: body.mode === "offline" ? "offline" : "online",
    meeting_link: String(body.meeting_link || "").trim().slice(0, 500) || null,
    location: String(body.location || "").trim().slice(0, 300) || null,
    interviewer_name: String(body.interviewer_name || "").trim().slice(0, 120) || null,
    duration_minutes: Number(body.duration_minutes) || 30,
    scheduled_at: parseWhen(body.date, body.time),
  };
  if (requireWhen && !out.scheduled_at) f.date = "Choose the interview date and time.";
  if (out.mode === "online" && out.meeting_link && !/^https:\/\/\S+$/i.test(out.meeting_link)) f.meeting_link = "Enter a full https:// meeting link.";
  if (out.mode === "offline" && !out.location) f.location = "Enter the interview location.";
  if (!Number.isInteger(out.duration_minutes) || out.duration_minutes < 5 || out.duration_minutes > 480) f.duration_minutes = "Duration must be 5–480 minutes.";
  if (Object.keys(f).length) throw new HttpError(422, "validation", "Please fix the interview details.", f);
  return out;
}

// DB rows give Date objects; freshly validated input gives "YYYY-MM-DD HH:mm:00" (IST).
const toDate = (v) => (v instanceof Date ? v : new Date(`${String(v).replace(" ", "T")}+05:30`));

const describe = (iv) =>
  `Round ${iv.round_no}${iv.round_name ? ` (${iv.round_name})` : ""} on ${toDate(iv.scheduled_at).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  })} · ${iv.mode}`;

async function loadApp(q, applicationId, lock = false) {
  const [[a]] = await q.query(
    `SELECT a.id, a.status, a.application_code, a.full_name, a.email, a.anonymized_at, j.title AS job_title
       FROM career_applications a JOIN career_jobs j ON j.id = a.job_id WHERE a.id = ?${lock ? " FOR UPDATE" : ""}`,
    [applicationId]
  );
  if (!a) throw new HttpError(404, "not_found", "Application not found.");
  if (a.anonymized_at) throw new HttpError(409, "anonymized", "This application's personal data was erased.");
  return a;
}

export async function getInterview(id) {
  const [[iv]] = await db.query("SELECT * FROM career_interviews WHERE id = ?", [id]);
  if (!iv) throw new HttpError(404, "not_found", "Interview not found.");
  return iv;
}

/** Schedules a new round. Moves early-stage applications to interview_scheduled. */
export async function scheduleInterview(applicationId, body, admin) {
  const data = validate(body);
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const app = await loadApp(conn, applicationId, true);
    if (["rejected", "hired", "withdrawn"].includes(app.status)) {
      throw new HttpError(409, "bad_state", "Change the application status before scheduling an interview.");
    }
    const [[{ next }]] = await conn.query("SELECT COALESCE(MAX(round_no), 0) + 1 AS next FROM career_interviews WHERE application_id = ?", [applicationId]);
    const roundNo = Number(body.round_no) > 0 ? Math.min(Number(body.round_no), 20) : Number(next);
    const [ins] = await conn.query(
      `INSERT INTO career_interviews (application_id, round_no, round_name, scheduled_at, duration_minutes, mode, meeting_link, location, interviewer_name, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [applicationId, roundNo, data.round_name, data.scheduled_at, data.duration_minutes, data.mode, data.meeting_link, data.location, data.interviewer_name, admin.id, admin.id]
    );
    const iv = { id: ins.insertId, application_id: applicationId, round_no: roundNo, ...data, scheduled_at: toDate(data.scheduled_at) };
    await logEvent(conn, applicationId, "interview_scheduled", { admin, remarks: describe(iv) });
    let statusChanged = false;
    if (["new", "under_review", "shortlisted"].includes(app.status)) {
      await conn.query("UPDATE career_applications SET status = 'interview_scheduled', status_changed_at = NOW() WHERE id = ?", [applicationId]);
      await logEvent(conn, applicationId, "status_changed", { from: app.status, to: "interview_scheduled", admin, remarks: "Set automatically when the interview was scheduled." });
      statusChanged = true;
    }
    await conn.commit();
    return { iv, app, statusChanged };
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * action: reschedule | cancel | feedback | complete
 * feedback/complete accept { feedback, result }.
 */
export async function updateInterview(id, action, body, admin) {
  const iv = await getInterview(id);
  const app = await loadApp(db, iv.application_id);

  if (action === "reschedule") {
    if (iv.status === "cancelled" || iv.status === "completed") throw new HttpError(409, "bad_state", `A ${iv.status} interview cannot be rescheduled.`);
    const data = validate({ ...iv, ...body, date: body.date, time: body.time });
    await db.query(
      `UPDATE career_interviews SET scheduled_at = ?, duration_minutes = ?, mode = ?, meeting_link = ?, location = ?, interviewer_name = ?,
              round_name = ?, status = 'rescheduled', updated_by = ? WHERE id = ?`,
      [data.scheduled_at, data.duration_minutes, data.mode, data.meeting_link, data.location, data.interviewer_name, data.round_name, admin.id, id]
    );
    const updated = { ...iv, ...data, scheduled_at: toDate(data.scheduled_at) };
    await logEvent(db, iv.application_id, "interview_rescheduled", { admin, remarks: describe(updated) + (body.remarks ? ` — ${String(body.remarks).slice(0, 300)}` : "") });
    return { iv: updated, app, kind: "rescheduled" };
  }

  if (action === "cancel") {
    if (iv.status === "cancelled") throw new HttpError(409, "bad_state", "This interview is already cancelled.");
    if (iv.status === "completed") throw new HttpError(409, "bad_state", "A completed interview cannot be cancelled.");
    const reason = String(body.reason || "").trim().slice(0, 300) || null;
    await db.query("UPDATE career_interviews SET status = 'cancelled', cancel_reason = ?, updated_by = ? WHERE id = ?", [reason, admin.id, id]);
    await logEvent(db, iv.application_id, "interview_cancelled", { admin, remarks: `Round ${iv.round_no}${reason ? ` — ${reason}` : ""}` });
    return { iv: { ...iv, status: "cancelled" }, app, kind: "cancelled" };
  }

  if (action === "feedback" || action === "complete") {
    if (iv.status === "cancelled") throw new HttpError(409, "bad_state", "Feedback cannot be added to a cancelled interview.");
    const result = INTERVIEW_RESULTS[body.result] ? body.result : iv.result;
    const feedback = body.feedback === undefined ? iv.feedback : String(body.feedback || "").trim().slice(0, 5000) || null;
    const complete = action === "complete" || result !== "pending";
    await db.query("UPDATE career_interviews SET feedback = ?, result = ?, status = ?, updated_by = ? WHERE id = ?", [
      feedback,
      result,
      complete ? "completed" : iv.status,
      admin.id,
      id,
    ]);
    if (complete && iv.status !== "completed") {
      await logEvent(db, iv.application_id, "interview_completed", { admin, remarks: `Round ${iv.round_no} — result: ${INTERVIEW_RESULTS[result]}` });
    } else {
      await logEvent(db, iv.application_id, "interview_feedback", { admin, remarks: `Round ${iv.round_no} — result: ${INTERVIEW_RESULTS[result]}` });
    }
    return { iv: { ...iv, feedback, result }, app, kind: null };
  }

  throw new HttpError(400, "bad_request", "Unknown interview action.");
}

/** Interviews list for the admin (upcoming by default). */
export async function listInterviews(sp) {
  const scope = sp.get("scope") || "upcoming";
  const where = [];
  if (scope === "upcoming") where.push("i.status IN ('scheduled','rescheduled') AND i.scheduled_at >= NOW() - INTERVAL 2 HOUR");
  else if (scope === "past") where.push("(i.status = 'completed' OR (i.status IN ('scheduled','rescheduled') AND i.scheduled_at < NOW() - INTERVAL 2 HOUR))");
  else if (scope === "cancelled") where.push("i.status = 'cancelled'");
  else where.push("1=1");
  const limit = Math.min(Number(sp.get("limit")) || 100, 200);
  const [rows] = await db.query(
    `SELECT i.*, a.application_code, a.full_name, a.mobile, a.email, a.status AS application_status, j.title AS job_title
       FROM career_interviews i
       JOIN career_applications a ON a.id = i.application_id
       JOIN career_jobs j ON j.id = a.job_id
      WHERE ${where.join(" AND ")}
      ORDER BY i.scheduled_at ${scope === "upcoming" ? "ASC" : "DESC"}
      LIMIT ${limit}`
  );
  return rows;
}
