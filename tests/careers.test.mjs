// Run: node --import ./tests/alias.mjs --test tests/careers.test.mjs
// Pure logic tests for the careers system — no DB, no S3, no SMTP.
import test from "node:test";
import assert from "node:assert/strict";
import {
  checkResumeFile, MAX_RESUME_BYTES, RESUME_TOO_LARGE_MSG, RESUME_BAD_FORMAT_MSG, experienceLabel, salaryLabel,
} from "../src/lib/careers/constants.js";
import { validateJob, cleanHtml, slugify, normalizeSkills, applyPublishDefaults } from "@/lib/careers/jobs";
import { validateApplication, normalizeMobile, appCode } from "@/lib/careers/applications";
import { validateSettings } from "@/lib/careers/settings";

test("resume: 5 MB limit is exact and uses the required message", () => {
  assert.equal(MAX_RESUME_BYTES, 5 * 1024 * 1024);
  assert.equal(checkResumeFile({ name: "cv.pdf", size: MAX_RESUME_BYTES, type: "application/pdf" }).error, undefined);
  const big = checkResumeFile({ name: "cv.pdf", size: MAX_RESUME_BYTES + 1, type: "application/pdf" });
  assert.equal(big.error, "Resume file size cannot exceed 5 MB. Please upload a smaller file.");
  assert.equal(big.error, RESUME_TOO_LARGE_MSG);
});

