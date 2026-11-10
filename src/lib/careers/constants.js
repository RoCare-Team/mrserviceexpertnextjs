// Shared career constants — safe to import from client AND server code.

export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export const RESUME_TOO_LARGE_MSG = "Resume file size cannot exceed 5 MB. Please upload a smaller file.";
export const RESUME_BAD_FORMAT_MSG = "Invalid file format. Please upload PDF, DOC, or DOCX.";

// extension → accepted browser MIME types (first one is canonical).
export const RESUME_TYPES = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

export const RESUME_ACCEPT = ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Client + server check of a picked file. Returns { ext, mime } or { error }. */
export function checkResumeFile({ name, size, type }) {
  const n0 = String(name || "").toLowerCase();
  const ext = n0.includes(".") ? n0.split(".").pop() : "";
  if (!RESUME_TYPES[ext]) return { error: RESUME_BAD_FORMAT_MSG, code: "file_type" };
  const mime = String(type || "").toLowerCase();
  // Some OSes report an empty / generic type for Word files — fall back to
  // the extension; the server sniffs the real bytes after upload anyway.
  if (mime && mime !== "application/octet-stream" && !RESUME_TYPES[ext].includes(mime)) {
    return { error: RESUME_BAD_FORMAT_MSG, code: "file_type" };
  }
  const n = Number(size);
  if (!Number.isFinite(n) || n <= 0) return { error: "The selected file is empty.", code: "file_empty" };
  if (n > MAX_RESUME_BYTES) return { error: RESUME_TOO_LARGE_MSG, code: "file_too_large" };
  return { ext, mime: RESUME_TYPES[ext][0] };
}

export const formatBytes = (n) => {
  const b = Number(n) || 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
};

export const EMPLOYMENT_TYPES = {
  full_time: "Full Time",
  part_time: "Part Time",
  internship: "Internship",
  contract: "Contract",
  work_from_home: "Work From Home",
};

export const WORK_MODES = { office: "Office", remote: "Remote", hybrid: "Hybrid" };

export const SALARY_TYPES = {
  fixed: "Fixed",
  range: "Salary Range",
  negotiable: "Negotiable",
  company_policy: "As Per Company Policy",
};

export const JOB_STATUSES = { draft: "Draft", published: "Published", closed: "Closed", archived: "Archived" };

export const APPLICATION_STATUSES = {
  new: "New",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  interview_scheduled: "Interview Scheduled",
  selected: "Selected",
  rejected: "Rejected",
  hired: "Hired",
  withdrawn: "Withdrawn",
};

// Statuses that send the candidate an email (when enabled in settings).
export const NOTIFY_STATUSES = ["shortlisted", "selected", "rejected"];

export const INTERVIEW_STATUSES = { scheduled: "Scheduled", rescheduled: "Rescheduled", completed: "Completed", cancelled: "Cancelled" };
export const INTERVIEW_RESULTS = { pending: "Pending", pass: "Pass", fail: "Fail" };
export const INTERVIEW_MODES = { online: "Online", offline: "Offline" };

// Experience filter buckets on the public page (years).
export const EXPERIENCE_FILTERS = {
  fresher: { label: "Fresher (0–1 yr)", max: 1 },
  "1-3": { label: "1–3 years", min: 1, max: 3 },
  "3-5": { label: "3–5 years", min: 3, max: 5 },
  "5+": { label: "5+ years", min: 5 },
};

export function experienceLabel(min, max) {
  const a = Number(min) || 0;
  const b = max === null || max === undefined || max === "" ? null : Number(max);
  const y = (n) => `${Number.isInteger(n) ? n : n.toFixed(1)} yr${n === 1 ? "" : "s"}`;
  if (a === 0 && (b === null || b === 0)) return "Fresher";
  if (a === 0 && b) return `0–${y(b)}`;
  if (b !== null && b > a) return `${Number.isInteger(a) ? a : a.toFixed(1)}–${y(b)}`;
  return `${y(a)}+`;
}

const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export function salaryLabel(job) {
  const per = job.salary_period === "year" ? "/ year" : "/ month";
  switch (job.salary_type) {
    case "fixed":
      return job.salary_min ? `${inr(job.salary_min)} ${per}` : null;
    case "range":
      if (job.salary_min && job.salary_max) return `${inr(job.salary_min)} – ${inr(job.salary_max)} ${per}`;
      if (job.salary_min) return `From ${inr(job.salary_min)} ${per}`;
      if (job.salary_max) return `Up to ${inr(job.salary_max)} ${per}`;
      return null;
    case "negotiable":
      return "Negotiable";
    case "company_policy":
      return "As per company policy";
    default:
      return null;
  }
}

export const fmtDate = (d) =>
  d ? new Date(String(d).length === 10 ? `${d}T00:00:00+05:30` : d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }) : "";

export const fmtDateTime = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })
    : "";
