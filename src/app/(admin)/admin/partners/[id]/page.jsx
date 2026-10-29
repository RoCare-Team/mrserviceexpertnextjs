"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BadgeCheck, Eye, ExternalLink, FileText, Loader2 } from "lucide-react";
import {
  PageHead,
  Field,
  Textarea,
  Button,
  Badge,
  Dash,
  Modal,
  ConfirmDialog,
  Toast,
  ReadOnly,
  SectionTitle,
  FormCard,
} from "@/app/(admin)/admin/components/AdminUI";
import { STATUS_META } from "../statusMeta";
import { BUSINESS_TYPES, CONTACT_PREFERENCES, DOC_TYPES } from "@/lib/partners/validation";

const fmt = (d) =>
  d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

// action → which statuses offer it, and whether a reason is mandatory.
const ACTIONS = [
  { key: "approve", label: "Approve", from: ["pending"], variant: "primary", publish: true },
  { key: "request_info", label: "Request more info", from: ["pending"], reason: true },
  { key: "reject", label: "Reject", from: ["pending", "info_requested"], variant: "danger", reason: true },
  { key: "suspend", label: "Suspend", from: ["approved"], variant: "danger", reason: true },
  { key: "reactivate", label: "Reactivate", from: ["suspended"], variant: "primary", publish: true },
];

async function call(url, method = "GET", body) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  if (!json?.success) throw new Error(json?.error?.message || json?.message || "Request failed.");
  return json.data;
}

