// Candidate applications: resume upload tickets, submission, admin listing,
// status changes (with full history), notes and privacy erasure.

import crypto from "node:crypto";
import db from "@/lib/db";
import { HttpError } from "@/lib/careers/http";
import { getOpenJobById, lockOpenJob, jobCode } from "@/lib/careers/jobs";
import { newResumeKey, presignResumeUpload, verifyUploadedResume, deleteResume } from "@/lib/careers/resume";
import { checkResumeFile, APPLICATION_STATUSES, EXPERIENCE_FILTERS } from "@/lib/careers/constants";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[\p{L}][\p{L} .'-]{1,119}$/u;

export const appCode = (id, year) => `APP-${year}-${String(id).padStart(6, "0")}`;
const istYear = () => Number(new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).slice(0, 4));

export function normalizeMobile(v) {
  let d = String(v || "").replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
  return d;
}

/** Shared activity / status-history writer. `q` = db or a transaction connection. */
export async function logEvent(q, applicationId, event, { from = null, to = null, remarks = null, admin = null } = {}) {
  await q.query(
    "INSERT INTO career_application_logs (application_id, event, from_status, to_status, remarks, admin_id, admin_name) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [applicationId, event, from, to, remarks ? String(remarks).slice(0, 2000) : null, admin?.id || null, admin?.name || null]
  );
}

/* ---------------- Resume upload ticket ---------------- */

export async function createResumeUpload({ jobId, fileName, fileSize, mimeType, ip }) {
  const check = checkResumeFile({ name: fileName, size: fileSize, type: mimeType });
  if (check.error) throw new HttpError(check.code === "file_too_large" ? 413 : 415, check.code, check.error);
  const job = await getOpenJobById(jobId);
  if (!job) throw new HttpError(410, "job_closed", "Applications for this job are closed.");

  if (ip) {
    const [[{ n }]] = await db.query(
      "SELECT COUNT(*) AS n FROM career_resume_uploads WHERE ip_address = ? AND created_at > NOW() - INTERVAL 1 HOUR",
      [ip]
    );
    if (Number(n) >= 20) throw new HttpError(429, "rate_limited", "Too many upload attempts. Please try again later.");
  }

  const key = newResumeKey(check.ext);
  const token = crypto.randomBytes(24).toString("hex");
  const originalName = String(fileName).replace(/[\u0000-\u001f\\/]+/g, "_").slice(-255);
  const uploadUrl = await presignResumeUpload({ key, mime: check.mime, size: Number(fileSize) });
  await db.query(
    "INSERT INTO career_resume_uploads (upload_token, s3_key, job_id, original_name, mime, declared_size, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [token, key, job.id, originalName, check.mime, Number(fileSize), ip || null]
  );
  return { uploadUrl, uploadToken: token, contentType: check.mime, expiresIn: 300 };
}

/* ---------------- Submission ---------------- */

export function validateApplication(body, settings) {
  const f = {};
  const s = (k, max) => String(body[k] ?? "").trim().replace(/\s+/g, " ").slice(0, max);
  const opt = (k, max) => s(k, max) || null;
  const app = {
    full_name: s("full_name", 120),
    mobile: normalizeMobile(body.mobile),
    email: s("email", 190).toLowerCase(),
    current_city: s("current_city", 80),
    total_experience: body.total_experience === "" || body.total_experience === undefined ? NaN : Number(body.total_experience),
    current_company: opt("current_company", 150),
    current_salary: settings.show_salary_fields ? opt("current_salary", 60) : null,
    expected_salary: settings.show_salary_fields ? opt("expected_salary", 60) : null,
    notice_period: opt("notice_period", 60),
    cover_letter: String(body.cover_letter ?? "").trim().slice(0, 5000) || null,
  };
  if (!NAME_RE.test(app.full_name)) f.full_name = "Enter your full name (letters only).";
  if (!/^[6-9]\d{9}$/.test(app.mobile)) f.mobile = "Enter a valid 10-digit mobile number.";
  if (!EMAIL_RE.test(app.email)) f.email = "Enter a valid email address.";
  if (app.current_city.length < 2) f.current_city = "Enter your current city.";
  if (!Number.isFinite(app.total_experience) || app.total_experience < 0 || app.total_experience > 50)
    f.total_experience = "Enter your total experience in years (0–50).";
  else app.total_experience = Math.round(app.total_experience * 10) / 10;
  if (settings.require_cover_letter && (!app.cover_letter || app.cover_letter.length < 30))
    f.cover_letter = "Please write a short cover letter (at least 30 characters).";
  if (!body.consent) f.consent = "Please accept the privacy notice to continue.";
  if (!body.uploadToken || !/^[a-f0-9]{48}$/.test(String(body.uploadToken))) f.resume = "Please upload your resume / CV.";
  if (Object.keys(f).length) throw new HttpError(422, "validation", "Please correct the highlighted fields.", f);
  return app;
}

