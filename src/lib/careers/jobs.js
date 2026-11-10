// Career jobs: validation, sanitising, public + admin queries, lifecycle
// actions. A job is "open" (listed, accepts applications) only when every
// condition in OPEN_SQL holds — enforced on every request, so an expired job
// stops accepting applications even if the expiry cron never ran.

import sanitizeHtml from "sanitize-html";
import db from "@/lib/db";
import { HttpError } from "@/lib/careers/http";
import { EMPLOYMENT_TYPES, WORK_MODES, SALARY_TYPES, EXPERIENCE_FILTERS } from "@/lib/careers/constants";

export const OPEN_SQL = `j.status = 'published' AND j.show_on_website = 1
  AND (j.publish_date IS NULL OR j.publish_date <= NOW())
  AND (j.application_deadline IS NULL OR j.application_deadline >= CURDATE())
  AND (j.expiry_date IS NULL OR j.expiry_date >= CURDATE())`;

// Detail page is reachable for open jobs and for published/closed jobs that
// were live at some point (they show "Applications Closed").
const VISIBLE_SQL = `j.status IN ('published','closed') AND j.show_on_website = 1 AND j.published_at IS NOT NULL
  AND (j.publish_date IS NULL OR j.publish_date <= NOW())`;

export const jobCode = (id) => `JOB-${String(id).padStart(4, "0")}`;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(s) {
  return String(s || "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 170)
    .replace(/-+$/g, "");
}

const SANITIZE = {
  allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "s", "h2", "h3", "h4", "ul", "ol", "li", "a", "blockquote", "hr"],
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: (tagName, attribs) => ({
      tagName: "a",
      attribs: { href: attribs.href || "#", ...(attribs.target === "_blank" ? { target: "_blank" } : {}), rel: "noopener noreferrer nofollow" },
    }),
  },
};

export const cleanHtml = (html) => {
  const out = sanitizeHtml(String(html || ""), SANITIZE).trim();
  return htmlText(out) ? out : "";
};
export const htmlText = (html) => sanitizeHtml(String(html || ""), { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, " ").trim();

const str = (v, max) => String(v ?? "").trim().slice(0, max);
const nullable = (v, max) => {
  const s = str(v, max);
  return s ? s : null;
};
const bool = (v) => v === true || v === 1 || v === "1" || v === "true";

function num(v, { min = 0, max, int = false } = {}) {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < min || (max !== undefined && n > max) || (int && !Number.isInteger(n))) return NaN;
  return n;
}

function dateOnly(v) {
  if (!v) return null;
  const s = String(v).slice(0, 10);
  if (!DATE_RE.test(s) || Number.isNaN(Date.parse(`${s}T00:00:00Z`))) return NaN;
  return s;
}

function dateTime(v) {
  if (!v) return null;
  const s = String(v).trim().replace("T", " ");
  const m = s.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2})(?::\d{2})?$/);
  if (!m) return NaN;
  return `${m[1]} ${m[2]}:${m[3]}:00`;
}

const istInput = (d) => new Date(d).toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" }).slice(0, 16).replace(" ", "T");

const todayIst = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

function addDays(ymd, days) {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function normalizeSkills(v) {
  const list = (Array.isArray(v) ? v : String(v || "").split(/[,\n]/)).map((s) => String(s).trim().slice(0, 50)).filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const s of list) {
    const k = s.toLowerCase();
    if (!seen.has(k)) (seen.add(k), out.push(s));
  }
  return out.slice(0, 30).join(", ");
}

/**
 * Validate + normalise admin job input. `publishing` applies the stricter
 * rules a public posting needs. Throws HttpError(422) with field messages.
 */
