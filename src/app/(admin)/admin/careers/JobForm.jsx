"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Save, Send, RefreshCw, ExternalLink, ArrowLeft } from "lucide-react";
import { PageHead, Field, Input, Select, Textarea, Button, FieldNote, SectionTitle, FormCard, Toast, ConfirmDialog } from "@/app/(admin)/admin/components/AdminUI";
import RichTextEditor from "./RichTextEditor";
import { api, useToast, JobStatusBadge, CareersNav } from "./_shared";
import { EMPLOYMENT_TYPES, WORK_MODES, SALARY_TYPES } from "@/lib/careers/constants";

const EMPTY = {
  title: "", slug: "", department: "", short_description: "", description: "", responsibilities: "", requirements: "",
  additional_requirements: "", skills: "", employment_type: "full_time", experience_min: "0", experience_max: "",
  qualification: "", vacancies: "1", salary_type: "", salary_min: "", salary_max: "", salary_period: "month",
  country: "India", state: "", city: "", postal_code: "", work_mode: "office", office_address: "",
  application_deadline: "", expiry_date: "", publish_date: "", contact_email: "", contact_person: "",
  is_featured: false, show_on_website: true, meta_title: "", meta_description: "", canonical_url: "",
};

const slugify = (s) =>
  String(s || "").normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 170);

function fromJob(j) {
  const v = (x) => (x === null || x === undefined ? "" : String(x));
  return {
    ...EMPTY,
    ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, v(j[k])])),
    experience_min: v(Number(j.experience_min)),
    experience_max: j.experience_max === null ? "" : v(Number(j.experience_max)),
    publish_date: j.publish_date_input || "",
    application_deadline: v(j.application_deadline).slice(0, 10),
    expiry_date: v(j.expiry_date).slice(0, 10),
    is_featured: Number(j.is_featured) === 1,
    show_on_website: Number(j.show_on_website) === 1,
  };
}

