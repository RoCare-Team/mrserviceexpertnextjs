"use client";

import { useEffect, useRef, useState } from "react";
import {
  X, MapPin, Clock, Briefcase, GraduationCap, Users, IndianRupee, CalendarClock, Building2, Laptop, Ban, Mail, Loader2, AlertCircle,
} from "lucide-react";
import ApplyPanel from "./ApplyPanel";
import { locationLabel } from "./JobCard";
import { EMPLOYMENT_TYPES, WORK_MODES, experienceLabel, salaryLabel, fmtDate } from "@/lib/careers/constants";

function Fact({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex min-w-0 items-start gap-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface-soft)] p-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-purple-700" aria-hidden="true" />
      <div className="min-w-0">
        <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</dt>
        <dd className="break-words text-[14px] font-semibold text-[var(--ink)]">{value}</dd>
      </div>
    </div>
  );
}

function Block({ title, html }) {
  if (!html) return null;
  return (
    <section className="mt-6">
      <h3 className="mb-2.5 text-[16px] font-bold text-[var(--ink)]">{title}</h3>
      <div className="job-rich" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}

/** Full job details in a popup; "Apply Now" opens the application form on top. */
export default function JobDetailsModal({ slug, startApply, onClose }) {
  const [state, setState] = useState({ loading: true });
  const dialogRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setState({ loading: true });
    fetch(`/api/careers/job?slug=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!alive) return;
        if (j?.success) setState({ ...j.data });
        else setState({ error: j?.error?.message || "This job is no longer available." });
      })
      .catch(() => alive && setState({ error: "Could not load the job. Please check your connection and try again." }));
    return () => {
      alive = false;
    };
  }, [slug]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Escape closes only when the apply form (on top) is not open.
    const onKey = (e) => e.key === "Escape" && !document.querySelector('[aria-labelledby="apply-title"]') && onClose();
    window.addEventListener("keydown", onKey);
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const job = state.job;
  const deadline = job && (job.application_deadline || job.expiry_date);
  const skills = job ? String(job.skills || "").split(",").map((s) => s.trim()).filter(Boolean) : [];

  return (
    <div
      className="fixed inset-0 z-[900] flex items-end justify-center bg-[rgba(21,13,56,.55)] sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="job-title"
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-[var(--shadow-lg)] outline-none sm:rounded-3xl"
      >
        <div className="flex items-start gap-3 border-b border-[var(--line)] px-5 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            {job && (
              <p className="mb-1 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.14em] text-purple-700">
                <Building2 className="h-3 w-3" aria-hidden="true" /> {job.department}
              </p>
            )}
            <h2 id="job-title" className="text-xl font-bold leading-snug text-[var(--ink)] sm:text-2xl">
              {job ? job.title : state.loading ? "Loading…" : "Job not available"}
            </h2>
            {job && (
              <p className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[13.5px] text-[var(--muted)]">
                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {locationLabel(job)}</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" aria-hidden="true" /> {EMPLOYMENT_TYPES[job.employment_type]}</span>
                {job.publish_date && <span>Posted {fmtDate(job.publish_date)}</span>}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--muted)] hover:bg-[var(--surface-soft)]" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          {state.loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-[var(--muted)]">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> Loading job details…
            </div>
          ) : state.error ? (
            <div role="alert" className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" aria-hidden="true" />
              <p className="text-[15px] text-[var(--ink-soft)]">{state.error}</p>
            </div>
          ) : (
            <>
              {!job.is_open && (
                <div role="status" className="mb-5 flex items-start gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <Ban className="mt-0.5 h-5 w-5 shrink-0 text-gray-500" aria-hidden="true" />
                  <div>
                    <p className="text-[15px] font-bold text-[var(--ink)]">Applications Closed</p>
                    <p className="text-[13.5px] text-[var(--muted)]">This position is no longer accepting applications.</p>
                  </div>
                </div>
              )}
              {job.short_description && <p className="text-[15px] leading-relaxed text-[var(--body-text)]">{job.short_description}</p>}
              <dl className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <Fact icon={Building2} label="Department" value={job.department} />
                <Fact icon={MapPin} label="Location" value={locationLabel(job)} />
                <Fact icon={Clock} label="Employment Type" value={EMPLOYMENT_TYPES[job.employment_type]} />
                <Fact icon={Laptop} label="Work Mode" value={WORK_MODES[job.work_mode]} />
                <Fact icon={Briefcase} label="Experience Required" value={experienceLabel(job.experience_min, job.experience_max)} />
                <Fact icon={GraduationCap} label="Qualification" value={job.qualification} />
                <Fact icon={Users} label="Vacancies" value={String(job.vacancies)} />
                <Fact icon={IndianRupee} label="Salary" value={salaryLabel(job)} />
                <Fact icon={CalendarClock} label="Application Deadline" value={deadline ? fmtDate(deadline) : "Open until filled"} />
                {job.office_address && job.work_mode !== "remote" && <Fact icon={MapPin} label="Office Address" value={job.office_address} />}
              </dl>
              <Block title="Job Description" html={job.description} />
              <Block title="Roles & Responsibilities" html={job.responsibilities} />
              <Block title="Requirements" html={job.requirements} />
              {skills.length > 0 && (
                <section className="mt-6">
                  <h3 className="mb-2.5 text-[16px] font-bold text-[var(--ink)]">Required Skills</h3>
                  <ul className="flex flex-wrap gap-2">
                    {skills.map((s) => (
                      <li key={s} className="rounded-full border border-[var(--line-strong)] bg-[var(--surface-soft)] px-3 py-1.5 text-[13px] font-medium text-[var(--ink-soft)]">{s}</li>
                    ))}
                  </ul>
                </section>
              )}
              <Block title="Additional Requirements" html={job.additional_requirements} />
              {job.contact_email && (
                <p className="mt-6 flex items-center gap-2 break-all text-[13px] text-[var(--muted)]">
                  <Mail className="h-4 w-4 shrink-0" aria-hidden="true" /> Questions? {job.contact_person ? `${job.contact_person} · ` : ""}
                  <a href={`mailto:${job.contact_email}`} className="font-semibold text-purple-700">{job.contact_email}</a>
                </p>
              )}
            </>
          )}
        </div>

        {job && (
          <div className="flex flex-col-reverse gap-2 border-t border-[var(--line)] bg-[var(--surface-soft)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-[13.5px] text-[var(--muted)]">
              {job.is_open ? (deadline ? <>Apply before <b className="text-[var(--ink-soft)]">{fmtDate(deadline)}</b></> : "Applications open") : "Applications Closed"}
            </p>
            {job.is_open ? (
              <ApplyPanel job={{ id: job.id, title: job.title }} options={state.options} autoOpen={startApply} />
            ) : (
              <span className="rounded-xl bg-gray-100 px-4 py-2.5 text-center text-[14px] font-semibold text-gray-600">Applications Closed</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