export function validateJob(body, { publishing = false } = {}) {
  const f = {};
  const job = {
    title: str(body.title, 160),
    slug: slugify(body.slug || body.title),
    department: str(body.department, 100),
    short_description: str(body.short_description, 500),
    description: cleanHtml(body.description),
    responsibilities: cleanHtml(body.responsibilities),
    requirements: cleanHtml(body.requirements),
    additional_requirements: cleanHtml(body.additional_requirements),
    skills: normalizeSkills(body.skills),
    employment_type: body.employment_type,
    experience_min: num(body.experience_min, { max: 50 }) ?? 0,
    experience_max: num(body.experience_max, { max: 50 }),
    qualification: str(body.qualification, 200),
    vacancies: num(body.vacancies, { min: 1, max: 1000, int: true }) ?? 1,
    salary_type: body.salary_type ? body.salary_type : null,
    salary_min: num(body.salary_min, { max: 100000000, int: true }),
    salary_max: num(body.salary_max, { max: 100000000, int: true }),
    salary_period: body.salary_period === "year" ? "year" : "month",
    country: str(body.country, 80) || "India",
    state: str(body.state, 80),
    city: str(body.city, 80),
    postal_code: nullable(body.postal_code, 12),
    work_mode: body.work_mode || "office",
    office_address: nullable(body.office_address, 300),
    application_deadline: dateOnly(body.application_deadline),
    expiry_date: dateOnly(body.expiry_date),
    publish_date: dateTime(body.publish_date),
    contact_email: nullable(body.contact_email, 190)?.toLowerCase() ?? null,
    contact_person: nullable(body.contact_person, 120),
    is_featured: bool(body.is_featured) ? 1 : 0,
    show_on_website: body.show_on_website === undefined ? 1 : bool(body.show_on_website) ? 1 : 0,
    meta_title: nullable(body.meta_title, 190),
    meta_description: nullable(body.meta_description, 320),
    canonical_url: nullable(body.canonical_url, 300),
  };

  if (job.title.length < 3) f.title = "Enter a job title (at least 3 characters).";
  if (!job.slug || !SLUG_RE.test(job.slug)) f.slug = "Use lowercase letters, numbers and hyphens only.";
  if (!job.department) f.department = "Enter the department.";
  if (!EMPLOYMENT_TYPES[job.employment_type]) f.employment_type = "Choose an employment type.";
  if (!WORK_MODES[job.work_mode]) f.work_mode = "Choose a work mode.";
  if (Number.isNaN(job.experience_min)) f.experience_min = "Enter years between 0 and 50.";
  if (Number.isNaN(job.experience_max)) f.experience_max = "Enter years between 0 and 50.";
  else if (job.experience_max !== null && !Number.isNaN(job.experience_min) && job.experience_max < job.experience_min)
    f.experience_max = "Maximum must be at least the minimum.";
  if (Number.isNaN(job.vacancies)) f.vacancies = "Enter a number between 1 and 1000.";

  if (job.salary_type && !SALARY_TYPES[job.salary_type]) f.salary_type = "Choose a salary type.";
  if (Number.isNaN(job.salary_min)) f.salary_min = "Enter a valid amount.";
  if (Number.isNaN(job.salary_max)) f.salary_max = "Enter a valid amount.";
  if (job.salary_type === "fixed") {
    if (!job.salary_min) f.salary_min = "Enter the salary amount.";
    job.salary_max = null;
  } else if (job.salary_type === "range") {
    if (!job.salary_min) f.salary_min = "Enter the minimum salary.";
    if (!job.salary_max) f.salary_max = "Enter the maximum salary.";
    else if (job.salary_min && job.salary_max < job.salary_min) f.salary_max = "Maximum must be at least the minimum.";
  } else {
    job.salary_min = null;
    job.salary_max = null;
  }

  if (job.postal_code && !/^[0-9A-Za-z -]{3,12}$/.test(job.postal_code)) f.postal_code = "Enter a valid PIN / postal code.";
  if (Number.isNaN(job.application_deadline)) f.application_deadline = "Enter a valid date.";
  if (Number.isNaN(job.expiry_date)) f.expiry_date = "Enter a valid date.";
  if (Number.isNaN(job.publish_date)) f.publish_date = "Enter a valid date and time.";
  if (job.contact_email && !EMAIL_RE.test(job.contact_email)) f.contact_email = "Enter a valid email address.";
  if (job.canonical_url && !/^https:\/\/[^\s]+$/i.test(job.canonical_url)) f.canonical_url = "Enter a full https:// URL or leave blank.";

  if (publishing) {
    if (job.short_description.length < 20) f.short_description = "Add a short description (at least 20 characters) before publishing.";
    if (htmlText(job.description).length < 50) f.description = "Add a job description (at least 50 characters) before publishing.";
    if (job.work_mode !== "remote") {
      if (!job.city) f.city = "Enter the city before publishing.";
      if (!job.state) f.state = "Enter the state before publishing.";
    }
    const today = todayIst();
    if (job.application_deadline && !Number.isNaN(job.application_deadline) && job.application_deadline < today)
      f.application_deadline = "The deadline has passed — choose today or a later date.";
    if (job.expiry_date && !Number.isNaN(job.expiry_date) && job.expiry_date < today) f.expiry_date = "The expiry date has passed.";
  }

  if (Object.keys(f).length) throw new HttpError(422, "validation", "Please fix the highlighted fields.", f);
  return job;
}

