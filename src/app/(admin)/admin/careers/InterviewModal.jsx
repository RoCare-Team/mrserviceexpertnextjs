"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal, Field, Input, Select, Textarea, Button, FieldNote } from "@/app/(admin)/admin/components/AdminUI";
import { api } from "./_shared";
import { INTERVIEW_RESULTS } from "@/lib/careers/constants";

const istParts = (d) => {
  if (!d) return { date: "", time: "" };
  const s = new Date(d).toLocaleString("sv-SE", { timeZone: "Asia/Kolkata" });
  return { date: s.slice(0, 10), time: s.slice(11, 16) };
};

/**
 * mode: schedule | reschedule | cancel | feedback
 * schedule needs applicationId (+ nextRound); the others need interview.
 */
export default function InterviewModal({ mode, applicationId, interview, nextRound = 1, canEmail = true, onClose, onDone }) {
  const when = istParts(interview?.scheduled_at);
  const [f, setF] = useState({
    round_no: interview?.round_no || nextRound,
    round_name: interview?.round_name || "",
    date: when.date,
    time: when.time || "11:00",
    duration_minutes: interview?.duration_minutes || 30,
    mode: interview?.mode || "online",
    meeting_link: interview?.meeting_link || "",
    location: interview?.location || "",
    interviewer_name: interview?.interviewer_name || "",
    feedback: interview?.feedback || "",
    result: interview?.result || "pending",
    reason: "",
    remarks: "",
    notify: canEmail,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const submit = async () => {
    setSaving(true);
    setErrors({});
    setError("");
    try {
      let r;
      if (mode === "schedule") r = await api("/api/admin/careers/interviews", "POST", { ...f, applicationId });
      else if (mode === "reschedule") r = await api(`/api/admin/careers/interviews/${interview.id}`, "POST", { ...f, action: "reschedule" });
      else if (mode === "cancel") r = await api(`/api/admin/careers/interviews/${interview.id}`, "POST", { action: "cancel", reason: f.reason, notify: f.notify });
      else r = await api(`/api/admin/careers/interviews/${interview.id}`, "POST", { action: "feedback", feedback: f.feedback, result: f.result });
      const msg =
        mode === "schedule"
          ? `Interview scheduled${r.statusChanged ? " — status set to Interview Scheduled" : ""}.`
          : mode === "reschedule"
          ? "Interview rescheduled."
          : mode === "cancel"
          ? "Interview cancelled."
          : "Interview feedback saved.";
      onDone(msg + (r.emailQueued ? " Candidate is being emailed." : ""));
    } catch (e) {
      if (e.fields) setErrors(e.fields);
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const title = { schedule: "Schedule interview", reschedule: "Reschedule interview", cancel: "Cancel interview", feedback: "Interview feedback & result" }[mode];
  const err = (k) => errors[k] && <FieldNote tone="err">{errors[k]}</FieldNote>;
  const showWhen = mode === "schedule" || mode === "reschedule";

  return (
    <Modal
      title={title}
      id={interview ? `Round ${interview.round_no}` : undefined}
      onClose={() => !saving && onClose()}
      footer={
        <>
          <Button onClick={onClose} disabled={saving}>Close</Button>
          <Button variant={mode === "cancel" ? "danger" : "primary"} onClick={submit} disabled={saving}>
            {saving && <Loader2 size={15} className="adm-spin" />}
            {mode === "cancel" ? "Cancel interview" : mode === "feedback" ? "Save feedback" : mode === "reschedule" ? "Reschedule" : "Schedule"}
          </Button>
        </>
      }
    >
      <div style={{ display: "grid", gap: 14 }}>
        {showWhen && (
          <div className="adm-formgrid">
            {mode === "schedule" && (
              <Field label="Interview round">
                <Input type="number" min="1" max="20" value={f.round_no} onChange={set("round_no")} />
              </Field>
            )}
            <Field label="Round name (optional)">
              <Input value={f.round_name} onChange={set("round_name")} maxLength={80} placeholder="e.g. HR round, Technical round" />
            </Field>
            <Field label="Date *">
              <Input type="date" value={f.date} onChange={set("date")} />
              {err("date")}
            </Field>
            <Field label="Time (IST) *">
              <Input type="time" value={f.time} onChange={set("time")} />
            </Field>
            <Field label="Duration (minutes)">
              <Input type="number" min="5" max="480" value={f.duration_minutes} onChange={set("duration_minutes")} />
              {err("duration_minutes")}
            </Field>
            <Field label="Mode">
              <Select value={f.mode} onChange={set("mode")}>
                <option value="online">Online</option>
                <option value="offline">Offline</option>
              </Select>
            </Field>
            {f.mode === "online" ? (
              <Field label="Meeting link" className="full">
                <Input value={f.meeting_link} onChange={set("meeting_link")} placeholder="https://meet.google.com/…" maxLength={500} />
                {err("meeting_link")}
              </Field>
            ) : (
              <Field label="Interview location *" className="full">
                <Input value={f.location} onChange={set("location")} maxLength={300} placeholder="Office address" />
                {err("location")}
              </Field>
            )}
            <Field label="Interviewer name" className="full">
              <Input value={f.interviewer_name} onChange={set("interviewer_name")} maxLength={120} />
            </Field>
            {mode === "reschedule" && (
              <Field label="Reason (internal, optional)" className="full">
                <Input value={f.remarks} onChange={set("remarks")} maxLength={300} />
              </Field>
            )}
          </div>
        )}
        {mode === "cancel" && (
          <Field label="Reason (internal, optional)">
            <Textarea rows={2} value={f.reason} onChange={set("reason")} maxLength={300} />
          </Field>
        )}
        {mode === "feedback" && (
          <>
            <Field label="Result">
              <Select value={f.result} onChange={set("result")}>
                {Object.entries(INTERVIEW_RESULTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
              <FieldNote>Pass / Fail marks the round as completed.</FieldNote>
            </Field>
            <Field label="Feedback (internal — never shown to the candidate)">
              <Textarea rows={5} value={f.feedback} onChange={set("feedback")} maxLength={5000} />
            </Field>
          </>
        )}
        {mode !== "feedback" && canEmail && (
          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={f.notify} onChange={set("notify")} /> Email the candidate
            {mode === "cancel" ? " about the cancellation" : " the interview details"}
          </label>
        )}
        {error && <FieldNote tone="err">{error}</FieldNote>}
      </div>
    </Modal>
  );
}