export async function submitApplication(body, { ip, userAgent, settings }) {
  // Spam: honeypot + minimum fill time.
  if (body.website) throw new HttpError(400, "spam", "Your application could not be submitted.");
  const startedAt = Number(body.startedAt);
  if (Number.isFinite(startedAt) && startedAt > 0 && Date.now() - startedAt < 3000) {
    throw new HttpError(400, "spam", "Please take a moment to review your details and submit again.");
  }

  const jobId = Number(body.jobId);
  if (!Number.isInteger(jobId) || jobId <= 0) throw new HttpError(400, "bad_request", "Invalid job.");
  const app = validateApplication(body, settings);

  if (ip) {
    const [[{ n }]] = await db.query("SELECT COUNT(*) AS n FROM career_applications WHERE ip_address = ? AND created_at > NOW() - INTERVAL 1 HOUR", [ip]);
    if (Number(n) >= 5) throw new HttpError(429, "rate_limited", "Too many applications from your network. Please try again later.");
  }

  const [[upload]] = await db.query(
    "SELECT * FROM career_resume_uploads WHERE upload_token = ? AND consumed_at IS NULL AND created_at > NOW() - INTERVAL 2 HOUR",
    [body.uploadToken]
  );
  if (!upload || upload.job_id !== jobId) {
    throw new HttpError(422, "validation", "Your resume upload has expired. Please upload it again.", { resume: "Please upload your resume again." });
  }
  // Verify the object in S3 before taking any locks (network call).
  const verified = await verifyUploadedResume({ key: upload.s3_key, declaredSize: upload.declared_size });

  const conn = await db.getConnection();
  let saved;
  try {
    await conn.beginTransaction();
    const job = await lockOpenJob(conn, jobId);

    const blocking = settings.allow_reapply_after_rejection ? "('withdrawn','rejected')" : "('withdrawn')";
    const [[dupe]] = await conn.query(
      `SELECT id FROM career_applications WHERE job_id = ? AND (email = ? OR mobile = ?) AND status NOT IN ${blocking} AND anonymized_at IS NULL LIMIT 1`,
      [jobId, app.email, app.mobile]
    );
    if (dupe) throw new HttpError(409, "duplicate", "You have already applied for this job with this email or mobile number.");

    const [[u]] = await conn.query("SELECT id, consumed_at FROM career_resume_uploads WHERE id = ? FOR UPDATE", [upload.id]);
    if (!u || u.consumed_at) throw new HttpError(409, "resume_used", "This resume upload was already used. Please upload it again.");

    const [ins] = await conn.query(
      `INSERT INTO career_applications
         (job_id, full_name, mobile, email, current_city, total_experience, current_company, current_salary, expected_salary,
          notice_period, cover_letter, status, status_changed_at, resume_original_name, resume_key, resume_mime, resume_size,
          consent_at, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', NOW(), ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        jobId, app.full_name, app.mobile, app.email, app.current_city, app.total_experience, app.current_company,
        app.current_salary, app.expected_salary, app.notice_period, app.cover_letter,
        upload.original_name, upload.s3_key, verified.mime || upload.mime, verified.size, ip || null, (userAgent || "").slice(0, 255) || null,
      ]
    );
    const id = ins.insertId;
    const code = appCode(id, istYear());
    await conn.query("UPDATE career_applications SET application_code = ? WHERE id = ?", [code, id]);
    await conn.query("UPDATE career_resume_uploads SET consumed_at = NOW(), application_id = ? WHERE id = ?", [id, upload.id]);
    await logEvent(conn, id, "submitted", { to: "new", remarks: "Application submitted from the careers page." });
    await conn.commit();
    saved = { id, application_code: code, ...app, created_at: new Date(), job };
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
  return saved;
}

/* ---------------- Admin listing / export ---------------- */

const SORT = {
  created_at: "a.id",
  name: "a.full_name",
  experience: "a.total_experience",
  status: "a.status",
  job: "j.title",
  code: "a.id",
};

export function applicationWhere(sp) {
  const where = ["1=1"];
  const params = [];
  const jobId = Number(sp.get("jobId"));
  if (Number.isInteger(jobId) && jobId > 0) (where.push("a.job_id = ?"), params.push(jobId));
  const status = sp.get("status");
  if (APPLICATION_STATUSES[status]) (where.push("a.status = ?"), params.push(status));
  const department = String(sp.get("department") || "").trim();
  if (department) (where.push("j.department = ?"), params.push(department));
  const city = String(sp.get("city") || "").trim();
  if (city) (where.push("a.current_city LIKE ?"), params.push(`%${city.replace(/[%_\\]/g, "\\$&")}%`));
  const exp = EXPERIENCE_FILTERS[sp.get("experience")];
  if (exp) {
    if (exp.min !== undefined) (where.push("a.total_experience >= ?"), params.push(exp.min));
    if (exp.max !== undefined) (where.push("a.total_experience <= ?"), params.push(exp.max));
  }
  const from = String(sp.get("from") || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(from)) (where.push("a.created_at >= ?"), params.push(`${from} 00:00:00`));
  const to = String(sp.get("to") || "");
  if (/^\d{4}-\d{2}-\d{2}$/.test(to)) (where.push("a.created_at <= ?"), params.push(`${to} 23:59:59`));
  const search = String(sp.get("search") || "").trim().slice(0, 80);
  if (search) {
    const like = `%${search.replace(/[%_\\]/g, "\\$&")}%`;
    const digits = search.replace(/\D/g, "");
    where.push("(a.full_name LIKE ? OR a.email LIKE ? OR a.application_code LIKE ?" + (digits.length >= 4 ? " OR a.mobile LIKE ?" : "") + ")");
    params.push(like, like, like);
    if (digits.length >= 4) params.push(`%${digits}%`);
  }
  return { where: where.join(" AND "), params };
}

export async function adminListApplications(sp) {
  const page = Math.max(parseInt(sp.get("page"), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(sp.get("limit"), 10) || 20, 1), 100);
  const { where, params } = applicationWhere(sp);
  const sortCol = SORT[sp.get("sort")] || "a.id";
  const dir = sp.get("dir") === "ASC" ? "ASC" : "DESC";
  const [[[{ total }]], [rows]] = await Promise.all([
    db.query(`SELECT COUNT(*) AS total FROM career_applications a JOIN career_jobs j ON j.id = a.job_id WHERE ${where}`, params),
    db.query(
      `SELECT a.id, a.application_code, a.full_name, a.mobile, a.email, a.current_city, a.total_experience, a.status,
              a.created_at, a.anonymized_at, j.id AS job_id, j.title AS job_title, j.department
         FROM career_applications a JOIN career_jobs j ON j.id = a.job_id
        WHERE ${where}
        ORDER BY ${sortCol} ${dir}, a.id DESC
        LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      params
    ),
  ]);
  return { rows, total: Number(total), totalPages: Math.max(1, Math.ceil(Number(total) / limit)) };
}