/** Fills in publish-time defaults (publish date, default expiry). */
export function applyPublishDefaults(job, settings) {
  const out = { ...job };
  if (!out.application_deadline && !out.expiry_date && settings.default_expiry_days > 0) {
    out.expiry_date = addDays(todayIst(), settings.default_expiry_days);
  }
  return out;
}

export async function assertSlugFree(slug, exceptId = 0) {
  const [[row]] = await db.query("SELECT id FROM career_jobs WHERE slug = ? AND id <> ? LIMIT 1", [slug, exceptId]);
  if (row) throw new HttpError(409, "validation", "This URL slug is already used by another job.", { slug: "This URL slug is already used by another job." });
}

export async function uniqueSlug(base) {
  let slug = base.slice(0, 170);
  for (let i = 2; i < 200; i++) {
    const [[row]] = await db.query("SELECT id FROM career_jobs WHERE slug = ? LIMIT 1", [slug]);
    if (!row) return slug;
    slug = `${base.slice(0, 165)}-${i}`;
  }
  return `${base.slice(0, 160)}-${Date.now()}`;
}

export const JOB_COLUMNS = [
  "title", "slug", "department", "short_description", "description", "responsibilities", "requirements",
  "additional_requirements", "skills", "employment_type", "experience_min", "experience_max", "qualification",
  "vacancies", "salary_type", "salary_min", "salary_max", "salary_period", "country", "state", "city", "postal_code",
  "work_mode", "office_address", "application_deadline", "expiry_date", "publish_date", "contact_email",
  "contact_person", "is_featured", "show_on_website", "meta_title", "meta_description", "canonical_url",
];

/* ---------------- Public queries ---------------- */

const PUBLIC_FIELDS = `j.id, j.title, j.slug, j.department, j.short_description, j.employment_type, j.experience_min, j.experience_max,
  j.vacancies, j.salary_type, j.salary_min, j.salary_max, j.salary_period, j.city, j.state, j.country, j.work_mode,
  j.application_deadline, j.expiry_date, j.publish_date, j.published_at, j.is_featured`;

export function publicFilters(sp) {
  const get = (k) => String((typeof sp.get === "function" ? sp.get(k) : sp[k]) || "").trim();
  return {
    q: get("q").slice(0, 80),
    department: get("department").slice(0, 100),
    city: get("city").slice(0, 80),
    type: EMPLOYMENT_TYPES[get("type")] ? get("type") : "",
    experience: EXPERIENCE_FILTERS[get("experience")] ? get("experience") : "",
  };
}

