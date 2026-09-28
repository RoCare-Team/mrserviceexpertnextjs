"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Trash2, Eye, Phone, Mail, MessageCircle } from "lucide-react";
import {
  PageHead,
  Field,
  SearchInput,
  Select,
  Textarea,
  Button,
  SortHeader,
  Badge,
  Dash,
  TableState,
  Pagination,
  Modal,
  ConfirmDialog,
  Toast,
  ReadOnly,
} from "@/app/(admin)/admin/components/AdminUI";

const STATUSES = [
  { value: "new", label: "New", tone: "warn" },
  { value: "read", label: "Read", tone: "info" },
  { value: "resolved", label: "Resolved", tone: "ok" },
];
const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.value, s]));

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

export default function ContactUsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({ new: 0, read: 0, resolved: 0 });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("DESC");

  const [viewing, setViewing] = useState(null);
  const [note, setNote] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const searchTimer = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
  }, [searchInput]);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page), limit: String(limit), search, status: statusFilter, sortBy, sortDir,
      });
      const res = await fetch(`/api/admin/contact_us?${qs}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.data); setTotal(data.total); setTotalPages(data.totalPages); setCounts(data.counts);
      } else showToast(data.message || "Failed to load.", "error");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, sortBy, sortDir]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    else { setSortBy(col); setSortDir("ASC"); }
    setPage(1);
  };

  const update = async (id, patch, quiet = false) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/contact_us", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Update failed.");
      if (!quiet) showToast(data.message);
      setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      setViewing((v) => (v && v.id === id ? { ...v, ...patch } : v));
      return true;
    } catch (e) {
      showToast(e.message, "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Opening a new enquiry marks it read, so the "New" count means "unseen".
  const openView = async (row) => {
    setViewing(row);
    setNote(row.admin_note || "");
    if (row.status === "new") {
      if (await update(row.id, { status: "read" }, true))
        setCounts((c) => ({ ...c, new: Math.max(0, c.new - 1), read: c.read + 1 }));
    }
  };

  const changeStatus = async (row, status) => {
    if (status === row.status) return;
    if (await update(row.id, { status }))
      setCounts((c) => ({ ...c, [row.status]: Math.max(0, c[row.status] - 1), [status]: c[status] + 1 }));
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/contact_us?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Enquiry deleted.");
        setDeleteTarget(null);
        setViewing(null);
        if (rows.length === 1 && page > 1) setPage((p) => p - 1);
        else fetchRows();
      } else showToast(data.message || "Delete failed.", "error");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setSearchInput(""); setSearch(""); setStatusFilter("");
    setSortBy("id"); setSortDir("DESC"); setPage(1);
  };

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const sortProps = { sortBy, sortDir, onSort: toggleSort };

  return (
    <div>
      <PageHead
        eyebrow="Leads"
        title="Contact Us Enquiries"
        subtitle="Messages submitted from the website's Contact Us page."
        count={counts.new}
        countLabel="new"
      />

      {/* Filters */}
      <div className="adm-toolbar">
        <Field label="Search (name, phone, email, message)" grow>
          <SearchInput placeholder="e.g. 98xxxxxx or Rahul" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </Field>
        <Field label="Status">
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All ({counts.new + counts.read + counts.resolved})</option>
            {STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label} ({counts[s.value]})</option>))}
          </Select>
        </Field>
        <Field label="Per page">
          <Select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}>
            {[10, 25, 50, 100].map((n) => (<option key={n} value={n}>{n}</option>))}
          </Select>
        </Field>
        <Button onClick={clearFilters}>Clear</Button>
      </div>

      {/* Table */}
      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr>
                <SortHeader label="ID" col="id" {...sortProps} />
                <SortHeader label="Name" col="name" {...sortProps} />
                <SortHeader label="Phone" col="phone" {...sortProps} />
                <SortHeader label="Email" col="email" {...sortProps} />
                <SortHeader label="Message" col="message" sortable={false} />
                <SortHeader label="Status" col="status" {...sortProps} />
                <SortHeader label="Received" col="created_at" {...sortProps} />
                <SortHeader label="Actions" col="action" sortable={false} />
              </tr>
            </thead>
            <tbody>
              {loading || rows.length === 0 ? (
                <TableState colSpan={8} loading={loading} emptyTitle="No enquiries yet" emptyHint="Submissions from /contact will show up here." />
              ) : (
                rows.map((row) => (
                  <tr key={row.id} style={row.status === "new" ? { fontWeight: 600 } : undefined}>
                    <td className="col-id">{row.id}</td>
                    <td><span className="adm-truncate" style={{ display: "block", maxWidth: 160 }}>{row.name}</span></td>
                    <td className="col-url"><a href={`tel:${row.phone}`}>{row.phone}</a></td>
                    <td className="col-url"><span className="adm-truncate" style={{ display: "block", maxWidth: 200 }}>{row.email}</span></td>
                    <td className="col-muted">
                      <span className="adm-truncate" style={{ display: "block", maxWidth: 260 }}>
                        {row.subject ? <b>{row.subject} · </b> : null}{row.message || <Dash />}
                      </span>
                    </td>
                    <td><Badge tone={STATUS_MAP[row.status]?.tone || "off"}>{STATUS_MAP[row.status]?.label || row.status}</Badge></td>
                    <td className="col-muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(row.created_at)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Button size="sm" variant="ghost" onClick={() => openView(row)}><Eye size={14} /> View</Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)} aria-label="Delete"><Trash2 size={14} /></Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPage={setPage} />

      {/* Detail modal */}
      {viewing && (
        <Modal
          title="Enquiry"
          id={viewing.id}
          onClose={() => setViewing(null)}
          footer={
            <>
              <Button variant="danger" onClick={() => setDeleteTarget(viewing)}><Trash2 size={15} /> Delete</Button>
              <Button onClick={() => setViewing(null)} style={{ marginLeft: "auto" }}>Close</Button>
              <Button
                variant="primary"
                disabled={saving || note.trim() === (viewing.admin_note || "")}
                onClick={() => update(viewing.id, { admin_note: note.trim() })}
              >
                Save note
              </Button>
            </>
          }
        >
          <div className="adm-formgrid">
            <Field label="Name"><ReadOnly value={viewing.name} /></Field>
            <Field label="Received"><ReadOnly value={fmtDate(viewing.created_at)} /></Field>
            <Field label="Phone"><ReadOnly value={viewing.phone} mono /></Field>
            <Field label="Email"><ReadOnly value={viewing.email} /></Field>
            {viewing.subject && <Field label="Subject" className="full"><ReadOnly value={viewing.subject} /></Field>}
            <Field label="Message" className="full">
              <div className="adm-readonly" style={{ whiteSpace: "pre-wrap", lineHeight: 1.55, maxHeight: 260, overflowY: "auto" }}>
                {viewing.message}
              </div>
            </Field>
            <Field label="Quick actions" className="full">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <a className="adm-btn adm-btn-sm" href={`tel:${viewing.phone}`}><Phone size={14} /> Call</a>
                <a className="adm-btn adm-btn-sm" href={`https://wa.me/91${viewing.phone}`} target="_blank" rel="noopener noreferrer"><MessageCircle size={14} /> WhatsApp</a>
                <a className="adm-btn adm-btn-sm" href={`mailto:${viewing.email}?subject=${encodeURIComponent("Re: " + (viewing.subject || "Your enquiry – Mr. Service Expert"))}`}><Mail size={14} /> Email</a>
              </div>
            </Field>
            <Field label="Status">
              <Select value={viewing.status} disabled={saving} onChange={(e) => changeStatus(viewing, e.target.value)}>
                {STATUSES.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
              </Select>
            </Field>
            <Field label="Source page"><ReadOnly value={viewing.page_url} /></Field>
            <Field label="Internal note" className="full">
              <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Called back, booked RO service for Saturday" maxLength={500} />
            </Field>
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this enquiry?"
          message={`The message from ${deleteTarget.name} (${deleteTarget.phone}) will be permanently removed.`}
          tone="danger"
          confirmLabel="Yes, delete"
          saving={saving}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={doDelete}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