test("resume: only PDF / DOC / DOCX with a matching MIME type", () => {
  assert.equal(
    checkResumeFile({ name: "a.docx", size: 10, type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }).mime,
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
  assert.equal(checkResumeFile({ name: "a.DOC", size: 10, type: "" }).mime, "application/msword");
  for (const bad of [
    { name: "a.exe", size: 10, type: "application/pdf" },
    { name: "a.pdf", size: 10, type: "image/png" },
    { name: "a.png", size: 10, type: "image/png" },
    { name: "pdf", size: 10, type: "application/pdf" },
  ]) {
    assert.equal(checkResumeFile(bad).error, "Invalid file format. Please upload PDF, DOC, or DOCX.", bad.name);
  }
  assert.equal(RESUME_BAD_FORMAT_MSG, "Invalid file format. Please upload PDF, DOC, or DOCX.");
  assert.ok(checkResumeFile({ name: "a.pdf", size: 0, type: "application/pdf" }).error);
});

test("slugify makes SEO-friendly slugs", () => {
  assert.equal(slugify("Sales Executive"), "sales-executive");
  assert.equal(slugify("  Digital Marketing — Executive!! "), "digital-marketing-executive");
  assert.equal(slugify("R&D Lead"), "r-and-d-lead");
});

test("rich text is sanitized", () => {
  const out = cleanHtml(
    '<p onclick="x()">Hi<script>alert(1)</script><img src=x onerror=y><a href="javascript:alert(1)">bad</a><a href="https://a.com" target="_blank">ok</a></p>'
  );
  assert.ok(!/script|onerror|onclick|javascript:|<img/i.test(out), out);
  assert.match(out, /<a href="https:\/\/a\.com" target="_blank" rel="noopener noreferrer nofollow">ok<\/a>/);
  assert.equal(cleanHtml("<p></p><p> </p>"), "");
});

const base = {
  title: "Sales Executive",
  department: "Sales",
  short_description: "Sell our services to households across the city.",
  description: "<p>We are hiring a sales executive to grow our customer base in Gurugram and nearby areas.</p>",
  employment_type: "full_time",
  work_mode: "office",
  city: "Gurugram",
  state: "Haryana",
  vacancies: "3",
  experience_min: "1",
};

test("job validation: drafts are lenient, publishing is strict", () => {
  const draft = validateJob({ title: "Tester", department: "QA", employment_type: "full_time" });
  assert.equal(draft.slug, "tester");
  assert.throws(
    () => validateJob({ title: "Tester", department: "QA", employment_type: "full_time" }, { publishing: true }),
    (e) => {
      assert.equal(e.status, 422);
      assert.ok(e.fields.short_description && e.fields.description && e.fields.city && e.fields.state);
      return true;
    }
  );
  const job = validateJob(base, { publishing: true });
  assert.equal(job.vacancies, 3);
  assert.equal(job.salary_min, null);
});

test("job validation: salary, experience, dates, emails", () => {
  const bad = () =>
    validateJob(
      { ...base, salary_type: "range", salary_min: "30000", salary_max: "20000", experience_min: "5", experience_max: "2", contact_email: "x@", application_deadline: "2020-01-01" },
      { publishing: true }
    );
  assert.throws(bad, (e) => {
    assert.ok(e.fields.salary_max && e.fields.experience_max && e.fields.contact_email && e.fields.application_deadline);
    return true;
  });
  const ok = validateJob({ ...base, salary_type: "negotiable", salary_min: "5", salary_max: "9" });
  assert.equal(ok.salary_min, null);
  assert.equal(ok.salary_max, null);
  const fixed = validateJob({ ...base, salary_type: "fixed", salary_min: "25000", salary_max: "99999" });
  assert.equal(fixed.salary_max, null);
  // DB row shape (publish action re-validates a stored job).
  const row = validateJob({ ...base, experience_min: "2.0", experience_max: null, salary_min: null, publish_date: "2026-11-05T10:30" }, { publishing: true });
  assert.equal(row.publish_date, "2026-11-05 10:30:00");
});

test("default expiry applies only without a deadline / expiry", () => {
  const j = applyPublishDefaults({ application_deadline: null, expiry_date: null }, { default_expiry_days: 30 });
  assert.match(j.expiry_date, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(applyPublishDefaults({ application_deadline: "2099-01-01", expiry_date: null }, { default_expiry_days: 30 }).expiry_date, null);
  assert.equal(applyPublishDefaults({ application_deadline: null, expiry_date: null }, { default_expiry_days: 0 }).expiry_date, null);
});

test("skills are de-duplicated", () => {
  assert.equal(normalizeSkills("Excel, excel , Sales,, Negotiation"), "Excel, Sales, Negotiation");
});

const settings = { show_salary_fields: true, require_cover_letter: false };
const app = { full_name: "Ravi Kumar", mobile: "+91 98765 43210", email: "Ravi@Example.com", current_city: "Delhi", total_experience: "2.5", consent: true, uploadToken: "a".repeat(48) };

test("application validation", () => {
  const v = validateApplication(app, settings);
  assert.equal(v.mobile, "9876543210");
  assert.equal(v.email, "ravi@example.com");
  assert.equal(v.total_experience, 2.5);
  assert.throws(
    () => validateApplication({ ...app, mobile: "12345", email: "bad", total_experience: "", consent: false, uploadToken: "" }, settings),
    (e) => {
      for (const k of ["mobile", "email", "total_experience", "consent", "resume"]) assert.ok(e.fields[k], k);
      return true;
    }
  );
  assert.throws(() => validateApplication(app, { ...settings, require_cover_letter: true }), (e) => !!e.fields.cover_letter);
  assert.equal(validateApplication({ ...app, current_salary: "20k" }, { ...settings, show_salary_fields: false }).current_salary, null);
});

test("application id format", () => {
  assert.equal(appCode(1, 2026), "APP-2026-000001");
  assert.equal(normalizeMobile("09876543210"), "9876543210");
});

test("labels", () => {
  assert.equal(experienceLabel(0, null), "Fresher");
  assert.equal(experienceLabel(1, 3), "1–3 yrs");
  assert.equal(experienceLabel(5, null), "5 yrs+");
  assert.equal(salaryLabel({ salary_type: "range", salary_min: 20000, salary_max: 30000, salary_period: "month" }), "₹20,000 – ₹30,000 / month");
  assert.equal(salaryLabel({ salary_type: null }), null);
});

test("settings validation", () => {
  assert.deepEqual(validateSettings({ careers_page_visible: false, default_expiry_days: "45", recruitment_email: "HR@a.com, b@c.in" }), {
    careers_page_visible: "0",
    default_expiry_days: "45",
    recruitment_email: "hr@a.com, b@c.in",
  });
  assert.throws(() => validateSettings({ default_expiry_days: "-1", recruitment_email: "nope" }), (e) => !!(e.fields.default_expiry_days && e.fields.recruitment_email));
});
