"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Trash2, ArrowRight } from "lucide-react";
import {
  PageHead,
  Field,
  SearchInput,
  Input,
  Select,
  Button,
  SortHeader,
  Badge,
  Dash,
  TableState,
  Pagination,
  Modal,
  ConfirmDialog,
  Toast,
} from "@/app/(admin)/admin/components/AdminUI";

const REDIRECT_TYPES = [
  { value: 301, label: "301 – Permanent", tone: "ok" },
  { value: 302, label: "302 – Temporary", tone: "info" },
  { value: 410, label: "410 – Gone", tone: "off" },
  { value: 404, label: "404 – Not Found", tone: "off" },
];
const TYPE_MAP = Object.fromEntries(REDIRECT_TYPES.map((t) => [t.value, t]));
const INITIAL_FORM = { source_url: "", redirect_url: "", redirect_type: 301, status: "1", note: "" };
const needsDest = (type) => type === 301 || type === 302;

export default function RedirectsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("DESC");

  const [modalMode, setModalMode] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [confirmOpen, setConfirmOpen] = useState(false);
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
        page: String(page), limit: String(limit), search,
        status: statusFilter, redirect_type: typeFilter, sortBy, sortDir,
      });
      const res = await fetch(`/api/redirects?${qs}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.data); setTotal(data.total); setTotalPages(data.totalPages);
      } else showToast(data.message || "Failed to load.", "error");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, typeFilter, sortBy, sortDir]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    else { setSortBy(col); setSortDir("ASC"); }
    setPage(1);
  };

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => { setForm(INITIAL_FORM); setModalMode("create"); };
  const openEdit = (row) => {
    setForm({
      id: row.id, source_url: row.source_url || "", redirect_url: row.redirect_url || "",
      redirect_type: row.redirect_type, status: String(row.status), note: row.note || "",
    });
    setModalMode("edit");
  };
  const closeModal = () => { setModalMode(null); setConfirmOpen(false); };

  const handleSaveClick = () => {
    if (!form.source_url.trim()) return showToast("Source URL is required.", "error");
    if (needsDest(Number(form.redirect_type)) && !form.redirect_url.trim())
      return showToast("Redirect URL is required for 301/302.", "error");
    setConfirmOpen(true);
  };

  const doSave = async () => {
    setSaving(true);
    try {
      const isEdit = modalMode === "edit";
      const res = await fetch("/api/redirects", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          redirect_type: Number(form.redirect_type),
          redirect_url: needsDest(Number(form.redirect_type)) ? form.redirect_url : "",
        }),
      });
      const data = await res.json();
      if (data.success) { showToast(data.message); closeModal(); fetchRows(); }
      else { showToast(data.message || "Failed.", "error"); setConfirmOpen(false); }
    } catch (e) {
      showToast(e.message, "error"); setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/redirects?id=${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Redirect deleted.");
        setDeleteTarget(null);
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
    setSearchInput(""); setSearch(""); setStatusFilter(""); setTypeFilter("");
    setSortBy("id"); setSortDir("DESC"); setPage(1);
  };

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const sortProps = { sortBy, sortDir, onSort: toggleSort };

  return (
    <div>
      <PageHead
        eyebrow="System"
        title="Redirects"
        subtitle="301, 302, 410 and 404 rules — applied live by the site middleware."
        count={total}
        countLabel="rules"
      />

      {/* Filters */}
      <div className="adm-toolbar">
        <Field label="Search (source, destination, note)" grow>
          <SearchInput placeholder="e.g. /old-page" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
        </Field>
        <Field label="Type">
          <Select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All types</option>
            {REDIRECT_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All</option>
            <option value="1">Active</option>
            <option value="0">Disabled</option>
          </Select>
        </Field>
        <Field label="Per page">
          <Select value={limit} onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}>
            {[10, 25, 50, 100].map((n) => (<option key={n} value={n}>{n}</option>))}
          </Select>
        </Field>
        <Button onClick={clearFilters}>Clear</Button>
        <Button variant="primary" onClick={openCreate}><Plus size={17} /> New redirect</Button>
      </div>

      {/* Table */}
      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr>
                <SortHeader label="ID" col="id" {...sortProps} />
                <SortHeader label="Source URL" col="source_url" {...sortProps} />
                <SortHeader label="Destination" col="redirect_url" {...sortProps} />
                <SortHeader label="Type" col="redirect_type" {...sortProps} />
                <SortHeader label="Status" col="status" sortable={false} />
                <SortHeader label="Note" col="note" sortable={false} />
                <SortHeader label="Actions" col="action" sortable={false} />
              </tr>
            </thead>
            <tbody>
              {loading || rows.length === 0 ? (
                <TableState colSpan={7} loading={loading} emptyTitle="No redirect rules" emptyHint="Create your first 301/302 rule." />
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="col-id">{row.id}</td>
                    <td className="col-url"><span className="adm-truncate" style={{ display: "block", maxWidth: 220 }}>{row.source_url}</span></td>
                    <td className="col-url">{row.redirect_url ? <span className="adm-truncate" style={{ display: "block", maxWidth: 220 }}>{row.redirect_url}</span> : <Dash />}</td>
                    <td><Badge tone={TYPE_MAP[row.redirect_type]?.tone || "off"} code>{row.redirect_type}</Badge></td>
                    <td><Badge tone={String(row.status) === "1" ? "ok" : "off"}>{String(row.status) === "1" ? "Active" : "Off"}</Badge></td>
                    <td className="col-muted"><span className="adm-truncate" style={{ display: "block", maxWidth: 160 }}>{row.note || <Dash />}</span></td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(row)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => setDeleteTarget(row)}><Trash2 size={14} /></Button>
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

      {/* Create / Edit modal */}
      {modalMode && (
        <Modal
          title={modalMode === "create" ? "New redirect rule" : `Edit rule`}
          id={modalMode === "edit" ? form.id : undefined}
          onClose={closeModal}
          footer={
            <>
              <Button onClick={closeModal}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveClick}>{modalMode === "create" ? "Create rule" : "Save changes"}</Button>
            </>
          }
        >
          <div className="adm-formgrid">
            <Field label="Source URL" className="full">
              <Input value={form.source_url} onChange={(e) => setField("source_url", e.target.value)} placeholder="/old-page-url" />
            </Field>
            <Field label="Redirect type">
              <Select value={form.redirect_type} onChange={(e) => setField("redirect_type", parseInt(e.target.value))}>
                {REDIRECT_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => setField("status", e.target.value)}>
                <option value="1">Active</option>
                <option value="0">Disabled</option>
              </Select>
            </Field>
            {needsDest(Number(form.redirect_type)) ? (
              <Field label="Destination URL" className="full">
                <Input value={form.redirect_url} onChange={(e) => setField("redirect_url", e.target.value)} placeholder="/new-page  or  https://example.com/page" />
              </Field>
            ) : (
              <div className="full adm-tabhint" style={{ background: "var(--adm-surface-2)", border: "1px solid var(--adm-border)", borderRadius: 11, padding: "10px 12px", margin: 0 }}>
                {Number(form.redirect_type) === 410
                  ? "410 Gone — no destination needed. Search engines will drop this URL."
                  : "404 Not Found — no destination needed. Visitors get the standard 404."}
              </div>
            )}
            <Field label="Internal note" className="full">
              <Input value={form.note} onChange={(e) => setField("note", e.target.value)} placeholder="e.g. Old city page removed after restructure" />
            </Field>
          </div>
        </Modal>
      )}

      {confirmOpen && (
        <ConfirmDialog
          title={modalMode === "create" ? "Create this redirect?" : "Save changes?"}
          message={
            <span style={{ fontFamily: "var(--adm-mono)", fontSize: 12.5 }}>
              {form.source_url || "—"}
              {needsDest(Number(form.redirect_type)) && (<>{" "}<ArrowRight size={12} style={{ display: "inline" }} />{" "}{form.redirect_url || "—"}</>)}
              {"  ·  "}{TYPE_MAP[Number(form.redirect_type)]?.label}
            </span>
          }
          saving={saving}
          confirmLabel="Confirm"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={doSave}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog
          title="Delete this rule?"
          message={`Source ${deleteTarget.source_url} will no longer redirect. This cannot be undone.`}
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
