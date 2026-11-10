"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, MessageSquareText, XCircle, Video, MapPin } from "lucide-react";
import { PageHead, Button, Badge, TableState, Toast } from "@/app/(admin)/admin/components/AdminUI";
import { api, useToast, CareersNav, AppStatusBadge, fmtDT } from "../_shared";
import InterviewModal from "../InterviewModal";
import { INTERVIEW_STATUSES, INTERVIEW_RESULTS, INTERVIEW_MODES } from "@/lib/careers/constants";

const SCOPES = [
  ["upcoming", "Upcoming"],
  ["past", "Past / completed"],
  ["cancelled", "Cancelled"],
  ["all", "All"],
];

const dayKey = (d) => new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
const dayLabel = (d) => new Date(d).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
const timeLabel = (d) => new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });

export default function CareerInterviewsPage() {
  const [scope, setScope] = useState("upcoming");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [toast, showToast] = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRows((await api(`/api/admin/careers/interviews?scope=${scope}`)).rows);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [scope, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  // Agenda: group by IST day.
  const groups = [];
  for (const r of rows) {
    const k = dayKey(r.scheduled_at);
    if (!groups.length || groups[groups.length - 1].k !== k) groups.push({ k, label: dayLabel(r.scheduled_at), items: [] });
    groups[groups.length - 1].items.push(r);
  }
  const todayKey = dayKey(new Date());

  return (
    <div>
      <CareersNav />
      <PageHead eyebrow="Careers" title="Interviews" subtitle="Interview schedule across all applications. Schedule new rounds from a candidate's profile." count={scope === "upcoming" ? rows.length : undefined} countLabel="upcoming" />

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
        {SCOPES.map(([k, v]) => (
          <button key={k} type="button" className={`adm-tab ${scope === k ? "on" : ""}`} onClick={() => setScope(k)}>{v}</button>
        ))}
      </div>

      {loading || rows.length === 0 ? (
        <div className="adm-tablecard">
          <table className="adm-table"><tbody><TableState colSpan={1} loading={loading} emptyTitle="No interviews" emptyHint={scope === "upcoming" ? "Nothing scheduled. Open an application to schedule an interview." : "Nothing to show here."} /></tbody></table>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 18 }}>
          {groups.map((g) => (
            <section key={g.k} className="adm-card" style={{ padding: 18 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 10px", display: "flex", alignItems: "center", gap: 8 }}>
                <CalendarClock size={16} style={{ color: "var(--adm-brand)" }} /> {g.label}
                {g.k === todayKey && <Badge tone="warn">Today</Badge>}
              </h2>
              <div style={{ display: "grid", gap: 10 }}>
                {g.items.map((iv) => {
                  const live = iv.status === "scheduled" || iv.status === "rescheduled";
                  return (
                    <div key={iv.id} style={{ display: "grid", gridTemplateColumns: "84px minmax(0,1fr)", gap: 12, borderTop: "1px solid var(--adm-border)", paddingTop: 10 }}>
                      <div style={{ fontFamily: "var(--adm-mono)", fontWeight: 700 }}>
                        {timeLabel(iv.scheduled_at)}
                        <span className="col-muted" style={{ display: "block", fontSize: 11.5, fontFamily: "inherit", fontWeight: 400 }}>{iv.duration_minutes} min</span>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                          <Link href={`/admin/careers/applications/${iv.application_id}`} style={{ fontWeight: 700 }}>{iv.full_name}</Link>
                          <span className="col-muted" style={{ fontSize: 12.5, fontFamily: "var(--adm-mono)" }}>{iv.application_code}</span>
                          <AppStatusBadge status={iv.application_status} />
                          <Badge tone={iv.status === "completed" ? "ok" : iv.status === "cancelled" ? "off" : "info"}>{INTERVIEW_STATUSES[iv.status]}</Badge>
                          {iv.result !== "pending" && <Badge tone={iv.result === "pass" ? "ok" : "off"}>{INTERVIEW_RESULTS[iv.result]}</Badge>}
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: 13.5 }}>
                          {iv.job_title} · Round {iv.round_no}{iv.round_name ? ` (${iv.round_name})` : ""}
                          {iv.interviewer_name ? ` · with ${iv.interviewer_name}` : ""}
                        </p>
                        <p className="col-muted" style={{ margin: "2px 0 0", fontSize: 13, wordBreak: "break-all" }}>
                          {iv.mode === "online" ? <Video size={13} style={{ verticalAlign: "-2px" }} /> : <MapPin size={13} style={{ verticalAlign: "-2px" }} />}{" "}
                          {INTERVIEW_MODES[iv.mode]}
                          {iv.mode === "online" && iv.meeting_link && (
                            <> · <a href={iv.meeting_link} target="_blank" rel="noreferrer">{iv.meeting_link}</a></>
                          )}
                          {iv.mode === "offline" && iv.location ? ` · ${iv.location}` : ""}
                        </p>
                        {iv.status !== "cancelled" && (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                            <Button size="sm" onClick={() => setModal({ mode: "feedback", interview: iv })}><MessageSquareText size={14} /> Feedback / result</Button>
                            {live && <Button size="sm" onClick={() => setModal({ mode: "reschedule", interview: iv })}><CalendarClock size={14} /> Reschedule</Button>}
                            {live && <Button size="sm" variant="ghost" style={{ color: "#c2253d" }} onClick={() => setModal({ mode: "cancel", interview: iv })}><XCircle size={14} /> Cancel</Button>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {modal && (
        <InterviewModal
          mode={modal.mode}
          interview={modal.interview}
          onClose={() => setModal(null)}
          onDone={(msg) => (setModal(null), showToast(msg), load())}
        />
      )}
      <Toast toast={toast} />
    </div>
  );
}
