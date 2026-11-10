import { MapPin, Briefcase, Clock, Users, CalendarClock, IndianRupee, Star, Building2 } from "lucide-react";
import { EMPLOYMENT_TYPES, WORK_MODES, experienceLabel, salaryLabel, fmtDate } from "@/lib/careers/constants";

export const locationLabel = (j) =>
  j.work_mode === "remote" ? (j.city ? `Remote · ${j.city}` : "Remote") : [j.city, j.state].filter(Boolean).join(", ") || j.country;

function Fact({ icon: Icon, children }) {
  return (
    <li className="flex min-w-0 items-center gap-1.5 text-[13px] text-[var(--ink-soft)]">
      <Icon className="h-3.5 w-3.5 shrink-0 text-purple-600" aria-hidden="true" />
      <span className="truncate">{children}</span>
    </li>
  );
}

export default function JobCard({ job, onOpen }) {
  const salary = salaryLabel(job);
  const deadline = job.application_deadline || job.expiry_date;
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-sm)] transition hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-[var(--shadow-md)]">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-purple-800">
          <Building2 className="h-3 w-3" aria-hidden="true" /> {job.department}
        </span>
        {Number(job.is_featured) === 1 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--amber-soft)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[var(--amber-text)]">
            <Star className="h-3 w-3" aria-hidden="true" /> Featured
          </span>
        )}
      </div>
      <h3 className="text-lg font-bold leading-snug text-[var(--ink)]">
        {/* No per-job URL on purpose: details open in a popup on /careers. */}
        <button
          type="button"
          onClick={() => onOpen?.(job, false)}
          className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
        >
          {job.title}
        </button>
      </h3>
      {job.short_description && <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-[var(--body-text)]">{job.short_description}</p>}
      <ul className="mt-4 grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-2">
        <Fact icon={MapPin}>{locationLabel(job)}</Fact>
        <Fact icon={Clock}>
          {EMPLOYMENT_TYPES[job.employment_type]}
          {job.work_mode !== "office" ? ` · ${WORK_MODES[job.work_mode]}` : ""}
        </Fact>
        <Fact icon={Briefcase}>{experienceLabel(job.experience_min, job.experience_max)}</Fact>
        <Fact icon={Users}>
          {job.vacancies} {Number(job.vacancies) === 1 ? "vacancy" : "vacancies"}
        </Fact>
        {salary && <Fact icon={IndianRupee}>{salary}</Fact>}
        {deadline && <Fact icon={CalendarClock}>Apply by {fmtDate(deadline)}</Fact>}
      </ul>
      <div className="mt-auto flex gap-2 pt-5">
        <button
          type="button"
          onClick={() => onOpen?.(job, false)}
          className="relative z-[1] inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-[var(--line-strong)] bg-white px-4 text-[14px] font-semibold text-[var(--ink-soft)] transition group-hover:border-purple-300 hover:bg-purple-50"
        >
          View Details
        </button>
        <button
          type="button"
          onClick={() => onOpen?.(job, true)}
          className="relative z-[1] inline-flex min-h-10 flex-1 items-center justify-center rounded-xl bg-[image:var(--grad-brand)] px-4 text-[14px] font-semibold text-white shadow-[var(--shadow-cta)] transition hover:brightness-110"
        >
          Apply Now
        </button>
      </div>
    </article>
  );
}
