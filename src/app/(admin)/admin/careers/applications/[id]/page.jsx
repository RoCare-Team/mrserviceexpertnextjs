"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Download, Eye, FileText, Loader2, CalendarPlus, CalendarClock, XCircle, MessageSquareText, Mail, Phone, ShieldAlert, History, StickyNote,
} from "lucide-react";
import { PageHead, Field, Select, Textarea, Button, Badge, Toast, ConfirmDialog, FieldNote, SectionTitle } from "@/app/(admin)/admin/components/AdminUI";
import { api, useToast, AppStatusBadge, CareersNav, fmtDT } from "../../_shared";
import InterviewModal from "../../InterviewModal";
import { APPLICATION_STATUSES, NOTIFY_STATUSES, INTERVIEW_STATUSES, INTERVIEW_RESULTS, INTERVIEW_MODES, formatBytes } from "@/lib/careers/constants";

const EVENT_LABEL = {
  submitted: "Application submitted",
  status_changed: "Status changed",
  interview_scheduled: "Interview scheduled",
  interview_rescheduled: "Interview rescheduled",
  interview_cancelled: "Interview cancelled",
  interview_completed: "Interview completed",
  interview_feedback: "Interview feedback updated",
  note_added: "Note added",
  resume_downloaded: "Resume accessed",
  email_sent: "Email sent",
  email_failed: "Email not sent",
  anonymized: "Personal data erased",
};

const statusEventLabel = (to) =>
  ({ selected: "Candidate selected", rejected: "Candidate rejected", hired: "Candidate hired", shortlisted: "Candidate shortlisted", withdrawn: "Application withdrawn" })[to] ||
  "Status changed";

function Info({ label, value }) {
  return (
    <div>
      <div className="adm-label">{label}</div>
      <div style={{ wordBreak: "break-word" }}>{value === null || value === undefined || value === "" ? <span className="col-muted">—</span> : value}</div>
    </div>
  );
}