export async function exportApplications(sp, { includeContact }) {
  const { where, params } = applicationWhere(sp);
  const [rows] = await db.query(
    `SELECT a.application_code, a.full_name, a.mobile, a.email, a.current_city, a.total_experience, a.status,
            a.created_at, a.notice_period, j.id AS job_id, j.title AS job_title, j.department, j.city AS job_city,
            (SELECT COUNT(*) FROM career_interviews i WHERE i.application_id = a.id AND i.status <> 'cancelled') AS interviews
       FROM career_applications a JOIN career_jobs j ON j.id = a.job_id
      WHERE ${where} ORDER BY a.id DESC LIMIT 20000`,
    params
  );
  const header = [
    "Application ID", "Candidate Name", ...(includeContact ? ["Mobile", "Email"] : []), "Current City", "Experience (yrs)",
    "Notice Period", "Job ID", "Job Title", "Department", "Job City", "Status", "Interviews", "Applied On",
  ];
  const csvCell = (v) => {
    let s = v === null || v === undefined ? "" : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // spreadsheet formula injection guard
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.map(csvCell).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.application_code, r.full_name, ...(includeContact ? [r.mobile, r.email] : []), r.current_city, r.total_experience,
        r.notice_period, jobCode(r.job_id), r.job_title, r.department, r.job_city, APPLICATION_STATUSES[r.status] || r.status,
        r.interviews, new Date(r.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      ].map(csvCell).join(",")
    );
  }
  return { csv: "﻿" + lines.join("\r\n"), count: rows.length };
}

/* ---------------- Detail / actions ---------------- */