export default function JobForm({ jobId }) {
  const router = useRouter();
  const editing = Boolean(jobId);
  const [form, setForm] = useState(EMPTY);
  const [job, setJob] = useState(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [toast, showToast] = useToast();

  useEffect(() => {
    if (!editing) return;
    api(`/api/admin/careers/jobs/${jobId}`)
      .then((j) => {
        setJob(j);
        setForm(fromJob(j));
        setSlugTouched(true);
        if (new URLSearchParams(window.location.search).get("created") === "1") {
          showToast(j.status === "published" ? "Job published." : "Draft saved.");
          window.history.replaceState(null, "", window.location.pathname);
        }
      })
      .catch((e) => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [editing, jobId, showToast]);

  const set = (k) => (e) => {
    const val = e?.target ? (e.target.type === "checkbox" ? e.target.checked : e.target.value) : e;
    setForm((f) => {
      const next = { ...f, [k]: val };
      if (k === "title" && !slugTouched) next.slug = slugify(val);
      return next;
    });
    if (errors[k]) setErrors((x) => ({ ...x, [k]: undefined }));
  };

  const err = (k) => errors[k] && <FieldNote tone="err">{errors[k]}</FieldNote>;

  async function save(intent) {
    setSaving(intent);
    setErrors({});
    try {
      if (editing) {
        await api(`/api/admin/careers/jobs/${jobId}`, "PUT", { ...form, intent });
        const fresh = await api(`/api/admin/careers/jobs/${jobId}`);
        setJob(fresh);
        setForm(fromJob(fresh));
        showToast(intent === "publish" ? "Job published." : intent === "draft" ? "Saved as draft." : "Job updated.");
      } else {
        const { id } = await api("/api/admin/careers/jobs", "POST", { ...form, intent });
        showToast(intent === "publish" ? "Job published." : "Draft saved.");
        router.replace(`/admin/careers/jobs/${id}?created=1`);
      }
    } catch (e) {
      if (e.fields) setErrors(e.fields);
      showToast(e.message, "error");
      if (e.fields) setTimeout(() => document.querySelector(".adm-note.err")?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    } finally {
      setSaving("");
      setConfirm(null);
    }
  }

  if (loading) {
    return (
      <div>
        <CareersNav />
        <div className="adm-card" style={{ padding: 40, textAlign: "center" }}>
          <Loader2 className="adm-spin" /> Loading job…
        </div>
      </div>
    );
  }

  const status = job?.status;
  const salaryNeedsMin = form.salary_type === "fixed" || form.salary_type === "range";

  return (
    <div style={{ paddingBottom: 90 }}>
      <CareersNav />
      <Link href="/admin/careers/jobs" className="adm-btn adm-btn-ghost adm-btn-sm" style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> All jobs
      </Link>
      <PageHead
        eyebrow="Careers"
        title={editing ? `Edit job · ${job?.code || ""}` : "Add new job"}
        subtitle={
          editing
            ? `${job?.applications ?? 0} application(s). Created by ${job?.created_by_name || "—"}${job?.updated_by_name ? `, last updated by ${job.updated_by_name}` : ""}.`
            : "Fill in the sections below. Save as a draft at any time — publishing checks that the posting is complete."
        }
      />
      {editing && job && (
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
          <JobStatusBadge job={job} />
          {job.is_open && (
            <a className="adm-btn adm-btn-sm" href={`/careers?job=${job.slug}`} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> View on website
            </a>
          )}
          {status === "archived" && <FieldNote tone="err">Archived jobs are read-only — restore it from Job Listings to edit.</FieldNote>}
        </div>
      )}

      <div style={{ display: "grid", gap: 18 }}>
        <FormCard>
          <SectionTitle>Basic job information</SectionTitle>
          <div className="adm-formgrid">
            <Field label="Job title *" className="full">
              <Input value={form.title} onChange={set("title")} maxLength={160} placeholder="e.g. Sales Executive" />
              {err("title")}
            </Field>
            <Field label="URL slug *">
              <div style={{ display: "flex", gap: 6 }}>
                <Input
                  value={form.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    // Keep a trailing hyphen while typing; the server trims it.
                    set("slug")(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-{2,}/g, "-").replace(/^-+/, ""));
                  }}
                  onBlur={() => set("slug")(slugify(form.slug))}
                  maxLength={180}
                  style={{ fontFamily: "var(--adm-mono)" }}
                />
                <Button type="button" size="sm" title="Regenerate from title" onClick={() => (setSlugTouched(false), set("slug")(slugify(form.title)))}>
                  <RefreshCw size={14} />
                </Button>
              </div>
              {errors.slug ? err("slug") : <FieldNote>Share link: mrserviceexpert.com/careers?job={form.slug || "…"} (opens the job popup; not a separate page)</FieldNote>}
            </Field>
            <Field label="Department *">
              <Input value={form.department} onChange={set("department")} maxLength={100} placeholder="e.g. Sales" list="career-departments" />
              <datalist id="career-departments">
                {["Sales", "Marketing", "Customer Support", "Operations", "Technical / Field Service", "Human Resources", "Finance & Accounts", "Technology"].map((d) => (
                  <option key={d} value={d} />
                ))}
              </datalist>
              {err("department")}
            </Field>
            <Field label="Short description (shown on job cards)" className="full">
              <Textarea rows={2} value={form.short_description} onChange={set("short_description")} maxLength={500} />
              {errors.short_description ? err("short_description") : <FieldNote>{form.short_description.length}/500</FieldNote>}
            </Field>
            <Field label="Full job description" className="full">
              <RichTextEditor value={form.description} onChange={set("description")} invalid={!!errors.description} minHeight={180} />
              {err("description")}
            </Field>
            <Field label="Roles & responsibilities" className="full">
              <RichTextEditor value={form.responsibilities} onChange={set("responsibilities")} />
            </Field>
            <Field label="Requirements" className="full">
              <RichTextEditor value={form.requirements} onChange={set("requirements")} />
            </Field>
            <Field label="Additional requirements" className="full">
              <RichTextEditor value={form.additional_requirements} onChange={set("additional_requirements")} minHeight={110} />
            </Field>
            <Field label="Required skills (comma separated)" className="full">
              <Input value={form.skills} onChange={set("skills")} placeholder="Communication, MS Excel, Negotiation" />
            </Field>
          </div>
        </FormCard>

        <FormCard>
          <SectionTitle>Job requirements</SectionTitle>
          <div className="adm-formgrid">
            <Field label="Employment type *">
              <Select value={form.employment_type} onChange={set("employment_type")}>
                {Object.entries(EMPLOYMENT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
              {err("employment_type")}
            </Field>
            <Field label="Number of vacancies *">
              <Input type="number" min="1" max="1000" value={form.vacancies} onChange={set("vacancies")} />
              {err("vacancies")}
            </Field>
            <Field label="Experience required — minimum (years)">
              <Input type="number" min="0" max="50" step="0.5" value={form.experience_min} onChange={set("experience_min")} />
              {err("experience_min")}
            </Field>
            <Field label="Experience — maximum (years, optional)">
              <Input type="number" min="0" max="50" step="0.5" value={form.experience_max} onChange={set("experience_max")} placeholder="No upper limit" />
              {err("experience_max")}
            </Field>
            <Field label="Minimum qualification" className="full">
              <Input value={form.qualification} onChange={set("qualification")} maxLength={200} placeholder="e.g. Graduate in any discipline" />
            </Field>
            <Field label="Salary type (optional)">
              <Select value={form.salary_type} onChange={set("salary_type")}>
                <option value="">Not shown</option>
                {Object.entries(SALARY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
              {err("salary_type")}
            </Field>
            {salaryNeedsMin && (
              <Field label="Salary period">
                <Select value={form.salary_period} onChange={set("salary_period")}>
                  <option value="month">Per month</option>
                  <option value="year">Per year</option>
                </Select>
              </Field>
            )}
            {salaryNeedsMin && (
              <Field label={form.salary_type === "fixed" ? "Salary (₹) *" : "Minimum salary (₹) *"}>
                <Input type="number" min="0" value={form.salary_min} onChange={set("salary_min")} />
                {err("salary_min")}
              </Field>
            )}
            {form.salary_type === "range" && (
              <Field label="Maximum salary (₹) *">
                <Input type="number" min="0" value={form.salary_max} onChange={set("salary_max")} />
                {err("salary_max")}
              </Field>
            )}
          </div>
        </FormCard>

        <FormCard>
          <SectionTitle>Location details</SectionTitle>
          <div className="adm-formgrid">
            <Field label="Work mode *">
              <Select value={form.work_mode} onChange={set("work_mode")}>
                {Object.entries(WORK_MODES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
            <Field label="Country">
              <Input value={form.country} onChange={set("country")} maxLength={80} />
            </Field>
            <Field label={`State${form.work_mode !== "remote" ? " *" : ""}`}>
              <Input value={form.state} onChange={set("state")} maxLength={80} placeholder="e.g. Haryana" />
              {err("state")}
            </Field>
            <Field label={`City${form.work_mode !== "remote" ? " *" : ""}`}>
              <Input value={form.city} onChange={set("city")} maxLength={80} placeholder="e.g. Gurugram" />
              {err("city")}
            </Field>
            <Field label="PIN / postal code (optional)">
              <Input value={form.postal_code} onChange={set("postal_code")} maxLength={12} />
              {err("postal_code")}
            </Field>
            <Field label="Office address (optional)">
              <Input value={form.office_address} onChange={set("office_address")} maxLength={300} />
            </Field>
          </div>
        </FormCard>

        <FormCard>
          <SectionTitle>Recruitment settings</SectionTitle>
          <div className="adm-formgrid">
            <Field label="Application deadline">
              <Input type="date" value={form.application_deadline} onChange={set("application_deadline")} />
              {errors.application_deadline ? err("application_deadline") : <FieldNote>Applications stop after this day (IST).</FieldNote>}
            </Field>
            <Field label="Expiry date">
              <Input type="date" value={form.expiry_date} onChange={set("expiry_date")} />
              {errors.expiry_date ? err("expiry_date") : <FieldNote>Left blank with no deadline → the default expiry from Settings applies on publish.</FieldNote>}
            </Field>
            <Field label="Publish date">
              <Input type="datetime-local" value={form.publish_date} onChange={set("publish_date")} />
              {errors.publish_date ? err("publish_date") : <FieldNote>Blank = immediately. A future date schedules the job.</FieldNote>}
            </Field>
            <Field label="Contact person">
              <Input value={form.contact_person} onChange={set("contact_person")} maxLength={120} />
            </Field>
            <Field label="Contact email">
              <Input type="email" value={form.contact_email} onChange={set("contact_email")} maxLength={190} />
              {err("contact_email")}
            </Field>
            <Field label="Visibility">
              <label style={{ display: "flex", gap: 8, alignItems: "center", minHeight: 40 }}>
                <input type="checkbox" checked={form.show_on_website} onChange={set("show_on_website")} /> Show on website
              </label>
              <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="checkbox" checked={form.is_featured} onChange={set("is_featured")} /> Featured job (listed first)
              </label>
            </Field>
          </div>
        </FormCard>
      </div>

      {status !== "archived" && (
        <div className="adm-card" style={{ position: "sticky", bottom: 12, marginTop: 18, padding: 12, display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", zIndex: 5 }}>
          {(!editing || status === "published" || status === "closed") && (
            <Button
              disabled={!!saving}
              onClick={() =>
                editing && status === "published"
                  ? setConfirm({ intent: "draft", title: "Move to draft?", message: "The job will be removed from the website until you publish it again." })
                  : save("draft")
              }
            >
              {saving === "draft" ? <Loader2 size={16} className="adm-spin" /> : <Save size={16} />} Save as Draft
            </Button>
          )}
          {editing && (
            <Button variant={status === "published" ? "primary" : "default"} disabled={!!saving} onClick={() => save("update")}>
              {saving === "update" ? <Loader2 size={16} className="adm-spin" /> : <Save size={16} />} Update Job
            </Button>
          )}
          {status !== "published" && (
            <Button
              variant="primary"
              disabled={!!saving}
              onClick={() => setConfirm({ intent: "publish", title: "Publish this job?", message: "It will appear on the Careers page and start accepting applications (unless a future publish date is set)." })}
            >
              {saving === "publish" ? <Loader2 size={16} className="adm-spin" /> : <Send size={16} />} Publish Job
            </Button>
          )}
        </div>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          saving={!!saving}
          confirmLabel={confirm.intent === "publish" ? "Yes, publish" : "Yes, move to draft"}
          onCancel={() => setConfirm(null)}
          onConfirm={() => save(confirm.intent)}
        />
      )}
      <Toast toast={toast} />
    </div>
  );
}