const card = { padding: 20 };
const grid2 = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 };

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const [a, setA] = useState(null);
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const [notify, setNotify] = useState(true);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [ivModal, setIvModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, showToast] = useToast();

  const load = useCallback(async () => {
    try {
      const d = await api(`/api/admin/careers/applications/${id}`);
      setA(d);
      setStatus(d.status);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    load();
    fetch("/api/admin/auth/me").then((r) => r.json()).then((d) => d.success && setMe(d.user)).catch(() => {});
  }, [load]);

  const resume = async (inline) => {
    setBusy(inline ? "view" : "download");
    try {
      const { url } = await api(`/api/admin/careers/applications/${id}/resume${inline ? "?inline=1" : ""}`);
      if (inline) window.open(url, "_blank", "noopener,noreferrer");
      else window.location.href = url;
      load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setBusy("");
    }
  };

  const saveStatus = async () => {
    setBusy("status");
    try {
      const r = await api(`/api/admin/careers/applications/${id}`, "POST", { action: "status", status, remarks, notify: notify && NOTIFY_STATUSES.includes(status) });
      showToast(`Status updated to “${APPLICATION_STATUSES[r.status]}”.${r.emailQueued ? " Candidate is being emailed." : ""}`);
      setRemarks("");
      setConfirm(null);
      load();
    } catch (e) {
      showToast(e.message, "error");
      setConfirm(null);
    } finally {
      setBusy("");
    }
  };

  const addNote = async () => {
    setBusy("note");
    try {
      await api(`/api/admin/careers/applications/${id}`, "POST", { action: "note", note });
      setNote("");
      showToast("Note added.");
      load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setBusy("");
    }
  };

  const erase = async () => {
    setBusy("erase");
    try {
      await api(`/api/admin/careers/applications/${id}`, "POST", { action: "anonymize", reason: "Erased by admin on request." });
      showToast("Candidate personal data and resume erased.");
      setConfirm(null);
      load();
    } catch (e) {
      showToast(e.message, "error");
      setConfirm(null);
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return (
      <div>
        <CareersNav />
        <div className="adm-card" style={{ padding: 40, textAlign: "center" }}><Loader2 className="adm-spin" /> Loading application…</div>
      </div>
    );
  }
  if (!a) {
    return (
      <div>
        <CareersNav />
        <div className="adm-card" style={{ padding: 40, textAlign: "center" }}>
          Application not found. <Link href="/admin/careers/applications">Back to applications</Link>
        </div>
        <Toast toast={toast} />
      </div>
    );
  }

  const erased = Boolean(a.anonymized_at);
  const nextRound = a.interviews.reduce((m, i) => Math.max(m, i.round_no), 0) + 1;
  const canSchedule = !erased && !["rejected", "hired", "withdrawn"].includes(a.status);
  const statusChanged = status !== a.status;
  const confirmNeeded = ["rejected", "hired", "withdrawn", "selected"].includes(status);

  return (
    <div>
      <CareersNav />
      <Link href="/admin/careers/applications" className="adm-btn adm-btn-ghost adm-btn-sm" style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> All applications
      </Link>
      <PageHead
        eyebrow={a.application_code}
        title={a.full_name}
        subtitle={
          <>
            Applied for <Link href={`/admin/careers/jobs/${a.job_id}`}>{a.job_title}</Link> ({a.job_code}) on {fmtDT(a.created_at)}
          </>
        }
      />
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
        <AppStatusBadge status={a.status} />
        {a.job_status !== "published" && <Badge tone="off">Job {a.job_status}</Badge>}
        {erased && <Badge tone="warn">Personal data erased {fmtDT(a.anonymized_at)}</Badge>}
        {!erased && (
          <>
            <a className="adm-btn adm-btn-sm" href={`tel:${a.mobile}`}><Phone size={14} /> Call</a>
            <a className="adm-btn adm-btn-sm" href={`mailto:${a.email}?subject=${encodeURIComponent(`${a.job_title} — ${a.application_code}`)}`}><Mail size={14} /> Email</a>
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 18 }} className="cr-detail">
        <style>{`@media (min-width: 1100px){ .cr-detail{ grid-template-columns: minmax(0,1fr) 360px !important; } }`}</style>

        <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
          <section className="adm-card" style={card}>
            <SectionTitle>Personal information</SectionTitle>
            <div style={grid2}>
              <Info label="Full name" value={a.full_name} />
              <Info label="Mobile" value={erased ? null : a.mobile} />
              <Info label="Email" value={erased ? null : a.email} />
              <Info label="Current city" value={a.current_city} />
            </div>
          </section>

          <section className="adm-card" style={card}>
            <SectionTitle>Professional information</SectionTitle>
            <div style={grid2}>
              <Info label="Total experience" value={`${Number(a.total_experience)} years`} />
              <Info label="Current company" value={a.current_company} />
              <Info label="Current salary" value={a.current_salary} />
              <Info label="Expected salary" value={a.expected_salary} />
              <Info label="Notice period" value={a.notice_period} />
            </div>
          </section>

          <section className="adm-card" style={card}>
            <SectionTitle>Application information</SectionTitle>
            <div style={grid2}>
              <Info label="Application ID" value={<span style={{ fontFamily: "var(--adm-mono)" }}>{a.application_code}</span>} />
              <Info label="Applied job" value={<Link href={`/admin/careers/jobs/${a.job_id}`}>{a.job_title}</Link>} />
              <Info label="Department" value={a.job_department} />
              <Info label="Applied date" value={fmtDT(a.created_at)} />
              <Info label="Current status" value={<AppStatusBadge status={a.status} />} />
              <Info label="Last status change" value={fmtDT(a.status_changed_at)} />
            </div>
          </section>

          <section className="adm-card" style={card}>
            <SectionTitle>Resume / CV</SectionTitle>
            {a.has_resume ? (
              <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ width: 46, height: 46, borderRadius: 12, background: "var(--adm-brand-soft)", color: "var(--adm-brand)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <FileText size={22} />
                </span>
                <div style={{ flex: 1, minWidth: 180 }}>
                  <b style={{ display: "block", wordBreak: "break-all" }}>{a.resume_original_name}</b>
                  <span className="col-muted" style={{ fontSize: 13 }}>{a.resume_ext} · {formatBytes(a.resume_size)}</span>
                </div>
                {a.resume_ext === "PDF" && (
                  <Button onClick={() => resume(true)} disabled={!!busy}>
                    {busy === "view" ? <Loader2 size={15} className="adm-spin" /> : <Eye size={15} />} View
                  </Button>
                )}
                <Button variant="primary" onClick={() => resume(false)} disabled={!!busy}>
                  {busy === "download" ? <Loader2 size={15} className="adm-spin" /> : <Download size={15} />} Download Resume
                </Button>
              </div>
            ) : (
              <p className="col-muted">{erased ? "Resume deleted with the candidate's personal data." : "No resume on file."}</p>
            )}
            <FieldNote>Links are private and expire after 5 minutes. Every access is logged.</FieldNote>
          </section>

          <section className="adm-card" style={card}>
            <SectionTitle>Cover letter</SectionTitle>
            {a.cover_letter ? <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.65 }}>{a.cover_letter}</p> : <p className="col-muted">No cover letter provided.</p>}
          </section>

          <section className="adm-card" style={card}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <SectionTitle>Interviews</SectionTitle>
              <span style={{ flex: 1 }} />
              {canSchedule && (
                <Button size="sm" variant="primary" onClick={() => setIvModal({ mode: "schedule" })}>
                  <CalendarPlus size={14} /> Schedule interview
                </Button>
              )}
            </div>
            {a.interviews.length === 0 ? (
              <p className="col-muted">No interviews scheduled yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {a.interviews.map((iv) => {
                  const live = iv.status === "scheduled" || iv.status === "rescheduled";
                  return (
                    <div key={iv.id} style={{ border: "1px solid var(--adm-border)", borderRadius: 12, padding: 14, opacity: iv.status === "cancelled" ? 0.65 : 1 }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <b>Round {iv.round_no}{iv.round_name ? ` · ${iv.round_name}` : ""}</b>
                        <Badge tone={iv.status === "completed" ? "ok" : iv.status === "cancelled" ? "off" : "info"}>{INTERVIEW_STATUSES[iv.status]}</Badge>
                        <Badge tone={iv.result === "pass" ? "ok" : iv.result === "fail" ? "off" : "warn"}>{INTERVIEW_RESULTS[iv.result]}</Badge>
                      </div>
                      <p style={{ margin: "6px 0 0", fontSize: 13.5 }}>
                        <CalendarClock size={13} style={{ verticalAlign: "-2px" }} /> {fmtDT(iv.scheduled_at)} · {iv.duration_minutes} min · {INTERVIEW_MODES[iv.mode]}
                        {iv.interviewer_name ? ` · ${iv.interviewer_name}` : ""}
                      </p>
                      {iv.mode === "online" && iv.meeting_link && (
                        <a href={iv.meeting_link} target="_blank" rel="noreferrer" style={{ fontSize: 13, wordBreak: "break-all" }}>{iv.meeting_link}</a>
                      )}
                      {iv.mode === "offline" && iv.location && <p className="col-muted" style={{ fontSize: 13, margin: 0 }}>{iv.location}</p>}
                      {iv.cancel_reason && <p className="col-muted" style={{ fontSize: 13, margin: "4px 0 0" }}>Cancelled: {iv.cancel_reason}</p>}
                      {iv.feedback && (
                        <div className="adm-note-box" style={{ marginTop: 8, whiteSpace: "pre-wrap", fontSize: 13.5 }}>
                          <b>Feedback:</b> {iv.feedback}
                        </div>
                      )}
                      {!erased && iv.status !== "cancelled" && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                          <Button size="sm" onClick={() => setIvModal({ mode: "feedback", interview: iv })}><MessageSquareText size={14} /> Feedback / result</Button>
                          {live && <Button size="sm" onClick={() => setIvModal({ mode: "reschedule", interview: iv })}><CalendarClock size={14} /> Reschedule</Button>}
                          {live && <Button size="sm" variant="ghost" onClick={() => setIvModal({ mode: "cancel", interview: iv })} style={{ color: "#c2253d" }}><XCircle size={14} /> Cancel</Button>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div style={{ display: "grid", gap: 18, alignContent: "start" }}>
          <section className="adm-card" style={card}>
            <SectionTitle>Update status</SectionTitle>
            {erased ? (
              <p className="col-muted">Status is locked after personal data is erased.</p>
            ) : (
              <div style={{ display: "grid", gap: 12 }}>
                <Field label="New status">
                  <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                    {Object.entries(APPLICATION_STATUSES).map(([k, v]) => <option key={k} value={k}>{v}{k === a.status ? " (current)" : ""}</option>)}
                  </Select>
                </Field>
                <Field label="Remarks (optional, internal)">
                  <Textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} maxLength={1000} />
                </Field>
                {NOTIFY_STATUSES.includes(status) && statusChanged && (
                  a.can_email_status ? (
                    <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
                      <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} /> Email the candidate about this update
                    </label>
                  ) : (
                    <FieldNote>Candidate status emails are turned off in Career Settings.</FieldNote>
                  )
                )}
                <Button
                  variant="primary"
                  disabled={!statusChanged || !!busy}
                  onClick={() =>
                    confirmNeeded
                      ? setConfirm({ kind: "status", title: `Mark as “${APPLICATION_STATUSES[status]}”?`, message: `${a.full_name} will move from “${APPLICATION_STATUSES[a.status]}” to “${APPLICATION_STATUSES[status]}”. This is recorded in the status history.` })
                      : saveStatus()
                  }
                >
                  {busy === "status" && <Loader2 size={15} className="adm-spin" />} Update status
                </Button>
              </div>
            )}
          </section>

          <section className="adm-card" style={card}>
            <SectionTitle><StickyNote size={14} style={{ verticalAlign: "-2px" }} /> Internal notes</SectionTitle>
            {!erased && (
              <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Visible to admins only" maxLength={5000} />
                <Button onClick={addNote} disabled={note.trim().length < 2 || !!busy}>{busy === "note" && <Loader2 size={15} className="adm-spin" />} Add note</Button>
              </div>
            )}
            {a.notes.length === 0 ? (
              <p className="col-muted" style={{ fontSize: 13.5 }}>No notes yet.</p>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {a.notes.map((n) => (
                  <div key={n.id} style={{ borderLeft: "3px solid var(--adm-brand-soft)", paddingLeft: 10 }}>
                    <p style={{ whiteSpace: "pre-wrap", margin: 0, fontSize: 14 }}>{n.note}</p>
                    <span className="col-muted" style={{ fontSize: 12 }}>{n.admin_name || "Admin"} · {fmtDT(n.created_at)}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="adm-card" style={card}>
            <SectionTitle><History size={14} style={{ verticalAlign: "-2px" }} /> Activity & status history</SectionTitle>
            <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12 }}>
              {a.logs.map((l) => (
                <li key={l.id} style={{ display: "grid", gridTemplateColumns: "10px 1fr", gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: 10, marginTop: 5, background: l.event === "email_failed" ? "#e2314b" : l.event === "status_changed" ? "var(--adm-brand)" : "#c9bdf0" }} />
                  <div>
                    <b style={{ fontSize: 13.5 }}>{l.event === "status_changed" ? statusEventLabel(l.to_status) : EVENT_LABEL[l.event] || l.event}</b>
                    {l.event === "status_changed" && (
                      <span style={{ display: "block", fontSize: 13 }}>
                        {APPLICATION_STATUSES[l.from_status] || l.from_status} → <b>{APPLICATION_STATUSES[l.to_status] || l.to_status}</b>
                      </span>
                    )}
                    {l.remarks && <span style={{ display: "block", fontSize: 13, whiteSpace: "pre-wrap" }}>{l.remarks}</span>}
                    <span className="col-muted" style={{ fontSize: 12 }}>{l.admin_name || (l.event === "submitted" ? "Candidate" : "System")} · {fmtDT(l.created_at)}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {me?.role === "super_admin" && !erased && (
            <section className="adm-card" style={{ ...card, borderColor: "#f3c7cf" }}>
              <SectionTitle><ShieldAlert size={14} style={{ verticalAlign: "-2px" }} /> Data privacy</SectionTitle>
              <p className="col-muted" style={{ fontSize: 13.5, marginBottom: 10 }}>
                Erase the candidate&apos;s personal data, notes and resume file (e.g. on the candidate&apos;s request). The anonymised record stays for statistics. This cannot be undone.
              </p>
              <Button variant="danger" onClick={() => setConfirm({ kind: "erase", title: "Erase candidate data?", message: `All personal details, notes, interview feedback and the resume of ${a.full_name} will be permanently deleted.` })}>
                Erase personal data
              </Button>
            </section>
          )}
        </div>
      </div>

      {ivModal && (
        <InterviewModal
          mode={ivModal.mode}
          applicationId={a.id}
          interview={ivModal.interview}
          nextRound={nextRound}
          canEmail={a.can_email_interview}
          onClose={() => setIvModal(null)}
          onDone={(msg) => (setIvModal(null), showToast(msg), load())}
        />
      )}
      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          tone={confirm.kind === "erase" || status === "rejected" ? "danger" : undefined}
          confirmLabel={confirm.kind === "erase" ? "Yes, erase" : "Yes, update"}
          saving={!!busy}
          onCancel={() => setConfirm(null)}
          onConfirm={confirm.kind === "erase" ? erase : saveStatus}
        />
      )}
      <Toast toast={toast} />
    </div>
  );
}
