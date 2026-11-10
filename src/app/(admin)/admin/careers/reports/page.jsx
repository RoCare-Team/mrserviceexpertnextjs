"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Download, Users, Award, UserCheck, ListChecks, XCircle, RotateCcw } from "lucide-react";
import { PageHead, Field, Input, Select, Button, Toast, Modal } from "@/app/(admin)/admin/components/AdminUI";
import { api, useToast, CareersNav, StatCard, statGrid, fmtD } from "../_shared";
import { APPLICATION_STATUSES } from "@/lib/careers/constants";

const pct = (n, total) => (total ? `${Math.round((n / total) * 1000) / 10}%` : "—");

function Table({ title, head, rows, empty = "No data for this period." }) {
  return (
    <section className="adm-tablecard">
      <div style={{ padding: "14px 16px 0" }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{title}</h2>
      </div>
      <div className="adm-tablescroll">
        <table className="adm-table">
          <thead>
            <tr>{head.map((h, i) => <th key={h} style={i ? { textAlign: "right" } : undefined}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={head.length} className="col-muted" style={{ padding: 18 }}>{empty}</td></tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j} style={j ? { textAlign: "right", fontVariantNumeric: "tabular-nums" } : undefined}>{c}</td>)}</tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function CareerReportsPage() {
  const [range, setRange] = useState({ from: "", to: "", jobId: "" });
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [withContact, setWithContact] = useState(false);
  const [toast, showToast] = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams(Object.entries(range).filter(([, v]) => v));
      setD(await api(`/api/admin/careers/reports?${qs}`));
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [range, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k) => (e) => setRange((r) => ({ ...r, [k]: e.target.value }));
  const preset = (days) => {
    const to = new Date();
    const from = new Date(Date.now() - (days - 1) * 86400000);
    const f = (x) => x.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    setRange((r) => ({ ...r, from: f(from), to: f(to) }));
  };

  const doExport = () => {
    const qs = new URLSearchParams(Object.entries(range).filter(([, v]) => v));
    if (withContact) qs.set("contact", "1");
    window.location.href = `/api/admin/careers/applications/export?${qs}`;
    setExportOpen(false);
    showToast("Export started — your CSV will download shortly.");
  };

  const t = d?.totals || {};

  return (
    <div>
      <CareersNav />
      <PageHead eyebrow="Careers" title="Recruitment reports" subtitle="Application statistics by job, department, city, status and date. Filter by date range or job." />

      <div className="adm-toolbar">
        <Field label="From"><Input type="date" value={range.from} onChange={set("from")} /></Field>
        <Field label="To"><Input type="date" value={range.to} onChange={set("to")} /></Field>
        <Field label="Job">
          <Select value={range.jobId} onChange={set("jobId")}>
            <option value="">All jobs</option>
            {(d?.jobs || []).map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
          </Select>
        </Field>
        <Field label="Quick range">
          <div style={{ display: "flex", gap: 6 }}>
            <Button size="sm" onClick={() => preset(7)}>7 days</Button>
            <Button size="sm" onClick={() => preset(30)}>30 days</Button>
            <Button size="sm" onClick={() => preset(90)}>90 days</Button>
            <Button size="sm" onClick={() => setRange({ from: "", to: "", jobId: "" })} title="All time"><RotateCcw size={14} /></Button>
          </div>
        </Field>
        <Field label=" ">
          <Button onClick={() => setExportOpen(true)} disabled={!t.total}><Download size={15} /> Export CSV</Button>
        </Field>
      </div>

      <div style={statGrid}>
        <StatCard label="Total applications" value={t.total} icon={Users} loading={loading} />
        <StatCard label="Shortlisted" value={t.shortlisted} icon={ListChecks} loading={loading} />
        <StatCard label="Selected" value={t.selected} icon={Award} loading={loading} />
        <StatCard label="Hired" value={t.hired} icon={UserCheck} loading={loading} />
        <StatCard label="Rejected" value={t.rejected} icon={XCircle} loading={loading} />
      </div>

      {d && (
        <div style={{ display: "grid", gap: 18 }}>
          <Table
            title="Job-wise applications"
            head={["Job", "Applications", "Selected", "Hired", "Share"]}
            rows={d.byJob.map((r) => [
              <Link key="j" href={`/admin/careers/applications?jobId=${r.id}`}>{r.code} · {r.title}</Link>,
              r.total, r.selected, r.hired, pct(r.total, t.total),
            ])}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
            <Table title="Department-wise applications" head={["Department", "Applications", "Hired", "Share"]} rows={d.byDepartment.map((r) => [r.label, r.total, r.hired, pct(r.total, t.total)])} />
            <Table title="Status-wise applications" head={["Status", "Applications", "Share"]} rows={Object.keys(APPLICATION_STATUSES).map((k) => { const n = d.byStatus.find((s) => s.label === k)?.total || 0; return [APPLICATION_STATUSES[k], n, pct(n, t.total)]; })} />
            <Table title="City-wise applications (candidate city)" head={["City", "Applications", "Share"]} rows={d.byCity.map((r) => [r.label, r.total, pct(r.total, t.total)])} />
            <Table title="Applications by date" head={["Date", "Applications"]} rows={[...d.byDate].reverse().slice(0, 60).map((r) => [fmtD(r.day), r.total])} />
          </div>
        </div>
      )}

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
          <p style={{ marginBottom: 12 }}>Exports the {t.total} application(s) in this report&apos;s date range / job. Resumes, cover letters, salaries and notes are never included.</p>
          <label style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <input type="checkbox" checked={withContact} onChange={(e) => setWithContact(e.target.checked)} style={{ marginTop: 4 }} />
            <span>Include candidate mobile and email <span className="col-muted" style={{ display: "block", fontSize: 12.5 }}>Recorded in the audit log.</span></span>
          </label>
        </Modal>
      )}
      <Toast toast={toast} />
    </div>
  );
}
