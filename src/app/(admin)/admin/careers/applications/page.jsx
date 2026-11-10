"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, Eye, RotateCcw } from "lucide-react";
import { PageHead, Field, SearchInput, Select, Input, Button, TableState, Pagination, Toast, SortHeader, Modal } from "@/app/(admin)/admin/components/AdminUI";
import { api, useToast, AppStatusBadge, CareersNav, fmtDT } from "../_shared";
import { APPLICATION_STATUSES, EXPERIENCE_FILTERS } from "@/lib/careers/constants";

const BLANK = { jobId: "", status: "", city: "", experience: "", from: "", to: "" };

export default function CareerApplicationsPage() {
  const [data, setData] = useState({ rows: [], total: 0, totalPages: 1, jobs: [], counts: {} });
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [page, setPage] = useState(1);
  const [f, setF] = useState(BLANK);
  const [cityInput, setCityInput] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ by: "created_at", dir: "DESC" });
  const [exportOpen, setExportOpen] = useState(false);
  const [withContact, setWithContact] = useState(false);
  const [toast, showToast] = useToast();
  const timer = useRef(null);
  const limit = 20;

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    setF((x) => ({ ...x, jobId: sp.get("jobId") || "", status: sp.get("status") || "" }));
    setReady(true);
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setSearch(searchInput);
      setF((x) => (x.city === cityInput ? x : { ...x, city: cityInput }));
      setPage(1);
    }, 350);
  }, [searchInput, cityInput]);

  const query = useCallback(() => {
    const qs = new URLSearchParams();
    Object.entries({ ...f, search }).forEach(([k, v]) => v && qs.set(k, v));
    return qs;
  }, [f, search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = query();
      qs.set("page", page);
      qs.set("limit", limit);
      qs.set("sort", sort.by);
      qs.set("dir", sort.dir);
      setData(await api(`/api/admin/careers/applications?${qs}`));
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [query, page, sort, showToast]);

  useEffect(() => {
    if (ready) load();
  }, [load, ready]);

  const setFilter = (k) => (e) => (setF((x) => ({ ...x, [k]: e.target.value })), setPage(1));
  const onSort = (col) => setSort((s) => ({ by: col, dir: s.by === col && s.dir === "DESC" ? "ASC" : "DESC" }));
  const reset = () => (setF(BLANK), setCityInput(""), setSearchInput(""), setSearch(""), setPage(1));
  const active = Object.values(f).some(Boolean) || search;

  const doExport = () => {
    const qs = query();
    if (withContact) qs.set("contact", "1");
    window.location.href = `/api/admin/careers/applications/export?${qs}`;
    setExportOpen(false);
    showToast("Export started — your CSV will download shortly.");
  };

  const from = data.total ? (page - 1) * limit + 1 : 0;
  const to = Math.min(page * limit, data.total);

  return (
    <div>
      <CareersNav />
      <PageHead eyebrow="Careers" title="Applications" subtitle="Every candidate application, newest first. Open one to review the profile, download the resume and move it through the process." count={data.counts.new || 0} countLabel="new" />

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        <button type="button" className={`adm-tab ${!f.status ? "on" : ""}`} onClick={() => (setF((x) => ({ ...x, status: "" })), setPage(1))}>All</button>
        {Object.entries(APPLICATION_STATUSES).map(([k, v]) => (
          <button key={k} type="button" className={`adm-tab ${f.status === k ? "on" : ""}`} onClick={() => (setF((x) => ({ ...x, status: k })), setPage(1))}>
            {v} <span className="col-muted">({data.counts[k] || 0})</span>
          </button>
        ))}
      </div>

      <div className="adm-toolbar">
        <Field label="Search (name, mobile, email, Application ID)" grow>
          <SearchInput value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="e.g. APP-2026-000012" />
        </Field>
        <Field label="Job position">
          <Select value={f.jobId} onChange={setFilter("jobId")}>
            <option value="">All jobs</option>
            {data.jobs.map((j) => <option key={j.id} value={j.id}>{j.title}{j.status === "archived" ? " (archived)" : ""}</option>)}
          </Select>
        </Field>
        <Field label="Candidate city">
          <Input value={cityInput} onChange={(e) => setCityInput(e.target.value)} placeholder="Any" style={{ width: 130 }} />
        </Field>
        <Field label="Experience">
          <Select value={f.experience} onChange={setFilter("experience")}>
            <option value="">Any</option>
            {Object.entries(EXPERIENCE_FILTERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </Field>
        <Field label="From">
          <Input type="date" value={f.from} onChange={setFilter("from")} />
        </Field>
        <Field label="To">
          <Input type="date" value={f.to} onChange={setFilter("to")} />
        </Field>
        <Field label=" ">
          <div style={{ display: "flex", gap: 6 }}>
            {active && <Button onClick={reset} title="Clear filters"><RotateCcw size={15} /></Button>}
            <Button onClick={() => setExportOpen(true)} disabled={!data.total}><Download size={15} /> Export CSV</Button>
          </div>
        </Field>
      </div>

      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr>
                <SortHeader label="Application ID" col="code" sortBy={sort.by} sortDir={sort.dir} onSort={onSort} />
                <SortHeader label="Candidate" col="name" sortBy={sort.by} sortDir={sort.dir} onSort={onSort} />
                <th>Mobile</th>
                <th>Email</th>
                <SortHeader label="Applied job" col="job" sortBy={sort.by} sortDir={sort.dir} onSort={onSort} />
                <SortHeader label="Experience" col="experience" sortBy={sort.by} sortDir={sort.dir} onSort={onSort} />
                <SortHeader label="Applied on" col="created_at" sortBy={sort.by} sortDir={sort.dir} onSort={onSort} />
                <SortHeader label="Status" col="status" sortBy={sort.by} sortDir={sort.dir} onSort={onSort} />
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading || data.rows.length === 0 ? (
                <TableState colSpan={9} loading={loading} emptyTitle="No applications" emptyHint={active ? "Try adjusting your filters or search." : "Applications from the careers page will appear here."} />
              ) : (
                data.rows.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontFamily: "var(--adm-mono)", fontSize: 12.5 }}>
                      <Link href={`/admin/careers/applications/${a.id}`}>{a.application_code}</Link>
                    </td>
                    <td>
                      <b>{a.full_name}</b>
                      <span className="col-muted" style={{ display: "block", fontSize: 12 }}>{a.current_city}</span>
                    </td>
                    <td>{a.anonymized_at ? "—" : <a href={`tel:${a.mobile}`}>{a.mobile}</a>}</td>
                    <td className="adm-truncate" style={{ maxWidth: 200 }}>{a.anonymized_at ? "—" : <a href={`mailto:${a.email}`}>{a.email}</a>}</td>
                    <td>
                      {a.job_title}
                      <span className="col-muted" style={{ display: "block", fontSize: 12 }}>{a.department}</span>
                    </td>
                    <td>{Number(a.total_experience)} yrs</td>
                    <td style={{ whiteSpace: "nowrap" }}>{fmtDT(a.created_at)}</td>
                    <td><AppStatusBadge status={a.status} /></td>
                    <td style={{ textAlign: "right" }}>
                      <Link href={`/admin/careers/applications/${a.id}`} className="adm-btn adm-btn-ghost adm-btn-sm"><Eye size={15} /> Open</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data.total > 0 && <Pagination page={page} totalPages={data.totalPages} from={from} to={to} total={data.total} onPage={setPage} />}
      </div>

      {exportOpen && (
        <Modal
          title="Export applications"
          onClose={() => setExportOpen(false)}
          footer={
            <>
              <Button onClick={() => setExportOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={doExport}><Download size={15} /> Download CSV</Button>
            </>
          }
        >
          <p style={{ marginBottom: 12 }}>
            Exports the <b>{data.total}</b> application(s) matching the current filters. Resumes, cover letters, salaries and internal notes are never included.
          </p>
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <input type="checkbox" checked={withContact} onChange={(e) => setWithContact(e.target.checked)} style={{ marginTop: 4 }} />
            <span>
              Include candidate mobile and email.
              <span className="col-muted" style={{ display: "block", fontSize: 12.5 }}>Personal data — only export when needed. Every export is recorded in the audit log.</span>
            </span>
          </label>
        </Modal>
      )}
      <Toast toast={toast} />
    </div>
  );
}
