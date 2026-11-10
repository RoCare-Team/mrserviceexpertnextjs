// Dashboard statistics, recruitment reports and scheduled maintenance —
// all computed from live database rows.

import db from "@/lib/db";
import { OPEN_SQL, expireJobs, jobCode } from "@/lib/careers/jobs";
import { deleteResume } from "@/lib/careers/resume";
import { anonymizeApplication } from "@/lib/careers/applications";
import { getSettings } from "@/lib/careers/settings";

const EXPIRED_SQL = `(j.status = 'published' AND ((j.application_deadline IS NOT NULL AND j.application_deadline < CURDATE())
  OR (j.expiry_date IS NOT NULL AND j.expiry_date < CURDATE())))`;

export async function dashboardStats() {
  const [[[jobs]], [[apps]], [recentJobs], [recentApps], [upcoming]] = await Promise.all([
    db.query(
      `SELECT COUNT(*) AS total,
              SUM(${OPEN_SQL}) AS active,
              SUM(j.status = 'draft') AS draft,
              SUM(j.status = 'closed' OR ${EXPIRED_SQL}) AS closed,
              SUM(j.status = 'archived') AS archived,
              SUM(j.status = 'published' AND NOT (${OPEN_SQL}) AND NOT ${EXPIRED_SQL}) AS scheduled
         FROM career_jobs j`
    ),
    db.query(
      `SELECT COUNT(*) AS total, SUM(status = 'new') AS new_count, SUM(status = 'under_review') AS under_review,
              SUM(status = 'shortlisted') AS shortlisted, SUM(status = 'interview_scheduled') AS interview_scheduled,
              SUM(status = 'selected') AS selected, SUM(status = 'hired') AS hired, SUM(status = 'rejected') AS rejected,
              SUM(created_at >= NOW() - INTERVAL 7 DAY) AS last7
         FROM career_applications`
    ),
    db.query(
      `SELECT j.id, j.title, j.department, j.city, j.status, j.show_on_website, j.created_at, (${OPEN_SQL}) AS is_open, ${EXPIRED_SQL} AS is_expired,
              (SELECT COUNT(*) FROM career_applications a WHERE a.job_id = j.id) AS applications
         FROM career_jobs j WHERE j.status <> 'archived' ORDER BY j.id DESC LIMIT 6`
    ),
    db.query(
      `SELECT a.id, a.application_code, a.full_name, a.status, a.created_at, a.total_experience, j.title AS job_title
         FROM career_applications a JOIN career_jobs j ON j.id = a.job_id ORDER BY a.id DESC LIMIT 8`
    ),
    db.query(
      `SELECT i.id, i.application_id, i.round_no, i.round_name, i.scheduled_at, i.mode, i.interviewer_name, i.status,
              a.application_code, a.full_name, j.title AS job_title
         FROM career_interviews i JOIN career_applications a ON a.id = i.application_id JOIN career_jobs j ON j.id = a.job_id
        WHERE i.status IN ('scheduled','rescheduled') AND i.scheduled_at >= NOW() - INTERVAL 2 HOUR
        ORDER BY i.scheduled_at ASC LIMIT 8`
    ),
  ]);
  const n = (v) => Number(v || 0);
  return {
    jobs: { total: n(jobs.total), active: n(jobs.active), draft: n(jobs.draft), closed: n(jobs.closed), archived: n(jobs.archived), scheduled: n(jobs.scheduled) },
    applications: {
      total: n(apps.total), new: n(apps.new_count), under_review: n(apps.under_review), shortlisted: n(apps.shortlisted),
      interview_scheduled: n(apps.interview_scheduled), selected: n(apps.selected), hired: n(apps.hired), rejected: n(apps.rejected), last7: n(apps.last7),
    },
    recentJobs: recentJobs.map((r) => ({ ...r, code: jobCode(r.id), is_open: Number(r.is_open) === 1, is_expired: Number(r.is_expired) === 1, applications: Number(r.applications) })),
    recentApplications: recentApps,
    upcomingInterviews: upcoming,
  };
}