export async function listOpenJobs(filters, { page = 1, limit = 9 } = {}) {
  const where = [OPEN_SQL];
  const params = [];
  if (filters.q) {
    where.push("(j.title LIKE ? OR j.department LIKE ?)");
    const like = `%${filters.q.replace(/[%_\\]/g, "\\$&")}%`;
    params.push(like, like);
  }
  if (filters.department) (where.push("j.department = ?"), params.push(filters.department));
  if (filters.city) (where.push("j.city = ?"), params.push(filters.city));
  if (filters.type) (where.push("j.employment_type = ?"), params.push(filters.type));
  const exp = EXPERIENCE_FILTERS[filters.experience];
  if (exp) {
    if (exp.max !== undefined) (where.push("j.experience_min <= ?"), params.push(exp.max));
    if (exp.min !== undefined) (where.push("(j.experience_max IS NULL OR j.experience_max >= ?)"), params.push(exp.min));
  }
  const w = where.join(" AND ");
  const lim = Math.min(Math.max(Number(limit) || 9, 1), 30);
  const pg = Math.max(Number(page) || 1, 1);
  const [[[{ total }]], [rows]] = await Promise.all([
    db.query(`SELECT COUNT(*) AS total FROM career_jobs j WHERE ${w}`, params),
    db.query(
      `SELECT ${PUBLIC_FIELDS} FROM career_jobs j WHERE ${w}
        ORDER BY j.is_featured DESC, COALESCE(j.publish_date, j.published_at) DESC, j.id DESC
        LIMIT ${lim} OFFSET ${(pg - 1) * lim}`,
      params
    ),
  ]);
  return { rows, total: Number(total), page: pg, hasMore: pg * lim < Number(total) };
}

export async function filterOptions() {
  const [[departments], [cities]] = await Promise.all([
    db.query(`SELECT DISTINCT j.department AS v FROM career_jobs j WHERE ${OPEN_SQL} AND j.department <> '' ORDER BY v`),
    db.query(`SELECT DISTINCT j.city AS v FROM career_jobs j WHERE ${OPEN_SQL} AND j.city <> '' ORDER BY v`),
  ]);
  return { departments: departments.map((r) => r.v), cities: cities.map((r) => r.v) };
}

/** Public detail: null when the job is not (or no longer) visible. */
export async function getPublicJob(slug) {
  if (!SLUG_RE.test(String(slug || ""))) return null;
  const [[job]] = await db.query(
    `SELECT j.*, (${OPEN_SQL}) AS is_open FROM career_jobs j WHERE j.slug = ? AND ${VISIBLE_SQL} LIMIT 1`,
    [slug]
  );
  if (!job) return null;
  job.is_open = Number(job.is_open) === 1;
  return job;
}

/** Lock + re-check a job inside a transaction (application submit). */
export async function lockOpenJob(conn, jobId) {
  const [[job]] = await conn.query(`SELECT j.id, j.title, j.slug, j.department, (${OPEN_SQL}) AS is_open FROM career_jobs j WHERE j.id = ? FOR UPDATE`, [jobId]);
  if (!job) throw new HttpError(404, "job_not_found", "This job is no longer available.");
  if (Number(job.is_open) !== 1) throw new HttpError(410, "job_closed", "Applications for this job are closed.");
  return job;
}

export async function getOpenJobById(jobId) {
  const [[job]] = await db.query(`SELECT j.id, j.title, j.slug FROM career_jobs j WHERE j.id = ? AND ${OPEN_SQL}`, [jobId]);
  return job || null;
}

/* ---------------- Admin ---------------- */

const ADMIN_SORT = {
  id: "j.id",
  title: "j.title",
  department: "j.department",
  city: "j.city",
  vacancies: "j.vacancies",
  applications: "applications",
  publish_date: "COALESCE(j.publish_date, j.published_at)",
  deadline: "j.application_deadline",
  status: "j.status",
};

