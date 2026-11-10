"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Loader2, BriefcaseBusiness, RotateCcw, AlertCircle, SlidersHorizontal } from "lucide-react";
import JobCard from "./JobCard";
import JobDetailsModal from "./JobDetailsModal";
import { EMPLOYMENT_TYPES, EXPERIENCE_FILTERS } from "@/lib/careers/constants";

const EMPTY = { q: "", department: "", city: "", type: "", experience: "" };
const selectCls =
  "min-h-11 w-full rounded-xl border border-[var(--line-strong)] bg-white px-3 text-[14px] text-[var(--ink-soft)] focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200";

// ?job=<slug> only opens the popup (shareable link). The canonical stays
// /careers, so no job ever gets an indexable URL of its own.
function setJobParam(slug) {
  const u = new URL(window.location.href);
  if (slug) u.searchParams.set("job", slug);
  else u.searchParams.delete("job");
  window.history.replaceState(null, "", u.pathname + (u.search || ""));
}

export default function CareersBrowser({ initial, initialFilters, options, initialJob = "" }) {
  const [openJob, setOpenJob] = useState(initialJob ? { slug: initialJob, apply: false } : null);
  const openDetails = (job, apply) => {
    setOpenJob({ slug: job.slug, apply });
    setJobParam(job.slug);
  };
  const closeDetails = useCallback(() => {
    setOpenJob(null);
    setJobParam(null);
  }, []);
  const [filters, setFilters] = useState({ ...EMPTY, ...initialFilters });
  const [jobs, setJobs] = useState(initial.rows);
  const [total, setTotal] = useState(initial.total);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initial.hasMore);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const first = useRef(true);
  const timer = useRef(null);
  const reqId = useRef(0);

  const qs = (f, p) => {
    const s = new URLSearchParams();
    Object.entries(f).forEach(([k, v]) => v && s.set(k, v));
    if (p > 1) s.set("page", p);
    return s;
  };

  async function fetchPage(f, p) {
    const res = await fetch(`/api/careers/jobs?${qs(f, p)}`, { cache: "no-store" });
    const json = await res.json().catch(() => null);
    if (!json?.success) throw new Error(json?.error?.message || "Could not load jobs. Please try again.");
    return json.data;
  }

  // Re-query when filters change (search box is debounced).
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      const id = ++reqId.current;
      setLoading(true);
      setError("");
      const s = qs(filters, 1).toString();
      window.history.replaceState(null, "", s ? `/careers?${s}` : "/careers");
      try {
        const d = await fetchPage(filters, 1);
        if (id !== reqId.current) return;
        setJobs(d.rows);
        setTotal(d.total);
        setHasMore(d.hasMore);
        setPage(1);
      } catch (e) {
        if (id === reqId.current) setError(e.message);
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer.current);
  }, [filters]);

  const loadMore = async () => {
    setLoadingMore(true);
    setError("");
    try {
      const d = await fetchPage(filters, page + 1);
      setJobs((j) => [...j, ...d.rows.filter((r) => !j.some((x) => x.id === r.id))]);
      setHasMore(d.hasMore);
      setTotal(d.total);
      setPage(page + 1);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const set = (k) => (e) => setFilters((f) => ({ ...f, [k]: e.target.value }));
  const active = Object.values(filters).some(Boolean);

  return (
    <div>
      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-sm)] sm:p-5"
        aria-label="Search jobs"
      >
        <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wide text-[var(--muted)]">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" /> Find your role
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
          <label className="relative block">
            <span className="sr-only">Search by job title</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" aria-hidden="true" />
            <input
              type="search"
              value={filters.q}
              onChange={set("q")}
              placeholder="Search by job title"
              maxLength={80}
              className={`${selectCls} pl-9`}
            />
          </label>
          <label>
            <span className="sr-only">Department</span>
            <select value={filters.department} onChange={set("department")} className={selectCls}>
              <option value="">All departments</option>
              {options.departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">City</span>
            <select value={filters.city} onChange={set("city")} className={selectCls}>
              <option value="">All cities</option>
              {options.cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Employment type</span>
            <select value={filters.type} onChange={set("type")} className={selectCls}>
              <option value="">All job types</option>
              {Object.entries(EMPLOYMENT_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Experience</span>
            <select value={filters.experience} onChange={set("experience")} className={selectCls}>
              <option value="">Any experience</option>
              {Object.entries(EXPERIENCE_FILTERS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </label>
        </div>
      </form>

      <div className="mb-4 mt-6 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[14px] text-[var(--muted)]" aria-live="polite">
          {loading ? "Searching…" : `${total} ${total === 1 ? "opening" : "openings"}${active ? " match your filters" : ""}`}
        </p>
        {active && (
          <button
            type="button"
            onClick={() => setFilters(EMPTY)}
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-purple-700 hover:text-purple-900"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Clear filters
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" /> {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-2xl border border-[var(--line)] bg-white" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line-strong)] bg-white px-6 py-14 text-center">
          <span className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50 text-purple-700">
            <BriefcaseBusiness className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="text-xl font-bold text-[var(--ink)]">{active ? "No jobs match your search" : "No Current Openings"}</h2>
          <p className="mx-auto mt-2 max-w-md text-[15px] text-[var(--muted)]">
            {active
              ? "Try a different title, city or job type — or clear the filters to see every opening."
              : "We don't have any open positions right now. Please check back soon — new roles are posted here as soon as they open."}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((j) => (
              <JobCard key={j.id} job={j} onOpen={openDetails} />
            ))}
          </div>
          {hasMore && (
            <div className="mt-8 text-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--line-strong)] bg-white px-6 text-[15px] font-semibold text-[var(--ink-soft)] transition hover:border-purple-300 hover:bg-purple-50 disabled:opacity-60"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {loadingMore ? "Loading…" : "Load more jobs"}
              </button>
            </div>
          )}
        </>
      )}
      {openJob && <JobDetailsModal key={openJob.slug} slug={openJob.slug} startApply={openJob.apply} onClose={closeDetails} />}
    </div>
  );
}