/** Reports for an optional date range (YYYY-MM-DD) and optional job. */
export async function recruitmentReport({ from, to, jobId }) {
  const where = ["1=1"];
  const params = [];
  if (from) (where.push("a.created_at >= ?"), params.push(`${from} 00:00:00`));
  if (to) (where.push("a.created_at <= ?"), params.push(`${to} 23:59:59`));
  if (jobId) (where.push("a.job_id = ?"), params.push(jobId));
  const w = where.join(" AND ");
  const base = `FROM career_applications a JOIN career_jobs j ON j.id = a.job_id WHERE ${w}`;
  const [[[totals]], [byJob], [byDept], [byCity], [byStatus], [byDate]] = await Promise.all([
    db.query(
      `SELECT COUNT(*) AS total, SUM(a.status = 'selected') AS selected, SUM(a.status = 'hired') AS hired,
              SUM(a.status = 'shortlisted') AS shortlisted, SUM(a.status = 'rejected') AS rejected ${base}`,
      params
    ),
    db.query(
      `SELECT j.id, j.title, j.department, j.status, COUNT(*) AS total, SUM(a.status = 'selected') AS selected, SUM(a.status = 'hired') AS hired
         ${base} GROUP BY j.id, j.title, j.department, j.status ORDER BY total DESC LIMIT 100`,
      params
    ),
    db.query(`SELECT j.department AS label, COUNT(*) AS total, SUM(a.status = 'hired') AS hired ${base} GROUP BY j.department ORDER BY total DESC LIMIT 50`, params),
    db.query(`SELECT a.current_city AS label, COUNT(*) AS total ${base} AND a.anonymized_at IS NULL GROUP BY a.current_city ORDER BY total DESC LIMIT 25`, params),
    db.query(`SELECT a.status AS label, COUNT(*) AS total ${base} GROUP BY a.status`, params),
    db.query(`SELECT DATE_FORMAT(a.created_at, '%Y-%m-%d') AS day, COUNT(*) AS total ${base} GROUP BY day ORDER BY day ASC LIMIT 400`, params),
  ]);
  const n = (v) => Number(v || 0);
  return {
    totals: { total: n(totals.total), selected: n(totals.selected), hired: n(totals.hired), shortlisted: n(totals.shortlisted), rejected: n(totals.rejected) },
    byJob: byJob.map((r) => ({ ...r, code: jobCode(r.id), total: n(r.total), selected: n(r.selected), hired: n(r.hired) })),
    byDepartment: byDept.map((r) => ({ label: r.label, total: n(r.total), hired: n(r.hired) })),
    byCity: byCity.map((r) => ({ label: r.label, total: n(r.total) })),
    byStatus: byStatus.map((r) => ({ label: r.label, total: n(r.total) })),
    byDate: byDate.map((r) => ({ day: r.day, total: n(r.total) })),
  };
}

/**
 * Scheduled maintenance (careers cron):
 *  - close published jobs past their deadline / expiry
 *  - delete resumes uploaded but never attached to an application (> 24 h)
 *  - optional retention: erase personal data of old rejected / withdrawn
 *    applications (Settings → retention months; 0 = off)
 */
export async function runCareerMaintenance() {
  const expired = await expireJobs();

  const [stale] = await db.query(
    "SELECT id, s3_key FROM career_resume_uploads WHERE consumed_at IS NULL AND created_at < NOW() - INTERVAL 24 HOUR ORDER BY id LIMIT 200"
  );
  for (const u of stale) {
    await deleteResume(u.s3_key);
    await db.query("DELETE FROM career_resume_uploads WHERE id = ?", [u.id]);
  }
  // Consumed upload tickets are only bookkeeping — drop them after 30 days.
  await db.query("DELETE FROM career_resume_uploads WHERE consumed_at IS NOT NULL AND consumed_at < NOW() - INTERVAL 30 DAY");

  let erased = 0;
  const settings = await getSettings();
  if (settings.retention_months > 0) {
    const [old] = await db.query(
      `SELECT id FROM career_applications
        WHERE anonymized_at IS NULL AND status IN ('rejected','withdrawn')
          AND COALESCE(status_changed_at, created_at) < NOW() - INTERVAL ? MONTH
        ORDER BY id LIMIT 100`,
      [settings.retention_months]
    );
    for (const a of old) {
      if (await anonymizeApplication(a.id, { id: null, name: "System (retention policy)" }, `Erased automatically after ${settings.retention_months} months (retention policy).`)) erased++;
    }
  }
  return { expiredJobs: expired, orphanResumesDeleted: stale.length, applicationsErased: erased };
}