/** Side-by-side current vs requested values for a partner change request. */
function ChangeRequestReview({ req, app, saving, onDecide }) {
  const [why, setWhy] = useState("");
  const p = req.payload;
  const d = req.display || {};
  const curServices = (name) => {
    const c = app.categories.find((x) => x.name === name);
    return c ? (app.services[c.id] || []).map((x) => x.name).join(", ") : "—";
  };
  const curBrands = (name) => {
    const c = app.categories.find((x) => x.name === name);
    return c ? (app.brands[c.id] || []).map((x) => x.name).join(", ") : "—";
  };
  const rows = [
    ["Business type", BUSINESS_TYPES[app.business.business_type], p.business_type !== undefined ? BUSINESS_TYPES[p.business_type] : null],
    ["Name", app.business.business_name, p.business_name ?? null],
    ["GSTIN", app.business.gstin, p.gstin ?? null],
    ["Categories", app.categories.map((c) => c.name).join(", "), d.categories ? d.categories.join(", ") : null],
    ...Object.entries(d.services || {}).map(([cat, list]) => [`Services · ${cat}`, curServices(cat), list.join(", ")]),
    ...Object.entries(d.brands || {}).map(([cat, list]) => [`Brands · ${cat}`, curBrands(cat), list.join(", ") || "None"]),
  ];
  return (
    <div>
      <p className="col-muted" style={{ marginBottom: 8 }}>Sent {fmt(req.created_at)}. The live profile is unchanged until approved.</p>
      <table className="adm-table" style={{ marginBottom: 10 }}>
        <thead><tr><th>Field</th><th>Current</th><th>Requested</th></tr></thead>
        <tbody>
          {rows.map(([k, cur, next]) => (
            <tr key={k}>
              <td>{k}</td>
              <td className="col-muted">{cur || "—"}</td>
              <td style={{ fontWeight: next !== null && String(next ?? "") !== String(cur ?? "") ? 700 : 400 }}>{next === null ? "(no change)" : next || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Field label="Reason (required to reject, shown to partner)">
        <Textarea rows={2} value={why} onChange={(e) => setWhy(e.target.value)} maxLength={1000} />
      </Field>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <Button variant="primary" disabled={saving} onClick={() => onDecide(true, why)}>Approve & apply</Button>
        <Button variant="danger" disabled={saving || why.trim().length < 5} onClick={() => onDecide(false, why)}>Reject</Button>
      </div>
    </div>
  );
}

export default function AdminPartnerDetail({ params }) {
  const { id } = use(params);
  const [app, setApp] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [action, setAction] = useState(null); // ACTIONS item
  const [reason, setReason] = useState("");
  const [publish, setPublish] = useState(true);
  const [confirm, setConfirm] = useState(null); // { title, message, run, tone }
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    try {
      const d = await call(`/api/admin/partners/${id}`);
      setApp(d);
      setNote(d.admin_note || "");
    } catch (e) {
      setLoadError(e.message);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, okMsg) => {
    setSaving(true);
    try {
      const d = await fn();
      // Status/verification endpoints return the application only; keep wallet + reviews.
      if (d) setApp((prev) => ({ ...prev, ...d }));
      showToast(okMsg);
      return true;
    } catch (e) {
      showToast(e.message, "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const doAction = async () => {
    if (action.reason && reason.trim().length < 5) return showToast("Please give a reason (at least 5 characters).", "error");
    const ok = await run(
      () => call(`/api/admin/partners/${id}/status`, "PATCH", { action: action.key, reason, publish }),
      `${action.label} — done.`
    );
    if (ok) {
      setAction(null);
      setReason("");
    }
  };

  const viewDoc = async (docId) => {
    try {
      const d = await call(`/api/admin/partners/${id}/documents/${docId}`);
      window.open(d.url, "_blank", "noopener,noreferrer");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  if (loadError) return <div className="adm-card" style={{ padding: 20 }}>{loadError}</div>;
  if (!app)
    return (
      <div className="adm-card" style={{ padding: 20, display: "flex", gap: 8 }}>
        <Loader2 className="adm-spin" size={18} /> Loading application…
      </div>
    );

  const b = app.business;
  const a = app.address;
  const available = ACTIONS.filter((x) => x.from.includes(app.status));
  const meta = STATUS_META[app.status];

  return (
    <div>
      <Link href="/admin/partners" className="adm-btn adm-btn-ghost adm-btn-sm" style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> All partners
      </Link>
      <PageHead eyebrow={app.ref} title={b.business_name || app.full_name || "Unnamed applicant"} subtitle={`Registered ${fmt(app.created_at)}`} />

      {/* Status + actions */}
      <FormCard className="mb-4">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <Badge tone={meta.tone}>{meta.label}</Badge>
          {app.status === "approved" && <Badge tone={app.is_listed ? "ok" : "off"}>{app.is_listed ? "Publicly listed" : "Hidden from site"}</Badge>}
          {app.slug && app.status === "approved" && app.is_listed && (
            <a href={`/partners/${app.slug}`} target="_blank" rel="noreferrer" className="adm-btn adm-btn-sm adm-btn-ghost">
              <ExternalLink size={14} /> /partners/{app.slug}
            </a>
          )}
          <span style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
            {available.map((x) => (
              <Button key={x.key} variant={x.variant} onClick={() => (setAction(x), setReason(""), setPublish(true))}>
                {x.label}
              </Button>
            ))}
            {["approved", "suspended"].includes(app.status) && (
              <Button
                variant="ghost"
                disabled={saving}
                title="Rewrite the profile overview, meta title/description/keywords (and the About, if the partner never edited it) from the current services, brands and areas."
                onClick={() => run(() => call(`/api/admin/partners/${id}/seo`, "POST", { about: "auto" }), "SEO text regenerated.")}
              >
                Regenerate SEO text
              </Button>
            )}
            {app.status === "approved" && (
              <Button
                onClick={() =>
                  setConfirm({
                    title: app.is_listed ? "Hide from the website?" : "Publish on the website?",
                    message: app.is_listed
                      ? "The partner will disappear from city/locality pages and their profile URL will return 404."
                      : "The partner will appear on matching city/locality pages and get a public profile.",
                    run: () => call(`/api/admin/partners/${id}/listing`, "PATCH", { listed: !app.is_listed }),
                  })
                }
              >
                {app.is_listed ? "Unlist" : "Publish listing"}
              </Button>
            )}
          </span>
        </div>
        {app.review_reason && (
          <p className="col-muted" style={{ marginTop: 10, whiteSpace: "pre-line" }}>
            <b>Last reason sent to partner:</b> {app.review_reason}
          </p>
        )}
        {app.status === "pending" && !app.completion.ready && (
          <p style={{ marginTop: 10, color: "#b45309" }}>Incomplete: {Object.values(app.completion.missing).join(" ")}</p>
        )}
      </FormCard>

      <div className="adm-formgrid" style={{ alignItems: "start" }}>
        <FormCard>
          <SectionTitle>Personal & contact</SectionTitle>
          <div className="adm-formgrid">
            <Field label="Full name"><ReadOnly value={app.full_name} /></Field>
            <Field label="Mobile">
              <div className="adm-readonly mono" style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {app.mobile} {app.verification.mobile && <><BadgeCheck size={14} color="#16a34a" /> OTP verified</>}
              </div>
            </Field>
            <Field label="Public contact">
              <ReadOnly value={b.show_phone_publicly ? `Yes — ${CONTACT_PREFERENCES[b.contact_preference]}` : "No"} />
            </Field>
            <Field label="Business email"><ReadOnly value={b.business_email} /></Field>
          </div>

          <SectionTitle>Business</SectionTitle>
          <div className="adm-formgrid">
            <Field label="Type"><ReadOnly value={BUSINESS_TYPES[b.business_type]} /></Field>
            <Field label="Experience"><ReadOnly value={b.experience_years != null ? `${b.experience_years} years` : null} /></Field>
            <Field label="GSTIN"><ReadOnly value={b.gstin} mono /></Field>
            <Field label="Hours"><ReadOnly value={b.operating_hours} /></Field>
            <Field label="Description" className="full">
              <div className="adm-readonly" style={{ whiteSpace: "pre-wrap" }}>{b.description || "—"}</div>
            </Field>
            <Field label="Images" className="full">
              <div style={{ display: "flex", gap: 12 }}>
                {[app.logo_url, app.shop_image_url].map((u, i) =>
                  u ? (
                    <a key={i} href={u} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u} alt={i ? "Shop" : "Logo"} style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 12 }} />
                    </a>
                  ) : null
                )}
                {!app.logo_url && !app.shop_image_url && <Dash />}
              </div>
            </Field>
          </div>

          <SectionTitle>Address</SectionTitle>
          <ReadOnly value={[a.line, a.locality, a.city_name, a.state_name, a.pincode].filter(Boolean).join(", ")} />
        </FormCard>

        <FormCard>
          <SectionTitle>Verification (separate from approval)</SectionTitle>
          {[
            ["identity", "Identity checked (Aadhaar / ID proof)"],
            ["business", "Business checked (shop / licence)"],
            ["gst", "GST registration checked"],
          ].map(([field, label]) => (
            <label key={field} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 0" }}>
              <input
                type="checkbox"
                checked={app.verification[field]}
                disabled={saving || (field === "gst" && !b.gstin)}
                onChange={(e) =>
                  run(
                    () => call(`/api/admin/partners/${id}/verification`, "PATCH", { field, verified: e.target.checked }),
                    "Verification updated."
                  )
                }
              />
              {label}
              {field === "gst" && !b.gstin && <span className="col-muted">(no GSTIN)</span>}
            </label>
          ))}

          <SectionTitle>Documents (private)</SectionTitle>
          {app.documents.length === 0 && <p className="col-muted">No documents uploaded.</p>}
          {app.documents.map((d) => (
            <div key={d.id} style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", padding: "6px 0", borderBottom: "1px solid var(--adm-border, #eee)" }}>
              <FileText size={15} /> <b>{DOC_TYPES[d.doc_type]}</b>
              <span className="col-muted">{d.original_name}</span>
              <Badge tone={d.review_status === "verified" ? "ok" : d.review_status === "rejected" ? "off" : "warn"}>{d.review_status}</Badge>
              <span style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                <Button size="sm" variant="ghost" onClick={() => viewDoc(d.id)}><Eye size={14} /> View</Button>
                {["verified", "rejected"].map((s) => (
                  <Button
                    key={s}
                    size="sm"
                    disabled={saving || d.review_status === s}
                    onClick={() => run(() => call(`/api/admin/partners/${id}/documents/${d.id}`, "PATCH", { review_status: s }), "Document updated.")}
                  >
                    {s === "verified" ? "Verify" : "Reject"}
                  </Button>
                ))}
              </span>
            </div>
          ))}

          <SectionTitle>Internal note</SectionTitle>
          <Textarea rows={3} value={note} maxLength={2000} onChange={(e) => setNote(e.target.value)} placeholder="Only admins can see this." />
          <Button
            size="sm"
            style={{ marginTop: 8 }}
            disabled={saving || note === (app.admin_note || "")}
            onClick={() => run(() => call(`/api/admin/partners/${id}`, "PATCH", { admin_note: note }), "Note saved.")}
          >
            Save note
          </Button>
        </FormCard>
      </div>

      <FormCard className="mt-4">
        <SectionTitle>Categories, services & brands</SectionTitle>
        {app.categories.length === 0 && <Dash />}
        <div className="adm-formgrid">
          {app.categories.map((c) => (
            <div key={c.id}>
              <b>{c.name}</b>
              <p className="col-muted" style={{ margin: "4px 0" }}>{(app.services[c.id] || []).map((s) => s.name).join(", ") || "No services"}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(app.brands[c.id] || []).map((br) =>
                  br.custom ? (
                    <span key={br.id} style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                      <Badge tone={br.custom_status === "approved" ? "ok" : br.custom_status === "rejected" ? "off" : "warn"}>
                        Other: {br.name} ({br.custom_status})
                      </Badge>
                      {br.custom_status !== "approved" && (
                        <Button size="sm" disabled={saving} onClick={() => run(() => call(`/api/admin/partners/${id}/brands/${br.id}`, "PATCH", { status: "approved" }), "Brand approved.")}>
                          Approve
                        </Button>
                      )}
                      {br.custom_status !== "rejected" && (
                        <Button size="sm" disabled={saving} onClick={() => run(() => call(`/api/admin/partners/${id}/brands/${br.id}`, "PATCH", { status: "rejected" }), "Brand rejected.")}>
                          Reject
                        </Button>
                      )}
                    </span>
                  ) : (
                    <Badge key={br.id} tone="info">{br.name}</Badge>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      </FormCard>

      <FormCard className="mt-4">
        <SectionTitle>Service coverage</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {app.areas.map((ar) => (
            <Badge key={ar.id} tone={ar.is_primary ? "ok" : "info"}>
              {ar.locality_id ? `${ar.locality_name}, ${ar.city_name}` : `${ar.city_name} — entire city`}
              {ar.is_primary ? " (primary)" : ""}
            </Badge>
          ))}
          {app.areas.length === 0 && <Dash />}
        </div>
        {app.location_requests.length > 0 && (
          <p className="col-muted" style={{ marginTop: 8 }}>
            Locality requests:{" "}
            {app.location_requests.map((r) => `${r.requested_name} (${r.city_name}, ${r.status})`).join("; ")} —{" "}
            <Link href="/admin/partners/locations">resolve</Link>
          </p>
        )}
      </FormCard>

      {(app.change_requests || []).some((r) => r.status === "pending") && (
        <FormCard className="mt-4">
          <SectionTitle>Profile change request (waiting for approval)</SectionTitle>
          {app.change_requests.filter((r) => r.status === "pending").map((r) => (
            <ChangeRequestReview key={r.id} req={r} app={app} saving={saving} onDecide={(approve, why) =>
              run(() => call(`/api/admin/partners/change-requests/${r.id}`, "POST", { approve, reason: why }).then(() => call(`/api/admin/partners/${id}`)),
                approve ? "Changes approved and live." : "Change request rejected.")
            } />
          ))}
        </FormCard>
      )}

      <div className="adm-formgrid mt-4" style={{ alignItems: "start" }}>
        <FormCard>
          <SectionTitle>Wallet</SectionTitle>
          <p style={{ fontSize: 26, fontWeight: 800 }}>
            {Number(app.wallet?.balance || 0).toLocaleString("en-IN")} <span className="col-muted" style={{ fontSize: 14 }}>coins</span>
          </p>
          <p className="col-muted" style={{ margin: "4px 0 10px" }}>
            Refunds for fake / problem leads: <Link href={`/admin/partners/leads?partnerId=${app.id}`}>Partner leads</Link>
          </p>
          {(app.wallet?.txns || []).map((t) => (
            <div key={t.id} style={{ display: "flex", gap: 8, fontSize: 13, padding: "4px 0", borderBottom: "1px solid #eee" }}>
              <span>{t.type.replace("_", " ")}</span>
              <span className="col-muted adm-truncate" style={{ flex: 1 }}>{t.note}</span>
              <b style={{ color: Number(t.amount) < 0 ? "#b42318" : "#15803d" }}>{Number(t.amount) > 0 ? "+" : ""}{Number(t.amount)}</b>
            </div>
          ))}
          {!app.wallet?.txns?.length && <Dash />}
        </FormCard>

        <FormCard>
          <SectionTitle>Reviews</SectionTitle>
          {!app.reviews?.length && <Dash />}
          {(app.reviews || []).map((r) => (
            <div key={r.id} style={{ padding: "6px 0", borderBottom: "1px solid #eee", opacity: r.status === "removed" ? 0.5 : 1 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <b>{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</b>
                <span>{r.author}</span>
                {r.status === "removed" ? (
                  <span className="col-muted">removed by {r.removed_by}</span>
                ) : (
                  <Button
                    size="sm"
                    variant="danger"
                    style={{ marginLeft: "auto" }}
                    disabled={saving}
                    onClick={() =>
                      setConfirm({
                        title: "Remove this review?",
                        message: "It will disappear from the partner's public profile.",
                        tone: "danger",
                        run: async () => {
                          await call(`/api/admin/partners/reviews/${r.id}`, "DELETE");
                          return call(`/api/admin/partners/${id}`);
                        },
                      })
                    }
                  >
                    Remove
                  </Button>
                )}
              </div>
              {r.comment && <p className="col-muted" style={{ marginTop: 2 }}>{r.comment}</p>}
            </div>
          ))}
        </FormCard>
      </div>

      <FormCard className="mt-4">
        <SectionTitle>History & consents</SectionTitle>
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr><th>When</th><th>Action</th><th>Status</th><th>By</th><th>Reason / detail</th></tr>
            </thead>
            <tbody>
              {app.history.map((h) => (
                <tr key={h.id}>
                  <td className="col-muted" style={{ whiteSpace: "nowrap" }}>{fmt(h.created_at)}</td>
                  <td>{h.action.replace(/_/g, " ")}</td>
                  <td className="col-muted">{h.from_status && h.to_status && h.from_status !== h.to_status ? `${h.from_status} → ${h.to_status}` : h.to_status || "—"}</td>
                  <td>{h.actor_type === "admin" ? h.admin_name || `Admin #${h.actor_id}` : h.actor_type}</td>
                  <td className="col-muted" style={{ whiteSpace: "pre-line" }}>{h.reason || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="col-muted" style={{ marginTop: 8 }}>
          Consents: {app.consents.length ? app.consents.map((c) => `${c.consent_type} v${c.version} (${fmt(c.accepted_at)})`).join(", ") : "none yet"}
        </p>
      </FormCard>

      {action && (
        <Modal
          title={action.label}
          onClose={() => setAction(null)}
          footer={
            <>
              <Button onClick={() => setAction(null)} disabled={saving}>Cancel</Button>
              <Button variant={action.variant === "danger" ? "danger" : "primary"} onClick={doAction} disabled={saving}>
                {saving ? <Loader2 size={15} className="adm-spin" /> : null} Confirm {action.label.toLowerCase()}
              </Button>
            </>
          }
        >
          {action.reason ? (
            <Field label="Reason (shown to the partner) *">
              <Textarea rows={4} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} autoFocus />
            </Field>
          ) : (
            <p>
              {action.key === "approve"
                ? "Approving confirms the application passed review. It does not mark ID or GST as verified — use the Verification checkboxes for that."
                : "The partner becomes active again."}
            </p>
          )}
          {action.publish && (
            <label style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} /> Publish on matching city/locality pages
            </label>
          )}
        </Modal>
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          saving={saving}
          confirmLabel="Yes, continue"
          onCancel={() => setConfirm(null)}
          tone={confirm.tone}
          onConfirm={async () => {
            if (await run(confirm.run, "Done.")) setConfirm(null);
          }}
        />
      )}
      <Toast toast={toast} />
    </div>
  );
}
