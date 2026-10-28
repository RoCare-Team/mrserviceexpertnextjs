"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { PageHead, Field, SearchInput, Select, Button, Badge, Dash, TableState, Pagination, Modal, ReadOnly, Toast } from "@/app/(admin)/admin/components/AdminUI";

const TONE = { success: "ok", failed: "off", initiated: "warn" };
const LABEL = { success: "Success", failed: "Failed", initiated: "Pending" };
const fmt = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null);

export default function AdminPartnerPaymentsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({});
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState(null);
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const limit = 25;

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => (setSearch(searchInput), setPage(1)), 400);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/partners/payments?${new URLSearchParams({ page, limit, status, search })}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || json.message || "Failed to load.");
      setRows(json.data.rows);
      setTotal(json.data.total);
      setTotalPages(json.data.totalPages);
      setSummary(json.data.summary);
    } catch (e) {
      setToast({ message: e.message, type: "error" });
      setTimeout(() => setToast(null), 3500);
    } finally {
      setLoading(false);
    }
  }, [page, status, search]);

  useEffect(() => {
    load();
  }, [load]);

  let raw = null;
  try {
    raw = viewing?.raw_response ? JSON.stringify(JSON.parse(viewing.raw_response), null, 2) : null;
  } catch {
    raw = viewing?.raw_response || null;
  }

  return (
    <div>
      <Link href="/admin/partners" className="adm-btn adm-btn-ghost adm-btn-sm" style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> All partners
      </Link>
      <PageHead
        eyebrow="Partners"
        title="Wallet payments"
        subtitle="Every Easebuzz recharge attempt by partners — successful, failed and pending — with gateway details."
        count={summary.success_amount ?? 0}
        countLabel="₹ collected"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {[["", "All"], ["success", `Success (${summary.success || 0})`], ["failed", `Failed (${summary.failed || 0})`], ["initiated", `Pending (${summary.pending || 0})`]].map(([k, l]) => (
          <button key={k || "all"} onClick={() => (setStatus(k), setPage(1))} className={`adm-btn adm-btn-sm ${status === k ? "adm-btn-primary" : ""}`}>{l}</button>
        ))}
      </div>

      <div className="adm-toolbar">
        <Field label="Search (txn id, Easebuzz id, partner, mobile)" grow>
          <SearchInput value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => (setStatus(e.target.value), setPage(1))}>
            <option value="">All</option>
            {Object.keys(LABEL).map((s) => <option key={s} value={s}>{LABEL[s]}</option>)}
          </Select>
        </Field>
      </div>

      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr><th>#</th><th>Partner</th><th>Amount</th><th>Status</th><th>Method</th><th>Txn / Easebuzz ID</th><th>Created</th><th></th></tr>
            </thead>
            <tbody>
              {loading || rows.length === 0 ? (
                <TableState colSpan={8} loading={loading} emptyTitle="No payments" emptyHint="Partner wallet recharges will appear here." />
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td className="col-id">{r.id}</td>
                    <td>
                      <Link href={`/admin/partners/${r.partner_id}`}>{r.business_name || r.full_name}</Link>
                      <span className="col-muted" style={{ display: "block", fontSize: 12 }}>{r.partner_mobile}</span>
                    </td>
                    <td><b>₹{Number(r.amount).toLocaleString("en-IN")}</b>{r.mode === "test" && <span className="col-muted" style={{ display: "block", fontSize: 11 }}>TEST</span>}</td>
                    <td>
                      <Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge>
                      {r.error_message && <span className="col-muted" style={{ display: "block", fontSize: 11, maxWidth: 200 }}>{r.error_message}</span>}
                    </td>
                    <td className="col-muted">{[r.payment_mode, r.card_or_vpa].filter(Boolean).join(" · ") || <Dash />}</td>
                    <td className="col-muted" style={{ fontSize: 12 }}>{r.txnid}<br />{r.easebuzz_id || ""}</td>
                    <td className="col-muted" style={{ whiteSpace: "nowrap" }}>{fmt(r.created_at)}</td>
                    <td><Button size="sm" variant="ghost" onClick={() => setViewing(r)}><Eye size={14} /> Details</Button></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination page={page} totalPages={totalPages} from={total ? (page - 1) * limit + 1 : 0} to={Math.min(page * limit, total)} total={total} onPage={setPage} />

      {viewing && (
        <Modal title="Payment details" id={viewing.id} onClose={() => setViewing(null)} footer={<Button onClick={() => setViewing(null)}>Close</Button>}>
          <div className="adm-formgrid">
            <Field label="Partner"><ReadOnly value={`${viewing.business_name || viewing.full_name} · ${viewing.partner_mobile}`} /></Field>
            <Field label="Amount"><ReadOnly value={`₹${Number(viewing.amount)} (${viewing.mode})`} /></Field>
            <Field label="Status"><ReadOnly value={`${LABEL[viewing.status]}${viewing.gateway_status ? ` · gateway: ${viewing.gateway_status}` : ""}`} /></Field>
            <Field label="Reason (if failed)"><ReadOnly value={viewing.error_message} /></Field>
            <Field label="Transaction ID"><ReadOnly value={viewing.txnid} mono /></Field>
            <Field label="Easebuzz ID"><ReadOnly value={viewing.easebuzz_id} mono /></Field>
            <Field label="Method"><ReadOnly value={viewing.payment_mode} /></Field>
            <Field label="Card / UPI"><ReadOnly value={viewing.card_or_vpa} /></Field>
            <Field label="Bank"><ReadOnly value={viewing.bank_name} /></Field>
            <Field label="Bank reference"><ReadOnly value={viewing.bank_ref_num} mono /></Field>
            <Field label="Receipt email"><ReadOnly value={viewing.email} /></Field>
            <Field label="Created / completed"><ReadOnly value={`${fmt(viewing.created_at)} → ${fmt(viewing.completed_at) || "—"}`} /></Field>
            {raw && (
              <Field label="Raw gateway response" className="full">
                <pre className="adm-readonly" style={{ maxHeight: 240, overflow: "auto", fontSize: 11, whiteSpace: "pre-wrap" }}>{raw}</pre>
              </Field>
            )}
          </div>
        </Modal>
      )}
      <Toast toast={toast} />
    </div>
  );
}
