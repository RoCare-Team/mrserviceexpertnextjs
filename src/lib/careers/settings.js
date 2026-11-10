// Career settings — key/value rows in career_settings, with typed defaults
// so a missing row (or a missing table before the migration) never breaks
// the public page.

import db from "@/lib/db";
import { HttpError } from "@/lib/careers/http";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// type: bool | int | text | email
export const SETTING_DEFS = {
  recruitment_email: { type: "email", def: "" },
  careers_page_visible: { type: "bool", def: true },
  careers_page_title: { type: "text", def: "Careers at Mr. Service Expert", max: 120 },
  careers_page_intro: {
    type: "text",
    max: 1500,
    def: "Join a fast-growing home services company. We are looking for talented, customer-focused people who want to build their careers with us.",
  },
  application_confirmation_message: {
    type: "text",
    max: 1000,
    def: "Thank you for your interest in joining Mr. Service Expert. Our recruitment team will review your application and contact you if your profile matches our requirements.",
  },
  notify_admin_new_application: { type: "bool", def: true },
  notify_candidate_confirmation: { type: "bool", def: true },
  notify_candidate_status: { type: "bool", def: true },
  notify_candidate_interview: { type: "bool", def: true },
  default_expiry_days: { type: "int", def: 30, min: 0, max: 365 },
  require_cover_letter: { type: "bool", def: false },
  show_salary_fields: { type: "bool", def: true },
  allow_reapply_after_rejection: { type: "bool", def: false },
  retention_months: { type: "int", def: 0, min: 0, max: 120 },
};

function parse(def, raw) {
  if (raw === null || raw === undefined) return def.def;
  if (def.type === "bool") return raw === "1" || raw === "true";
  if (def.type === "int") {
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : def.def;
  }
  return String(raw);
}

export async function getSettings() {
  const out = Object.fromEntries(Object.entries(SETTING_DEFS).map(([k, d]) => [k, d.def]));
  try {
    const [rows] = await db.query("SELECT setting_key, setting_value FROM career_settings");
    for (const r of rows) if (SETTING_DEFS[r.setting_key]) out[r.setting_key] = parse(SETTING_DEFS[r.setting_key], r.setting_value);
  } catch (err) {
    if (err?.code !== "ER_NO_SUCH_TABLE") throw err;
  }
  return out;
}

/** Validates a partial update; returns { key: storedString }. */
export function validateSettings(body) {
  const out = {};
  const fields = {};
  for (const [k, def] of Object.entries(SETTING_DEFS)) {
    if (!(k in body)) continue;
    const v = body[k];
    if (def.type === "bool") out[k] = v === true || v === "1" || v === 1 ? "1" : "0";
    else if (def.type === "int") {
      const n = Number(v);
      if (!Number.isInteger(n) || n < def.min || n > def.max) fields[k] = `Enter a whole number between ${def.min} and ${def.max}.`;
      else out[k] = String(n);
    } else if (def.type === "email") {
      const s = String(v || "").trim().toLowerCase();
      // Allow several comma-separated recipients.
      const list = s ? s.split(/\s*,\s*/).filter(Boolean) : [];
      if (list.some((e) => !EMAIL_RE.test(e) || e.length > 190)) fields[k] = "Enter valid email address(es), comma separated.";
      else out[k] = list.join(", ");
    } else {
      const s = String(v ?? "").trim();
      if (s.length > def.max) fields[k] = `Keep this under ${def.max} characters.`;
      else out[k] = s;
    }
  }
  if (Object.keys(fields).length) throw new HttpError(422, "validation", "Please fix the highlighted settings.", fields);
  return out;
}

export async function saveSettings(values, adminId) {
  const entries = Object.entries(values);
  if (!entries.length) return;
  await db.query(
    `INSERT INTO career_settings (setting_key, setting_value, updated_by) VALUES ${entries.map(() => "(?, ?, ?)").join(", ")}
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
    entries.flatMap(([k, v]) => [k, v, adminId || null])
  );
}
