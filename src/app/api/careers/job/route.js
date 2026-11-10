import { ok, handle, rateLimit, clientIp, HttpError } from "@/lib/careers/http";
import { getPublicJob, cleanHtml } from "@/lib/careers/jobs";
import { getSettings } from "@/lib/careers/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Job details for the popup on /careers. Jobs deliberately have no page of
// their own (no per-job URLs to 404 once a job ends).
const FIELDS = [
  "id", "title", "slug", "department", "short_description", "skills", "employment_type", "experience_min", "experience_max",
  "qualification", "vacancies", "salary_type", "salary_min", "salary_max", "salary_period", "country", "state", "city",
  "work_mode", "office_address", "application_deadline", "expiry_date", "publish_date", "published_at", "contact_email",
  "contact_person", "is_featured", "is_open",
];

/** GET ?slug= → { job, options } */
export const GET = handle(async (req) => {
  rateLimit(`careers-job:${clientIp(req)}`, 120, 60_000);
  const settings = await getSettings();
  if (!settings.careers_page_visible) throw new HttpError(404, "not_found", "Careers page is not available.");
  const job = await getPublicJob(new URL(req.url).searchParams.get("slug"));
  if (!job) throw new HttpError(404, "not_found", "This job is no longer available.");
  const out = Object.fromEntries(FIELDS.map((k) => [k, job[k]]));
  for (const k of ["description", "responsibilities", "requirements", "additional_requirements"]) out[k] = cleanHtml(job[k]);
  return ok({
    job: out,
    options: { show_salary_fields: settings.show_salary_fields, require_cover_letter: settings.require_cover_letter },
  });
});
