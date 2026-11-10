"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Eye, Pencil, MoreHorizontal, ExternalLink, Users, Star } from "lucide-react";
import {
  PageHead, Field, SearchInput, Select, Button, Dash, TableState, Pagination, Modal, Toast, ConfirmDialog, SortHeader,
} from "@/app/(admin)/admin/components/AdminUI";
import { api, useToast, JobStatusBadge, CareersNav, fmtD, fmtDT } from "../_shared";
import { EMPLOYMENT_TYPES, WORK_MODES, experienceLabel, salaryLabel } from "@/lib/careers/constants";

const ACTIONS = {
  publish: { label: "Publish", title: "Publish this job?", message: "It will appear on the Careers page and accept applications.", confirm: "Yes, publish" },
  unpublish: { label: "Unpublish", title: "Unpublish this job?", message: "It moves back to draft and disappears from the website. Applications are kept.", confirm: "Yes, unpublish" },
  close: { label: "Close", title: "Close applications?", message: "The job stops accepting applications and shows “Applications Closed”. Existing applications are NOT rejected.", confirm: "Yes, close", danger: true },
  reopen: { label: "Reopen", title: "Reopen this job?", message: "It will accept applications again.", confirm: "Yes, reopen" },
  duplicate: { label: "Duplicate", title: "Duplicate this job?", message: "A copy is created as a draft (dates and featured flag cleared).", confirm: "Yes, duplicate" },
  archive: { label: "Archive", title: "Archive this job?", message: "It is hidden from the website and job lists. The job and all its applications stay stored for your records.", confirm: "Yes, archive", danger: true },
  restore: { label: "Restore", title: "Restore this job?", message: "It is restored as a draft.", confirm: "Yes, restore" },
};

const actionsFor = (j) =>
  ({
    draft: ["publish", "duplicate", "archive"],
    published: ["close", "unpublish", "duplicate", "archive"],
    closed: ["reopen", "duplicate", "archive"],
    archived: ["restore", "duplicate"],
  })[j.status] || [];