export async function getApplication(id) {
  const [[a]] = await db.query(
    `SELECT a.*, j.title AS job_title, j.slug AS job_slug, j.department AS job_department, j.city AS job_city, j.status AS job_status
       FROM career_applications a JOIN career_jobs j ON j.id = a.job_id WHERE a.id = ?`,
    [id]
  );
  if (!a) throw new HttpError(404, "not_found", "Application not found.");
  const [[notes], [interviews], [logs]] = await Promise.all([
    db.query("SELECT id, note, admin_name, created_at FROM career_application_notes WHERE application_id = ? ORDER BY id DESC", [id]),
    db.query("SELECT * FROM career_interviews WHERE application_id = ? ORDER BY round_no, id", [id]),
    db.query("SELECT id, event, from_status, to_status, remarks, admin_name, created_at FROM career_application_logs WHERE application_id = ? ORDER BY id DESC", [id]),
  ]);
  const { resume_key, ip_address, user_agent, ...rest } = a;
  return {
    ...rest,
    job_code: jobCode(a.job_id),
    has_resume: Boolean(resume_key),
    resume_ext: resume_key ? resume_key.split(".").pop().toUpperCase() : null,
    notes,
    interviews,
    logs,
  };
}

export async function getResumeKey(id) {
  const [[a]] = await db.query("SELECT resume_key, resume_original_name, full_name FROM career_applications WHERE id = ?", [id]);
  if (!a) throw new HttpError(404, "not_found", "Application not found.");
  if (!a.resume_key) throw new HttpError(404, "not_found", "No resume on file for this application.");
  return a;
}

/** Changes status in a transaction and writes the history row. Returns { from, to, app }. */
export async function changeStatus(id, to, { remarks, admin }) {
  if (!APPLICATION_STATUSES[to]) throw new HttpError(422, "validation", "Choose a valid status.", { status: "Choose a valid status." });
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [[a]] = await conn.query(
      `SELECT a.id, a.status, a.application_code, a.full_name, a.email, a.anonymized_at, j.title AS job_title
         FROM career_applications a JOIN career_jobs j ON j.id = a.job_id WHERE a.id = ? FOR UPDATE`,
      [id]
    );
    if (!a) throw new HttpError(404, "not_found", "Application not found.");
    if (a.anonymized_at) throw new HttpError(409, "anonymized", "This application's personal data was erased; its status can no longer change.");
    if (a.status === to) throw new HttpError(409, "same_status", `The application is already "${APPLICATION_STATUSES[to]}".`);
    await conn.query("UPDATE career_applications SET status = ?, status_changed_at = NOW() WHERE id = ?", [to, id]);
    await logEvent(conn, id, "status_changed", { from: a.status, to, remarks, admin });
    await conn.commit();
    return { from: a.status, to, app: a };
  } catch (err) {
    await conn.rollback().catch(() => {});
    throw err;
  } finally {
    conn.release();
  }
}

export async function addNote(id, note, admin) {
  const text = String(note || "").trim().slice(0, 5000);
  if (text.length < 2) throw new HttpError(422, "validation", "Write a note first.", { note: "Write a note first." });
  const [[a]] = await db.query("SELECT id FROM career_applications WHERE id = ?", [id]);
  if (!a) throw new HttpError(404, "not_found", "Application not found.");
  await db.query("INSERT INTO career_application_notes (application_id, admin_id, admin_name, note) VALUES (?, ?, ?, ?)", [id, admin.id, admin.name, text]);
  await logEvent(db, id, "note_added", { admin, remarks: text.length > 140 ? `${text.slice(0, 140)}…` : text });
}

/** Privacy erasure: wipes personal data + the resume file; keeps the row for statistics. */
export async function anonymizeApplication(id, admin, reason = "Personal data erased on request.") {
  const [[a]] = await db.query("SELECT id, resume_key, anonymized_at FROM career_applications WHERE id = ?", [id]);
  if (!a) throw new HttpError(404, "not_found", "Application not found.");
  if (a.anonymized_at) return false;
  await db.query(
    `UPDATE career_applications
        SET full_name = 'Erased candidate', mobile = '0000000000', email = CONCAT('erased-', id, '@invalid'),
            current_company = NULL, current_salary = NULL, expected_salary = NULL, notice_period = NULL, cover_letter = NULL,
            resume_original_name = NULL, resume_key = NULL, resume_mime = NULL, resume_size = NULL,
            ip_address = NULL, user_agent = NULL, anonymized_at = NOW()
      WHERE id = ?`,
    [id]
  );
  await db.query("DELETE FROM career_application_notes WHERE application_id = ?", [id]);
  await db.query("UPDATE career_interviews SET feedback = NULL, meeting_link = NULL WHERE application_id = ?", [id]);
  await logEvent(db, id, "anonymized", { admin, remarks: reason });
  if (a.resume_key) await deleteResume(a.resume_key);
  return true;
}
