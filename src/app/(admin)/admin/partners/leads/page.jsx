"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Undo2 } from "lucide-react";
import {
  PageHead,
  Field,
  SearchInput,
  Select,
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
      await call(`/api/admin/partners/leads/${refund.id}`, "POST", { action: "refund", note });
      showToast(`Refunded ${refund.coin_cost} coins to ${refund.business_name}.`);
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
        subtitle="Bookings made from partner cards / profiles. Unaccepted leads move to the CRM after 30 minutes."
        count={counts.issues || 0}
        countLabel="problem reports"
      />

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
                    <td><Link href={`/admin/partners/${r.partner_id}`}>{r.business_name}</Link></td>
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
                    <td>{Number(r.coin_cost)}{r.refunded_at && <span className="col-muted" style={{ display: "block", fontSize: 12 }}>refunded</span>}</td>
                    <td>
                      <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                      {r.issue_note && <span style={{ display: "block", fontSize: 12, color: "#b45309", maxWidth: 220 }}>⚑ {r.issue_note}</span>}
                    </td>
                    <td>
                      <Badge tone={CRM_TONE[r.crm_status]}>{r.crm_status}</Badge>
                      {r.crm_status === "failed" && <span className="col-muted" style={{ display: "block", fontSize: 11, maxWidth: 200 }}>{r.crm_response}</span>}
                    </td>
                    <td className="col-muted" style={{ whiteSpace: "nowrap" }}>{fmt(r.created_at) || <Dash />}</td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {["accepted", "completed"].includes(r.status) && !r.refunded_at && (
                        <Button size="sm" onClick={() => (setRefund(r), setNote(r.issue_note ? `Refund: ${r.issue_note}` : ""))}>
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
              <Button variant="primary" onClick={doRefund} disabled={saving}>Refund {Number(refund.coin_cost)} coins</Button>
            </>
          }
        >
          <p style={{ marginBottom: 10 }}>
            Return <b>{Number(refund.coin_cost)} coins</b> to <b>{refund.business_name}</b> for lead #{refund.id}. This can be done once per lead.
          </p>
          <Field label="Note (shown in partner's wallet history)">
            <Textarea rows={2} maxLength={255} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>
        </Modal>
      )}
      <Toast toast={toast} />
    </div>
  );
}