export async function adminListJobs(sp) {
  const page = Math.max(parseInt(sp.get("page"), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(sp.get("limit"), 10) || 20, 1), 100);
  const where = ["1=1"];
  const params = [];
  const status = sp.get("status") || "";
  if (status === "expired") {
    where.push("j.status = 'published' AND ((j.application_deadline IS NOT NULL AND j.application_deadline < CURDATE()) OR (j.expiry_date IS NOT NULL AND j.expiry_date < CURDATE()))");
  } else if (["draft", "published", "closed", "archived"].includes(status)) (where.push("j.status = ?"), params.push(status));
  else where.push("j.status <> 'archived'"); // archived hidden unless asked for
  const dept = String(sp.get("department") || "").trim();
  if (dept) (where.push("j.department = ?"), params.push(dept));
  const city = String(sp.get("city") || "").trim();
  if (city) (where.push("j.city = ?"), params.push(city));
  const search = String(sp.get("search") || "").trim().slice(0, 80);
  if (search) {
    const like = `%${search.replace(/[%_\\]/g, "\\$&")}%`;
    const idMatch = Number(search.replace(/^job-0*/i, "")) || 0;
    where.push("(j.title LIKE ? OR j.department LIKE ? OR j.city LIKE ? OR j.slug LIKE ? OR j.id = ?)");
    params.push(like, like, like, like, idMatch);
  }
  const sortCol = ADMIN_SORT[sp.get("sort")] || "j.id";
  const dir = sp.get("dir") === "ASC" ? "ASC" : "DESC";
  const w = where.join(" AND ");
  const [[[{ total }]], [rows], [depts], [cities]] = await Promise.all([
    db.query(`SELECT COUNT(*) AS total FROM career_jobs j WHERE ${w}`, params),
    db.query(
      `SELECT j.id, j.title, j.slug, j.department, j.city, j.state, j.vacancies, j.status, j.closed_reason, j.is_featured,
              j.show_on_website, j.publish_date, j.published_at, j.application_deadline, j.expiry_date, j.created_at, j.updated_at,
              (${OPEN_SQL}) AS is_open,
              (j.status = 'published' AND ((j.application_deadline IS NOT NULL AND j.application_deadline < CURDATE())
                 OR (j.expiry_date IS NOT NULL AND j.expiry_date < CURDATE()))) AS is_expired,
              COALESCE(a.cnt, 0) AS applications, COALESCE(a.new_cnt, 0) AS new_applications
         FROM career_jobs j
         LEFT JOIN (SELECT job_id, COUNT(*) AS cnt, SUM(status = 'new') AS new_cnt FROM career_applications GROUP BY job_id) a ON a.job_id = j.id
        WHERE ${w}
        ORDER BY ${sortCol} ${dir}, j.id DESC
        LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
      params
    ),
    db.query("SELECT DISTINCT department AS v FROM career_jobs WHERE department <> '' ORDER BY v"),
    db.query("SELECT DISTINCT city AS v FROM career_jobs WHERE city <> '' ORDER BY v"),
  ]);
  return {
    rows: rows.map((r) => ({ ...r, code: jobCode(r.id), is_open: Number(r.is_open) === 1, is_expired: Number(r.is_expired) === 1, applications: Number(r.applications), new_applications: Number(r.new_applications) })),
    total: Number(total),
    totalPages: Math.max(1, Math.ceil(Number(total) / limit)),
    departments: depts.map((d) => d.v),
    cities: cities.map((c) => c.v),
  };
}

export async function adminGetJob(id) {
  const [[job]] = await db.query(
    `SELECT j.*, (${OPEN_SQL}) AS is_open,
            (SELECT COUNT(*) FROM career_applications a WHERE a.job_id = j.id) AS applications,
            cu.name AS created_by_name, uu.name AS updated_by_name
       FROM career_jobs j
       LEFT JOIN admin_users cu ON cu.id = j.created_by
       LEFT JOIN admin_users uu ON uu.id = j.updated_by
      WHERE j.id = ?`,
    [id]
  );
  if (!job) throw new HttpError(404, "not_found", "Job not found.");
  return {
    ...job,
    code: jobCode(job.id),
    is_open: Number(job.is_open) === 1,
    applications: Number(job.applications),
    // "YYYY-MM-DDTHH:mm" in IST for <input type="datetime-local">.
    publish_date_input: job.publish_date ? istInput(job.publish_date) : "",
  };
}

/** Marks published jobs past their deadline / expiry as closed (expired). */
export async function expireJobs() {
  const [r] = await db.query(
    `UPDATE career_jobs SET status = 'closed', closed_reason = 'expired', closed_at = NOW()
      WHERE status = 'published'
        AND ((application_deadline IS NOT NULL AND application_deadline < CURDATE())
          OR (expiry_date IS NOT NULL AND expiry_date < CURDATE()))`
  );
  return r.affectedRows || 0;
}

export { todayIst };
