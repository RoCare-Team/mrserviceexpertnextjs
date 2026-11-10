"use client";

// Shared client helpers for the Careers admin pages.

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BriefcaseBusiness, PlusCircle, Users, CalendarClock, BarChart3, Settings } from "lucide-react";
import { Badge } from "@/app/(admin)/admin/components/AdminUI";
import { APPLICATION_STATUSES, JOB_STATUSES } from "@/lib/careers/constants";

export async function api(url, method = "GET", body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = await res.json().catch(() => null);
  if (!json?.success) {
    const e = new Error(json?.error?.message || json?.message || `Request failed (${res.status}).`);
    e.fields = json?.error?.fields;
    e.status = res.status;
    throw e;
  }
  return json.data;
}

export function useToast() {
  const [toast, setToast] = useState(null);
  const t = useRef(null);
  const show = useCallback((message, type = "success") => {
    clearTimeout(t.current);
    setToast({ message, type });
    t.current = setTimeout(() => setToast(null), 3800);
  }, []);
  return [toast, show];
}

const APP_TONE = {
  new: "warn",
  under_review: "info",
  shortlisted: "info",
  interview_scheduled: "info",
  selected: "ok",
  hired: "ok",
  rejected: "off",
  withdrawn: "off",
};

export function AppStatusBadge({ status }) {
  return <Badge tone={APP_TONE[status] || "off"}>{APPLICATION_STATUSES[status] || status}</Badge>;
}

export function JobStatusBadge({ job }) {
  if (job.status === "published" && job.is_expired) return <Badge tone="warn">Expired</Badge>;
  if (job.status === "published" && Number(job.show_on_website) === 0) return <Badge tone="info">Published · hidden</Badge>;
  if (job.status === "published" && !job.is_open) return <Badge tone="info">Scheduled</Badge>;
  const tone = { published: "ok", draft: "info", closed: "off", archived: "off" }[job.status] || "off";
  return <Badge tone={tone}>{JOB_STATUSES[job.status] || job.status}</Badge>;
}

const TABS = [
  { href: "/admin/careers", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/careers/jobs", label: "Job Listings", icon: BriefcaseBusiness, exact: true },
  { href: "/admin/careers/jobs/new", label: "Add New Job", icon: PlusCircle, exact: true },
  { href: "/admin/careers/applications", label: "Applications", icon: Users },
  { href: "/admin/careers/interviews", label: "Interviews", icon: CalendarClock },
  { href: "/admin/careers/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin/careers/settings", label: "Settings", icon: Settings },
];

/** Sub-navigation shown on every careers admin page. */
export function CareersNav() {
  const path = usePathname() || "";
  const active = (t) =>
    t.exact ? path === t.href : path.startsWith(t.href);
  const jobEdit = /^\/admin\/careers\/jobs\/\d+/.test(path);
  return (
    <nav className="adm-tabs" aria-label="Careers sections" style={{ marginBottom: 18 }}>
      {TABS.map((t) => {
        const Icon = t.icon;
        const on = active(t) || (jobEdit && t.href === "/admin/careers/jobs");
        return (
          <Link key={t.href} href={t.href} className={`adm-tab ${on ? "on" : ""}`} aria-current={on ? "page" : undefined}>
            <Icon size={15} />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export const fmtDT = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }) : "—";
export const fmtD = (d) =>
  d
    ? new Date(String(d).length === 10 ? `${d}T00:00:00+05:30` : d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" })
    : "—";

export function StatCard({ label, value, icon: Icon, href, loading, tone }) {
  const inner = (
    <>
      <span className="spark" />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div className="ico" style={tone ? { background: tone } : undefined}>
          <Icon size={20} />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        {loading ? <div className="adm-skel" style={{ height: 30, width: 70 }} /> : <div className="num">{Number(value || 0).toLocaleString("en-IN")}</div>}
        <div className="lbl" style={{ marginTop: 6 }}>{label}</div>
      </div>
    </>
  );
  return href ? (
    <Link href={href} className="adm-stat" style={{ display: "block" }}>{inner}</Link>
  ) : (
    <div className="adm-stat">{inner}</div>
  );
}

export const statGrid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 22 };