export default function CareerJobsPage() {
  const router = useRouter();
  const [data, setData] = useState({ rows: [], total: 0, totalPages: 1, departments: [], cities: [] });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [department, setDepartment] = useState("");
  const [city, setCity] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ by: "id", dir: "DESC" });
  const [menu, setMenu] = useState(null);
  const [pending, setPending] = useState(null);
  const [working, setWorking] = useState(false);
  const [view, setView] = useState(null);
  const [toast, showToast] = useToast();
  const timer = useRef(null);
  const limit = 20;

  const [ready, setReady] = useState(false);
  useEffect(() => {
    const s = new URLSearchParams(window.location.search).get("status");
    if (["draft", "published", "closed", "archived", "expired"].includes(s)) setStatus(s);
    setReady(true);
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => (setSearch(searchInput), setPage(1)), 350);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page, limit, status, department, city, search, sort: sort.by, dir: sort.dir });
      setData(await api(`/api/admin/careers/jobs?${qs}`));
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, status, department, city, search, sort, showToast]);

  useEffect(() => {
    if (ready) load();
  }, [load, ready]);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => (window.removeEventListener("click", close), window.removeEventListener("scroll", close, true));
  }, [menu]);

  const onSort = (col) => setSort((s) => ({ by: col, dir: s.by === col && s.dir === "DESC" ? "ASC" : "DESC" }));

  const run = async () => {
    setWorking(true);
    try {
      const r = await api(`/api/admin/careers/jobs/${pending.job.id}`, "POST", { action: pending.action });
      showToast(r.message || "Done.");
      setPending(null);
      if (pending.action === "duplicate" && r.id) router.push(`/admin/careers/jobs/${r.id}`);
      else load();
    } catch (e) {
      showToast(e.message, "error");
      setPending(null);
    } finally {
      setWorking(false);
    }
  };

  const openView = async (j) => {
    setView({ loading: true, code: j.code });
    try {
      setView(await api(`/api/admin/careers/jobs/${j.id}`));
    } catch (e) {
      showToast(e.message, "error");
      setView(null);
    }
  };

  const from = data.total ? (page - 1) * limit + 1 : 0;
  const to = Math.min(page * limit, data.total);

  return (
    <div>
      <CareersNav />
      <PageHead eyebrow="Careers" title="Job listings" subtitle="Create, publish, close and archive job postings. Archived jobs are kept for your records." count={data.total} countLabel="jobs" />

      <div className="adm-toolbar">
        <Field label="Search (title, department, city, Job ID)" grow>
          <SearchInput value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="e.g. Sales or JOB-0003" />
        </Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))}>
            <option value="">All (except archived)</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="expired">Expired</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </Select>
        </Field>
        <Field label="Department">
          <Select value={department} onChange={(e) => (setDepartment(e.target.value), setPage(1))}>
            <option value="">All</option>
            {data.departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </Select>
        </Field>
        <Field label="City">
          <Select value={city} onChange={(e) => (setCity(e.target.value), setPage(1))}>
            <option value="">All</option>
            {data.cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label=" ">
          <Link href="/admin/careers/jobs/new" className="adm-btn adm-btn-primary">
            <Plus size={16} /> Add new job
          </Link>
        </Field>
      </div>

      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr>
                <SortHeader label="Job ID" col="id" sortBy={sort.by} sortDir={sort.dir} onSort={onSort} />
                <SortHeader label="Job title" col="title" sortBy={sort.by} sortDir={sort.dir} onSort={onSort} />
                <SortHeader label="Department" col="department" sortBy={sort.by} sortDir={sort.dir} onSort={onSort} />
                <SortHeader label="City" col="city" sortBy={sort.by} sortDir={sort.dir} onSort={onSort} />
                <SortHeader label="Vacancies" col="vacancies" sortBy={sort.by} sortDir={sort.dir} onSort={onSort} />
                <SortHeader label="Applications" col="applications" sortBy={sort.by} sortDir={sort.dir} onSort={onSort} />
                <SortHeader label="Publish date" col="publish_date" sortBy={sort.by} sortDir={sort.dir} onSort={onSort} />
                <SortHeader label="Deadline" col="deadline" sortBy={sort.by} sortDir={sort.dir} onSort={onSort} />
                <SortHeader label="Status" col="status" sortBy={sort.by} sortDir={sort.dir} onSort={onSort} />
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading || data.rows.length === 0 ? (
                <TableState colSpan={10} loading={loading} emptyTitle="No jobs found" emptyHint="Create your first job posting with “Add new job”." />
              ) : (
                data.rows.map((j) => (
                  <tr key={j.id}>
                    <td className="col-id" style={{ fontFamily: "var(--adm-mono)" }}>{j.code}</td>
                    <td>
                      <Link href={`/admin/careers/jobs/${j.id}`} style={{ fontWeight: 600 }}>{j.title}</Link>
                      {Number(j.is_featured) === 1 && <Star size={13} style={{ marginLeft: 6, color: "#e08900", verticalAlign: "-2px" }} aria-label="Featured" />}
                      {Number(j.show_on_website) === 0 && <span className="col-muted" style={{ display: "block", fontSize: 12 }}>hidden from website</span>}
                    </td>
                    <td>{j.department}</td>
                    <td>{j.city || <Dash />}</td>
                    <td>{j.vacancies}</td>
                    <td>
                      <Link href={`/admin/careers/applications?jobId=${j.id}`}>{j.applications}</Link>
                      {j.new_applications > 0 && <span className="col-muted" style={{ display: "block", fontSize: 12 }}>{j.new_applications} new</span>}
                    </td>
                    <td>{j.publish_date || j.published_at ? fmtD(j.publish_date || j.published_at) : <Dash />}</td>
                    <td>{j.application_deadline ? fmtD(j.application_deadline) : j.expiry_date ? <span title="Expiry date">{fmtD(j.expiry_date)}*</span> : <Dash />}</td>
                    <td><JobStatusBadge job={j} /></td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <div className="adm-rowactions" style={{ position: "relative" }}>
                        <Button variant="ghost" size="sm" onClick={() => openView(j)} aria-label="View job"><Eye size={15} /></Button>
                        {j.status !== "archived" && (
                          <Link href={`/admin/careers/jobs/${j.id}`} className="adm-btn adm-btn-ghost adm-btn-sm" aria-label="Edit job"><Pencil size={15} /></Link>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label="More actions"
                          aria-expanded={menu?.id === j.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            const r = e.currentTarget.getBoundingClientRect();
                            setMenu(menu?.id === j.id ? null : { id: j.id, top: r.bottom + 4, right: window.innerWidth - r.right });
                          }}
                        >
                          <MoreHorizontal size={15} />
                        </Button>
                        {menu?.id === j.id && (
                          <div
                            role="menu"
                            className="adm-card"
                            style={{ position: "fixed", right: menu.right, top: menu.top, zIndex: 60, minWidth: 160, padding: 6, textAlign: "left" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {actionsFor(j).map((a) => (
                              <button
                                key={a}
                                role="menuitem"
                                type="button"
                                className="adm-btn adm-btn-ghost adm-btn-sm"
                                style={{ width: "100%", justifyContent: "flex-start", color: ACTIONS[a].danger ? "#c2253d" : undefined }}
                                onClick={() => (setMenu(null), setPending({ job: j, action: a }))}
                              >
                                {ACTIONS[a].label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data.total > 0 && <Pagination page={page} totalPages={data.totalPages} from={from} to={to} total={data.total} onPage={setPage} />}
      </div>
      <p className="col-muted" style={{ fontSize: 12, marginTop: 8 }}>* expiry date (no application deadline set). Expired jobs close automatically.</p>

      {pending && (
        <ConfirmDialog
          title={ACTIONS[pending.action].title}
          message={`${pending.job.code} · ${pending.job.title} — ${ACTIONS[pending.action].message}`}
          confirmLabel={ACTIONS[pending.action].confirm}
          tone={ACTIONS[pending.action].danger ? "danger" : undefined}
          saving={working}
          onCancel={() => setPending(null)}
          onConfirm={run}
        />
      )}

      {view && (
        <Modal
          title={view.loading ? "Loading…" : view.title}
          id={view.code}
          onClose={() => setView(null)}
          size="wide"
          footer={
            !view.loading && (
              <>
                <Link className="adm-btn" href={`/admin/careers/applications?jobId=${view.id}`}><Users size={15} /> Applications ({view.applications})</Link>
                {view.is_open && <a className="adm-btn" href={`/careers?job=${view.slug}`} target="_blank" rel="noreferrer"><ExternalLink size={15} /> View on careers page</a>}
                {view.status !== "archived" && <Link className="adm-btn adm-btn-primary" href={`/admin/careers/jobs/${view.id}`}><Pencil size={15} /> Edit</Link>}
              </>
            )
          }
        >
          {!view.loading && (
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                <JobStatusBadge job={view} />
                <span className="col-muted">/careers?job={view.slug}</span>
              </div>
              <div className="adm-form-2col" style={{ gap: 10 }}>
                {[
                  ["Department", view.department],
                  ["Location", [view.city, view.state, view.country].filter(Boolean).join(", ")],
                  ["Employment type", EMPLOYMENT_TYPES[view.employment_type]],
                  ["Work mode", WORK_MODES[view.work_mode]],
                  ["Experience", experienceLabel(view.experience_min, view.experience_max)],
                  ["Qualification", view.qualification],
                  ["Vacancies", view.vacancies],
                  ["Salary", salaryLabel(view) || "Not shown"],
                  ["Application deadline", view.application_deadline ? fmtD(view.application_deadline) : "—"],
                  ["Expiry date", view.expiry_date ? fmtD(view.expiry_date) : "—"],
                  ["Publish date", fmtDT(view.publish_date)],
                  ["Contact", [view.contact_person, view.contact_email].filter(Boolean).join(" · ") || "—"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div className="adm-label">{k}</div>
                    <div>{v || "—"}</div>
                  </div>
                ))}
              </div>
              {view.short_description && <p>{view.short_description}</p>}
              {view.description && <div className="adm-note-box" style={{ maxHeight: 260, overflow: "auto" }} dangerouslySetInnerHTML={{ __html: view.description }} />}
            </div>
          )}
        </Modal>
      )}
      <Toast toast={toast} />
    </div>
  );
}
