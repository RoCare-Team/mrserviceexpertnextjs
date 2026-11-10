"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, CheckCircle2, AlertTriangle } from "lucide-react";
import { PageHead, Field, Input, Textarea, Button, FieldNote, SectionTitle, FormCard, Toast } from "@/app/(admin)/admin/components/AdminUI";
import { api, useToast, CareersNav } from "../_shared";

function Toggle({ label, hint, checked, onChange }) {
  return (
    <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 0" }}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} style={{ marginTop: 4 }} />
      <span>
        <b style={{ fontWeight: 600 }}>{label}</b>
        {hint && <span className="col-muted" style={{ display: "block", fontSize: 12.5 }}>{hint}</span>}
      </span>
    </label>
  );
}

function Health({ ok, label, fix }) {
  return (
    <p style={{ display: "flex", gap: 8, alignItems: "flex-start", margin: "4px 0", fontSize: 14 }}>
      {ok ? <CheckCircle2 size={17} style={{ color: "var(--adm-ok)", flexShrink: 0 }} /> : <AlertTriangle size={17} style={{ color: "#b45309", flexShrink: 0 }} />}
      <span>
        {label}
        {!ok && fix && <span className="col-muted" style={{ display: "block", fontSize: 12.5 }}>{fix}</span>}
      </span>
    </p>
  );
}

export default function CareerSettingsPage() {
  const [s, setS] = useState(null);
  const [health, setHealth] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, showToast] = useToast();

  useEffect(() => {
    api("/api/admin/careers/settings")
      .then((d) => (setS(d.settings), setHealth({ mail: d.mailConfigured, storage: d.storageConfigured })))
      .catch((e) => showToast(e.message, "error"));
  }, [showToast]);

  const set = (k) => (v) => {
    setS((x) => ({ ...x, [k]: v?.target ? v.target.value : v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const d = await api("/api/admin/careers/settings", "PUT", s);
      setS(d.settings);
      showToast("Career settings saved.");
    } catch (e) {
      if (e.fields) setErrors(e.fields);
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (!s) {
    return (
      <div>
        <CareersNav />
        <div className="adm-card" style={{ padding: 40, textAlign: "center" }}><Loader2 className="adm-spin" /> Loading settings…</div>
        <Toast toast={toast} />
      </div>
    );
  }
  const err = (k) => errors[k] && <FieldNote tone="err">{errors[k]}</FieldNote>;

  return (
    <div style={{ paddingBottom: 80 }}>
      <CareersNav />
      <PageHead eyebrow="Careers" title="Career settings" subtitle="Careers page content, notifications, job expiry and application form options." />

      <div style={{ display: "grid", gap: 18 }}>
        <FormCard>
          <SectionTitle>System status</SectionTitle>
          <Health ok={health.storage} label="Resume storage (AWS S3)" fix="Set AWS_S3_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY on the server." />
          <Health ok={health.mail} label="Email delivery (SMTP)" fix="Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS and MAIL_FROM on the server. Until then applications are saved but no emails are sent." />
        </FormCard>

        <FormCard>
          <SectionTitle>Public careers page</SectionTitle>
          <Toggle label="Show the careers page on the website" hint="Off → /careers and every job page return “not found” and leave the sitemap." checked={s.careers_page_visible} onChange={set("careers_page_visible")} />
          <div className="adm-formgrid" style={{ marginTop: 8 }}>
            <Field label="Page heading" className="full">
              <Input value={s.careers_page_title} onChange={set("careers_page_title")} maxLength={120} />
              {err("careers_page_title")}
            </Field>
            <Field label="Careers page introduction" className="full">
              <Textarea rows={4} value={s.careers_page_intro} onChange={set("careers_page_intro")} maxLength={1500} />
              {err("careers_page_intro")}
            </Field>
          </div>
        </FormCard>

        <FormCard>
          <SectionTitle>Recruitment contact & notifications</SectionTitle>
          <div className="adm-formgrid">
            <Field label="Recruitment contact email(s)" className="full">
              <Input value={s.recruitment_email} onChange={set("recruitment_email")} placeholder="hr@mrserviceexpert.com, careers@…" />
              {errors.recruitment_email ? err("recruitment_email") : <FieldNote>New-application alerts go here. Comma-separate several addresses.</FieldNote>}
            </Field>
            <Field label="Default application confirmation message" className="full">
              <Textarea rows={3} value={s.application_confirmation_message} onChange={set("application_confirmation_message")} maxLength={1000} />
              {errors.application_confirmation_message ? err("application_confirmation_message") : <FieldNote>Shown after submitting and included in the candidate&apos;s confirmation email.</FieldNote>}
            </Field>
          </div>
          <Toggle label="Email admins when a new application arrives" checked={s.notify_admin_new_application} onChange={set("notify_admin_new_application")} />
          <Toggle label="Send candidates an application confirmation email" checked={s.notify_candidate_confirmation} onChange={set("notify_candidate_confirmation")} />
          <Toggle label="Allow status emails (shortlisted / selected / rejected)" hint="Admins still choose per update whether to send it." checked={s.notify_candidate_status} onChange={set("notify_candidate_status")} />
          <Toggle label="Allow interview emails (invite / reschedule / cancel)" checked={s.notify_candidate_interview} onChange={set("notify_candidate_interview")} />
        </FormCard>

        <FormCard>
          <SectionTitle>Job expiry</SectionTitle>
          <div className="adm-formgrid">
            <Field label="Default expiry (days after publishing)">
              <Input type="number" min="0" max="365" value={s.default_expiry_days} onChange={set("default_expiry_days")} />
              {errors.default_expiry_days ? err("default_expiry_days") : <FieldNote>Used when a job is published with no deadline and no expiry date. 0 = never expires.</FieldNote>}
            </Field>
          </div>
        </FormCard>

        <FormCard>
          <SectionTitle>Application form</SectionTitle>
          <Toggle label="Ask for current & expected salary" checked={s.show_salary_fields} onChange={set("show_salary_fields")} />
          <Toggle label="Make the cover letter required" checked={s.require_cover_letter} onChange={set("require_cover_letter")} />
          <Toggle label="Allow re-applying to the same job after rejection" hint="Duplicate applications (same email or mobile for the same job) are otherwise blocked." checked={s.allow_reapply_after_rejection} onChange={set("allow_reapply_after_rejection")} />
        </FormCard>

        <FormCard>
          <SectionTitle>Candidate data retention</SectionTitle>
          <div className="adm-formgrid">
            <Field label="Erase rejected / withdrawn candidates after (months)">
              <Input type="number" min="0" max="120" value={s.retention_months} onChange={set("retention_months")} />
              {errors.retention_months ? err("retention_months") : <FieldNote>Personal data and resumes are erased by the careers cron; anonymised counts stay in reports. 0 = keep.</FieldNote>}
            </Field>
          </div>
        </FormCard>
      </div>

      <div className="adm-card" style={{ position: "sticky", bottom: 12, marginTop: 18, padding: 12, display: "flex", justifyContent: "flex-end", zIndex: 5 }}>
        <Button variant="primary" onClick={save} disabled={saving}>
          {saving ? <Loader2 size={16} className="adm-spin" /> : <Save size={16} />} Save settings
        </Button>
      </div>
      <Toast toast={toast} />
    </div>
  );
}
