// Recruitment emails over SMTP (nodemailer). Every sender here is
// best-effort: it resolves to true/false and never throws, so a mail
// outage can never undo a saved application or status change.
//
// Env: SMTP_HOST, SMTP_PORT (587), SMTP_SECURE ("1" for port 465),
//      SMTP_USER, SMTP_PASS, MAIL_FROM ("Mr. Service Expert Careers <careers@…>"),
//      CAREERS_ADMIN_EMAIL (fallback when no recruitment email is set in settings)

import nodemailer from "nodemailer";
import { fmtDate, fmtDateTime, INTERVIEW_MODES } from "@/lib/careers/constants";

const SITE = "https://www.mrserviceexpert.com";
const BRAND = "Mr. Service Expert";

let transport = null;
function getTransport() {
  if (transport !== null) return transport;
  const host = process.env.SMTP_HOST;
  if (!host) return (transport = false);
  transport = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "1" || Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transport;
}

export const mailConfigured = () => Boolean(process.env.SMTP_HOST);

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function layout(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;background:#f5f3fb;font-family:Arial,Helvetica,sans-serif;color:#1f1d2b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e6e1f3">
<tr><td style="background:#6229cd;color:#fff;padding:18px 24px;font-size:18px;font-weight:bold">${BRAND} — Careers</td></tr>
<tr><td style="padding:24px"><h1 style="font-size:20px;margin:0 0 14px">${esc(title)}</h1>${bodyHtml}</td></tr>
<tr><td style="padding:16px 24px;background:#faf9fd;color:#6b6880;font-size:12px">This is an automated message from ${BRAND}. Please do not share sensitive documents by replying to this email.</td></tr>
</table></td></tr></table></body></html>`;
}

const rows = (pairs) =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:12px 0">${pairs
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 10px;border:1px solid #eee;background:#faf9fd;font-size:13px;width:38%;color:#6b6880">${esc(k)}</td><td style="padding:8px 10px;border:1px solid #eee;font-size:14px">${v}</td></tr>`
    )
    .join("")}</table>`;

const p = (t) => `<p style="font-size:14px;line-height:1.6;margin:0 0 12px">${t}</p>`;

async function send({ to, subject, html, replyTo }) {
  const t = getTransport();
  if (!t || !to) {
    if (!t) console.warn("[careers-mail] SMTP not configured — skipped:", subject);
    return false;
  }
  try {
    await t.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    });
    return true;
  } catch (err) {
    console.error("[careers-mail] send failed:", subject, err?.message);
    return false;
  }
}

export function adminRecipients(settings) {
  return settings.recruitment_email || process.env.CAREERS_ADMIN_EMAIL || "";
}

export function sendAdminNewApplication(settings, app, job) {
  const link = `${SITE}/admin/careers/applications/${app.id}`;
  return send({
    to: adminRecipients(settings),
    subject: `New application ${app.application_code} — ${job.title}`,
    replyTo: app.email,
    html: layout(
      "New job application received",
      rows([
        ["Application ID", `<b>${esc(app.application_code)}</b>`],
        ["Candidate", esc(app.full_name)],
        ["Applied job", esc(job.title)],
        ["Experience", `${esc(app.total_experience)} years`],
        ["Current city", esc(app.current_city)],
        ["Application date", esc(fmtDateTime(app.created_at || new Date()))],
      ]) +
        `<p style="margin:18px 0"><a href="${link}" style="background:#6229cd;color:#fff;text-decoration:none;padding:11px 18px;border-radius:8px;font-weight:bold;font-size:14px">Open in Admin Dashboard</a></p>`
    ),
  });
}

export function sendCandidateConfirmation(settings, app, job) {
  return send({
    to: app.email,
    subject: `Application received — ${job.title} (${app.application_code})`,
    replyTo: settings.recruitment_email ? settings.recruitment_email.split(",")[0].trim() : undefined,
    html: layout(
      "Application Submitted Successfully!",
      p(`Dear ${esc(app.full_name)},`) +
        p(esc(settings.application_confirmation_message)) +
        rows([
          ["Application ID", `<b>${esc(app.application_code)}</b>`],
          ["Job title", esc(job.title)],
          ["Submitted on", esc(fmtDateTime(app.created_at || new Date()))],
        ]) +
        p("Please keep your Application ID for any future communication.") +
        p(`Regards,<br/>Recruitment Team, ${BRAND}`)
    ),
  });
}

const STATUS_COPY = {
  shortlisted: {
    subject: "You have been shortlisted",
    body: "Good news! Your profile has been shortlisted. Our recruitment team will contact you shortly with the next steps.",
  },
  selected: {
    subject: "Congratulations — you have been selected",
    body: "We are delighted to inform you that you have been selected. Our team will contact you soon with the offer details and joining formalities.",
  },
  rejected: {
    subject: "Update on your application",
    body: "Thank you for the time and interest you showed. After careful consideration, we will not be moving forward with your application for this position. We will keep your profile in mind for future openings that match your experience.",
  },
};

export function sendCandidateStatus(app, jobTitle, status) {
  const c = STATUS_COPY[status];
  if (!c) return Promise.resolve(false);
  return send({
    to: app.email,
    subject: `${c.subject} — ${jobTitle} (${app.application_code})`,
    html: layout(
      status === "rejected" ? "Application update" : c.subject,
      p(`Dear ${esc(app.full_name)},`) +
        p(esc(c.body)) +
        rows([
          ["Application ID", esc(app.application_code)],
          ["Job title", esc(jobTitle)],
        ]) +
        p(`Regards,<br/>Recruitment Team, ${BRAND}`)
    ),
  });
}

/** kind: scheduled | rescheduled | cancelled */
export function sendCandidateInterview(app, jobTitle, iv, kind = "scheduled") {
  const title =
    kind === "cancelled" ? "Interview cancelled" : kind === "rescheduled" ? "Interview rescheduled" : "Interview invitation";
  const intro =
    kind === "cancelled"
      ? "Your interview listed below has been cancelled. Our team will contact you if it is to be rescheduled."
      : kind === "rescheduled"
      ? "Your interview has been rescheduled. Please find the updated details below."
      : "We are pleased to invite you for an interview. Please find the details below.";
  const where =
    iv.mode === "online"
      ? iv.meeting_link
        ? `<a href="${esc(iv.meeting_link)}">${esc(iv.meeting_link)}</a>`
        : "The meeting link will be shared separately."
      : esc(iv.location || "");
  return send({
    to: app.email,
    subject: `${title} — ${jobTitle} (${app.application_code})`,
    html: layout(
      title,
      p(`Dear ${esc(app.full_name)},`) +
        p(esc(intro)) +
        rows([
          ["Job title", esc(jobTitle)],
          ["Round", esc(iv.round_name ? `Round ${iv.round_no} — ${iv.round_name}` : `Round ${iv.round_no}`)],
          ["Date", esc(fmtDate(iv.scheduled_at))],
          ["Time", esc(new Date(iv.scheduled_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) + " IST")],
          ["Mode", esc(INTERVIEW_MODES[iv.mode] || iv.mode)],
          [iv.mode === "online" ? "Meeting link" : "Location", where],
          ["Interviewer", esc(iv.interviewer_name || "")],
        ]) +
        (kind !== "cancelled" ? p("Please carry a copy of your resume and a valid photo ID. Reply to this email if you need to reschedule.") : "") +
        p(`Regards,<br/>Recruitment Team, ${BRAND}`)
    ),
  });
}
