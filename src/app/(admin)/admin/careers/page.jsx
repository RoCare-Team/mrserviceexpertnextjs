"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BriefcaseBusiness, CircleCheck, FilePen, Ban, Users, Sparkles, ListChecks, Award, UserCheck, CalendarClock, Plus, ArrowRight,
} from "lucide-react";
import { PageHead, Toast } from "@/app/(admin)/admin/components/AdminUI";
import { api, useToast, CareersNav, StatCard, statGrid, AppStatusBadge, JobStatusBadge, fmtDT } from "./_shared";
import { INTERVIEW_MODES } from "@/lib/careers/constants";

function Panel({ title, href, linkLabel, children }) {
  return (
    <section className="adm-card" style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h2>
        {href && (
          <Link href={href} style={{ marginLeft: "auto", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 4 }}>
            {linkLabel} <ArrowRight size={13} />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

const rowStyle = { display: "flex", gap: 10, alignItems: "center", padding: "10px 0", borderTop: "1px solid var(--adm-border)" };

export default function CareersDashboard() {
  const [d, setD] = useState(null);
  const [toast, showToast] = useToast();

  useEffect(() => {
    api("/api/admin/careers/stats").then(setD).catch((e) => showToast(e.message, "error"));
  }, [showToast]);

  const loading = !d;
  const j = d?.jobs || {};
  const a = d?.applications || {};

  return (
    <div>
      <CareersNav />
      <PageHead eyebrow="Careers" title="Recruitment dashboard" subtitle="Live numbers from your job postings and candidate applications." />

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        <Link href="/admin/careers/jobs/new" className="adm-btn adm-btn-primary"><Plus size={16} /> Add new job</Link>
        <Link href="/admin/careers/applications?status=new" className="adm-btn"><Sparkles size={16} /> Review new applications{a.new ? ` (${a.new})` : ""}</Link>
      </div>

      <h3 className="adm-section-title" style={{ marginBottom: 10 }}>Jobs</h3>
      <div style={statGrid}>
        <StatCard label="Total jobs" value={j.total} icon={BriefcaseBusiness} href="/admin/careers/jobs" loading={loading} />
        <StatCard label="Active jobs" value={j.active} icon={CircleCheck} href="/admin/careers/jobs?status=published" loading={loading} />
        <StatCard label="Draft jobs" value={j.draft} icon={FilePen} href="/admin/careers/jobs?status=draft" loading={loading} />
        <StatCard label="Closed / expired jobs" value={j.closed} icon={Ban} href="/admin/careers/jobs?status=closed" loading={loading} />
      </div>

      <h3 className="adm-section-title" style={{ marginBottom: 10 }}>Applications</h3>
      <div style={statGrid}>
        <StatCard label="Total applications" value={a.total} icon={Users} href="/admin/careers/applications" loading={loading} />
        <StatCard label="New applications" value={a.new} icon={Sparkles} href="/admin/careers/applications?status=new" loading={loading} />
        <StatCard label="Shortlisted" value={a.shortlisted} icon={ListChecks} href="/admin/careers/applications?status=shortlisted" loading={loading} />
        <StatCard label="Selected" value={a.selected} icon={Award} href="/admin/careers/applications?status=selected" loading={loading} />
        <StatCard label="Hired" value={a.hired} icon={UserCheck} href="/admin/careers/applications?status=hired" loading={loading} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
        <Panel title="Upcoming interviews" href="/admin/careers/interviews" linkLabel="All interviews">
          {loading ? (
            <div className="adm-skel" style={{ height: 80 }} />
          ) : d.upcomingInterviews.length === 0 ? (
            <p className="col-muted">No upcoming interviews.</p>
          ) : (
            d.upcomingInterviews.map((iv) => (
              <div key={iv.id} style={rowStyle}>
                <CalendarClock size={18} style={{ color: "var(--adm-brand)", flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Link href={`/admin/careers/applications/${iv.application_id}`} style={{ fontWeight: 600 }}>{iv.full_name}</Link>
                  <span className="col-muted" style={{ display: "block", fontSize: 12.5 }}>
                    {iv.job_title} · Round {iv.round_no} · {INTERVIEW_MODES[iv.mode]}
                  </span>
                </div>
                <span style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>{fmtDT(iv.scheduled_at)}</span>
              </div>
            ))
          )}
        </Panel>

        <Panel title="Recent applications" href="/admin/careers/applications" linkLabel="All applications">
          {loading ? (
            <div className="adm-skel" style={{ height: 80 }} />
          ) : d.recentApplications.length === 0 ? (
            <p className="col-muted">No applications yet.</p>
          ) : (
            d.recentApplications.map((r) => (
              <div key={r.id} style={rowStyle}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Link href={`/admin/careers/applications/${r.id}`} style={{ fontWeight: 600 }}>{r.full_name}</Link>
                  <span className="col-muted" style={{ display: "block", fontSize: 12.5 }}>
                    {r.application_code} · {r.job_title} · {fmtDT(r.created_at)}
                  </span>
                </div>
                <AppStatusBadge status={r.status} />
              </div>
            ))
          )}
        </Panel>

        <Panel title="Recent jobs" href="/admin/careers/jobs" linkLabel="All jobs">
          {loading ? (
            <div className="adm-skel" style={{ height: 80 }} />
          ) : d.recentJobs.length === 0 ? (
            <p className="col-muted">
              No jobs yet. <Link href="/admin/careers/jobs/new">Create the first one</Link>.
            </p>
          ) : (
            d.recentJobs.map((r) => (
              <div key={r.id} style={rowStyle}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Link href={`/admin/careers/jobs/${r.id}`} style={{ fontWeight: 600 }}>{r.title}</Link>
                  <span className="col-muted" style={{ display: "block", fontSize: 12.5 }}>
                    {r.code} · {r.department}{r.city ? ` · ${r.city}` : ""} · {r.applications} application(s)
                  </span>
                </div>
                <JobStatusBadge job={r} />
              </div>
            ))
          )}
        </Panel>
      </div>
      <Toast toast={toast} />
    </div>
  );
}
