"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Undo2, Percent } from "lucide-react";
import {
  PageHead,
  Field,
  SearchInput,
  Select,
  Input,
  Button,
  Badge,
  Dash,
  TableState,
  Pagination,
  Modal,
  Textarea,
  Toast,
} from "@/app/(admin)/admin/components/AdminUI";

const STATUS_TONE = { new: "warn", accepted: "ok", completed: "ok", rejected: "off", expired: "off" };
const CRM_TONE = { none: "off", pending: "warn", sent: "ok", duplicate: "info", failed: "off" };
const refundOf = (cost, pct) => Math.round(Number(cost) * pct) / 100;
const validPct = (v) => Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 100;
const fmt = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : null);

async function call(url, method = "GET", body) {
  const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => null);
  if (!json?.success) throw new Error(json?.error?.message || json?.message || "Request failed.");
  return json.data;
}

export default function AdminPartnerLeadsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({});
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [crm, setCrm] = useState("");
  const [issues, setIssues] = useState(false);
  const [partnerId, setPartnerId] = useState(null); // from ?partnerId= (link on partner detail)
  const [ready, setReady] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [refund, setRefund] = useState(null);
  const [note, setNote] = useState("");
  const [refundPct, setRefundPct] = useState(""); // this refund (override)
  const [defaultPct, setDefaultPct] = useState(null); // global setting
  const [pctEdit, setPctEdit] = useState(null); // settings modal value
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const limit = 25;

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const pid = Number(new URLSearchParams(window.location.search).get("partnerId"));
    if (Number.isInteger(pid) && pid > 0) setPartnerId(pid);
    if (new URLSearchParams(window.location.search).get("issues") === "1") setIssues(true);
    setReady(true);
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => (setSearch(searchInput), setPage(1)), 400);
  }, [searchInput]);

  useEffect(() => {
    call("/api/admin/partners/settings")
      .then((d) => setDefaultPct(d.lead_refund_percent))
      .catch(() => {});
  }, []);

  const saveDefaultPct = async () => {
    if (!validPct(pctEdit)) return showToast("Enter a whole number from 1 to 100.", "error");
    setSaving(true);
    try {
      const d = await call("/api/admin/partners/settings", "PUT", { lead_refund_percent: Number(pctEdit) });
      setDefaultPct(d.lead_refund_percent);
      setPctEdit(null);
      showToast(`Default refund set to ${d.lead_refund_percent}%.`);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const openRefund = (r) => {
    setRefund(r);
    setNote(r.issue_note ? `Refund: ${r.issue_note}` : "");
    setRefundPct(String(defaultPct ?? 100));
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ page, limit, status, crm, search });
      if (issues) qs.set("issues", "1");
      if (partnerId) qs.set("partnerId", partnerId);
      const d = await call(`/api/admin/partners/leads?${qs}`);
      setRows(d.rows);
      setTotal(d.total);
      setTotalPages(d.totalPages);
      setCounts(d.counts);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, status, crm, issues, search, partnerId]);

  useEffect(() => {
    if (ready) load();
  }, [load, ready]);

  const doRefund = async () => {
    setSaving(true);
    try {
      if (!validPct(refundPct)) throw new Error("Refund % must be a whole number from 1 to 100.");
      const d = await call(`/api/admin/partners/leads/${refund.id}`, "POST", { action: "refund", note, percent: Number(refundPct) });
      showToast(`Refunded ${d.coins} coins (${d.percent}%) to ${refund.business_name}.`);
      setRefund(null);
      load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const retry = async (row) => {
    try {
      await call(`/api/admin/partners/leads/${row.id}`, "POST", { action: "retry_crm" });
      showToast("CRM forwarding retried.");
      load();
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  return (
    <div>
      <Link href="/admin/partners" className="adm-btn adm-btn-ghost adm-btn-sm" style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> All partners
      </Link>
      <PageHead
        eyebrow="Partners"
        title="Partner leads"
        subtitle="Bookings made from partner cards / profiles. The chosen partner has 15 minutes; then the lead opens to all partners in the city for 15 minutes; still unaccepted → CRM."
        count={counts.issues || 0}
        countLabel="problem reports"
      />

      <div className="adm-card" style={{ padding: 12, marginBottom: 12, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, fontSize: 14 }}>
        <Percent size={16} />
        <span>
          Fake / problem lead refund: <b>{defaultPct === null ? "…" : `${defaultPct}% of coins`}</b>
          <span className="col-muted"> · default for every refund, can be changed per refund</span>
        </span>
        <Button size="sm" style={{ marginLeft: "auto" }} onClick={() => setPctEdit(String(defaultPct ?? 100))}>Change</Button>
      </div>

      <div className="adm-toolbar">
        <Field label="Search (customer, mobile, partner, lead #)" grow>
          <SearchInput value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))}>
            <option value="">All</option>
            {Object.keys(STATUS_TONE).map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </Field>
        <Field label="CRM">
          <Select value={crm} onChange={(e) => (setCrm(e.target.value), setPage(1))}>
            <option value="">All</option>
            {Object.keys(CRM_TONE).map((s) => <option key={s} value={s}>{s}{s === "failed" && counts.crm_failed ? ` (${counts.crm_failed})` : ""}</option>)}
          </Select>
        </Field>
        {partnerId && (
          <Field label="Partner">
            <Button onClick={() => (setPartnerId(null), setPage(1))}>#{partnerId} ✕</Button>
          </Field>
        )}
        <Field label="Problems">
          <label style={{ display: "flex", gap: 6, alignItems: "center", height: 40 }}>
            <input type="checkbox" checked={issues} onChange={(e) => (setIssues(e.target.checked), setPage(1))} /> Reported, not refunded
          </label>
        </Field>
      </div>

      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>#</th><th>Partner</th><th>Customer</th><th>Service</th><th>Coins</th><th>Status</th><th>CRM</th><th>Created</th><th></th>
              </tr>
            </thead>
            <tbody>
              {loading || rows.length === 0 ? (
                <TableState colSpan={9} loading={loading} emptyTitle="No leads" emptyHint="Bookings from partner cards will appear here." />
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td className="col-id">{r.id}</td>
                    <td>
                      <Link href={`/admin/partners/${r.partner_id}`}>{r.business_name}</Link>
                      {r.original_partner_id && r.original_partner_id !== r.partner_id && (
                        <span className="col-muted" style={{ display: "block", fontSize: 12 }}>
                          from pool · chosen: <Link href={`/admin/partners/${r.original_partner_id}`}>{r.original_business_name}</Link>
                        </span>
                      )}
                    </td>
                    <td>
                      <b style={{ display: "block" }}>{r.customer_name}</b>
                      <span className="col-muted">{r.customer_mobile} · {r.area}, {r.address_city} {r.pincode}</span>
                    </td>
                    <td>
                      {r.service_name} <span className="col-muted">₹{Number(r.service_price)}</span>
                      <span className="col-muted" style={{ display: "block", fontSize: 12 }}>
                        {r.category_name}{r.brand_name ? ` · ${r.brand_name}` : ""} · {r.appointment_date} {r.appointment_time}
                      </span>
                      <a href={r.page_url} target="_blank" rel="noreferrer" className="col-muted" style={{ fontSize: 12 }}>source page</a>
                    </td>
                    <td>
                      {Number(r.coin_cost)}
                      {r.refunded_at && (
                        <span className="col-muted" style={{ display: "block", fontSize: 12 }}>
                          refunded{r.refund_coins != null ? ` ${Number(r.refund_coins)} (${r.refund_percent}%)` : ""}
                        </span>
                      )}
                    </td>
                    <td>
                      <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                      {r.phase === "open" && <span className="col-muted" style={{ display: "block", fontSize: 12 }}>open pool{r.status === "new" ? " · live" : ""}</span>}
                      {r.issue_note && <span style={{ display: "block", fontSize: 12, color: "#b45309", maxWidth: 220 }}>⚑ {r.issue_note}</span>}
                    </td>
                    <td>
                      <Badge tone={CRM_TONE[r.crm_status]}>{r.crm_status}</Badge>
                      {r.crm_status === "failed" && <span className="col-muted" style={{ display: "block", fontSize: 11, maxWidth: 200 }}>{r.crm_response}</span>}
                    </td>
                    <td className="col-muted" style={{ whiteSpace: "nowrap" }}>{fmt(r.created_at) || <Dash />}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {["accepted", "completed"].includes(r.status) && !r.refunded_at && (
                        <Button size="sm" onClick={() => openRefund(r)}>
                          <Undo2 size={14} /> Refund
                        </Button>
                      )}
                      {r.crm_status === "failed" && (
                        <Button size="sm" onClick={() => retry(r)}><RotateCcw size={14} /> Retry CRM</Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} totalPages={totalPages} from={total ? (page - 1) * limit + 1 : 0} to={Math.min(page * limit, total)} total={total} onPage={setPage} />

      {refund && (
        <Modal
          title="Refund coins"
          id={refund.id}
          onClose={() => setRefund(null)}
          footer={
            <>
              <Button onClick={() => setRefund(null)} disabled={saving}>Cancel</Button>
              <Button variant="primary" onClick={doRefund} disabled={saving || !validPct(refundPct)}>
                Refund {validPct(refundPct) ? refundOf(refund.coin_cost, Number(refundPct)) : "…"} coins
              </Button>
            </>
          }
        >
          <p style={{ marginBottom: 10 }}>
            Lead #{refund.id} cost <b>{Number(refund.coin_cost)} coins</b>. Return{" "}
            <b>{validPct(refundPct) ? refundOf(refund.coin_cost, Number(refundPct)) : "…"} coins</b> to <b>{refund.business_name}</b>. This can be done once per lead.
          </p>
          <Field label={`Refund % (default ${defaultPct ?? 100}%)`}>
            <Input type="number" min={1} max={100} step={1} value={refundPct} onChange={(e) => setRefundPct(e.target.value)} />
          </Field>
          <div style={{ height: 10 }} />
          <Field label="Note (shown in partner's wallet history)">
            <Textarea rows={2} maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </Modal>
      )}
      {pctEdit !== null && (
        <Modal
          title="Default refund %"
          onClose={() => setPctEdit(null)}
          footer={
            <>
              <Button onClick={() => setPctEdit(null)} disabled={saving}>Cancel</Button>
              <Button variant="primary" onClick={saveDefaultPct} disabled={saving}>Save</Button>
            </>
          }
        >
          <p style={{ marginBottom: 10 }}>
            When a partner reports a fake or problem lead and you refund it, this % of the lead&apos;s coins is returned to their wallet.
            Partners see this % on their dashboard.
          </p>
          <Field label="Refund % (1–100)">
            <Input type="number" min={1} max={100} step={1} value={pctEdit} onChange={(e) => setPctEdit(e.target.value)} />
          </Field>
        </Modal>
      )}
      <Toast toast={toast} />
    </div>
  );
}
