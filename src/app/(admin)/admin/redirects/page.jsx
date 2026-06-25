"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// ─── constants ────────────────────────────────────────────────────────────────
const REDIRECT_TYPES = [
  { value: 301, label: "301 – Permanent", color: "bg-green-100 text-green-700" },
  { value: 302, label: "302 – Temporary", color: "bg-blue-100 text-blue-700" },
  { value: 410, label: "410 – Gone",      color: "bg-red-100 text-red-700" },
  { value: 404, label: "404 – Not Found", color: "bg-gray-100 text-gray-600" },
];

const TYPE_MAP = Object.fromEntries(REDIRECT_TYPES.map((t) => [t.value, t]));

const INITIAL_FORM = {
  source_url: "",
  redirect_url: "",
  redirect_type: 301,
  status: "1",
  note: "",
};

// ─── helpers ──────────────────────────────────────────────────────────────────
const needsDest = (type) => type === 301 || type === 302;

// ─── component ────────────────────────────────────────────────────────────────
export default function RedirectsPage() {
  // list state
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("DESC");

  // modals
  const [modalMode, setModalMode] = useState(null); // 'create' | 'edit'
  const [form, setForm] = useState(INITIAL_FORM);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, source_url }

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const searchTimer = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── debounce search ────────────────────────────────────────────────────────
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
  }, [searchInput]);

  // ── fetch list ─────────────────────────────────────────────────────────────
  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        status: statusFilter,
        redirect_type: typeFilter,
        sortBy,
        sortDir,
      });
      const res = await fetch(`/api/redirects?${qs}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } else {
        showToast(data.message || "Failed to load.", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, typeFilter, sortBy, sortDir]);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  // ── sorting ────────────────────────────────────────────────────────────────
  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    else { setSortBy(col); setSortDir("ASC"); }
    setPage(1);
  };

  const SortIcon = ({ col }) =>
    sortBy === col
      ? <span className="ml-1 text-blue-600">{sortDir === "ASC" ? "▲" : "▼"}</span>
      : <span className="ml-1 text-gray-300">↕</span>;

  // ── form helpers ───────────────────────────────────────────────────────────
  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setForm(INITIAL_FORM);
    setModalMode("create");
  };

  const openEdit = (row) => {
    setForm({
      id: row.id,
      source_url: row.source_url || "",
      redirect_url: row.redirect_url || "",
      redirect_type: row.redirect_type,
      status: String(row.status),
      note: row.note || "",
    });
    setModalMode("edit");
  };

  const closeModal = () => { setModalMode(null); setConfirmOpen(false); };

  // ── validate before confirm ────────────────────────────────────────────────
  const handleSaveClick = () => {
    if (!form.source_url.trim()) {
      showToast("Source URL is required.", "error"); return;
    }
    if (needsDest(Number(form.redirect_type)) && !form.redirect_url.trim()) {
      showToast("Redirect URL is required for 301/302.", "error"); return;
    }
    setConfirmOpen(true);
  };

  // ── submit ─────────────────────────────────────────────────────────────────
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
          // clear dest for 410/404
          redirect_url: needsDest(Number(form.redirect_type))
            ? form.redirect_url
            : "",
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        closeModal();
        fetchRows();
      } else {
        showToast(data.message || "Failed.", "error");
        setConfirmOpen(false);
      }
    } catch (e) {
      showToast(e.message, "error");
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const confirmDelete = (row) => setDeleteTarget(row);

  const doDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/redirects?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast("Redirect deleted.");
        setDeleteTarget(null);
        if (rows.length === 1 && page > 1) setPage((p) => p - 1);
        else fetchRows();
      } else {
        showToast(data.message || "Delete failed.", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── pagination ─────────────────────────────────────────────────────────────
  const pageNums = () => {
    const span = 2;
    const arr = [];
    for (
      let i = Math.max(1, page - span);
      i <= Math.min(totalPages, page + span);
      i++
    ) arr.push(i);
    return arr;
  };

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // ── clear filters ──────────────────────────────────────────────────────────
  const clearFilters = () => {
    setSearchInput(""); setSearch("");
    setStatusFilter(""); setTypeFilter("");
    setSortBy("id"); setSortDir("DESC");
    setPage(1);
  };

  // ── type badge ─────────────────────────────────────────────────────────────
  const TypeBadge = ({ type }) => {
    const t = TYPE_MAP[type];
    if (!t) return <span className="text-gray-400 text-xs">{type}</span>;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${t.color}`}>
        {t.value}
      </span>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Redirect Manager</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage 301, 302, 410 and 404 rules for your URLs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
            {total} rules
          </span>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            + New Redirect
          </button>
        </div>
      </div>

      {/* Type legend */}
      <div className="flex flex-wrap gap-2 mb-4">
        {REDIRECT_TYPES.map((t) => (
          <span key={t.value} className={`px-3 py-1 rounded-full text-xs font-medium ${t.color}`}>
            {t.label}
          </span>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-end shadow-sm">
        <div className="flex-1 min-w-[220px]">
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Search (source, destination, note)
          </label>
          <input
            className="border w-full p-2 rounded-lg text-sm"
            placeholder="e.g. /old-page"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
          <select
            className="border p-2 rounded-lg text-sm"
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">All types</option>
            {REDIRECT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            className="border p-2 rounded-lg text-sm"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All</option>
            <option value="1">Active</option>
            <option value="0">Disabled</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Per page</label>
          <select
            className="border p-2 rounded-lg text-sm"
            value={limit}
            onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <button
          onClick={clearFilters}
          className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border rounded-xl shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left cursor-pointer select-none w-16"
                onClick={() => toggleSort("id")}>
                ID <SortIcon col="id" />
              </th>
              <th className="px-4 py-3 text-left cursor-pointer select-none"
                onClick={() => toggleSort("source_url")}>
                Source URL <SortIcon col="source_url" />
              </th>
              <th className="px-4 py-3 text-left cursor-pointer select-none"
                onClick={() => toggleSort("redirect_url")}>
                Destination <SortIcon col="redirect_url" />
              </th>
              <th className="px-4 py-3 text-left cursor-pointer select-none w-24"
                onClick={() => toggleSort("redirect_type")}>
                Type <SortIcon col="redirect_type" />
              </th>
              <th className="px-4 py-3 text-left w-24">Status</th>
              <th className="px-4 py-3 text-left">Note</th>
              <th className="px-4 py-3 text-left w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-400">
                  No redirect rules found.{" "}
                  <button onClick={openCreate} className="text-blue-600 hover:underline">
                    Create one
                  </button>
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-500">{row.id}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-800 max-w-[200px] truncate">
                    {row.source_url}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[200px] truncate">
                    {row.redirect_url || (
                      <span className="text-gray-300 font-sans">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge type={row.redirect_type} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      String(row.status) === "1"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {String(row.status) === "1" ? "Active" : "Off"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-[160px] truncate">
                    {row.note || <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(row)}
                        className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => confirmDelete(row)}
                        className="px-2.5 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs hover:bg-red-100"
                      >
                        Del
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
        <p className="text-sm text-gray-500">Showing {from}–{to} of {total}</p>
        <div className="flex items-center gap-1">
          <button disabled={page <= 1} onClick={() => setPage(1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">«</button>
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">Prev</button>
          {pageNums().map((n) => (
            <button key={n} onClick={() => setPage(n)}
              className={`px-3 py-1.5 border rounded-lg text-sm ${n === page ? "bg-blue-600 text-white border-blue-600" : ""}`}>
              {n}
            </button>
          ))}
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">Next</button>
          <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="px-3 py-1.5 border rounded-lg text-sm disabled:opacity-40">»</button>
        </div>
      </div>

      {/* ── Create / Edit Modal ──────────────────────────────────────────── */}
      {modalMode && (
        <div
          className="fixed inset-0 bg-black/50 flex items-start justify-center z-40 p-4 overflow-y-auto"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
            {/* header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-bold">
                {modalMode === "create" ? "New Redirect Rule" : `Edit Rule #${form.id}`}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Source URL */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">
                  Source URL <span className="text-red-500">*</span>
                </label>
                <input
                  className="border w-full p-2 rounded-lg font-mono text-sm"
                  placeholder="/old-page-url"
                  value={form.source_url}
                  onChange={(e) => setField("source_url", e.target.value)}
                />
                <p className="text-xs text-gray-400 mt-0.5">
                  The URL that visitors currently hit. Use a relative path like <code>/gurgaon</code> or a full URL.
                </p>
              </div>

              {/* Redirect Type */}
              <div>
                <label className="block text-sm font-medium mb-1">Redirect Type <span className="text-red-500">*</span></label>
                <select
                  className="border w-full p-2 rounded-lg text-sm"
                  value={form.redirect_type}
                  onChange={(e) => setField("redirect_type", parseInt(e.target.value))}
                >
                  {REDIRECT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  className="border w-full p-2 rounded-lg text-sm"
                  value={form.status}
                  onChange={(e) => setField("status", e.target.value)}
                >
                  <option value="1">Active</option>
                  <option value="0">Disabled</option>
                </select>
              </div>

              {/* Destination URL — only shown for 301/302 */}
              {needsDest(Number(form.redirect_type)) && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    Destination URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    className="border w-full p-2 rounded-lg font-mono text-sm"
                    placeholder="/new-page-url  or  https://example.com/page"
                    value={form.redirect_url}
                    onChange={(e) => setField("redirect_url", e.target.value)}
                  />
                  <p className="text-xs text-gray-400 mt-0.5">
                    Where should visitors be sent? Can be relative or absolute.
                  </p>
                </div>
              )}

              {/* 410/404 info box */}
              {!needsDest(Number(form.redirect_type)) && (
                <div className="sm:col-span-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                  {Number(form.redirect_type) === 410
                    ? "410 Gone — no destination needed. Visitors see your 410 page. Google will drop this URL from its index."
                    : "404 Not Found — no destination needed. Visitors see your standard 404 page."}
                </div>
              )}

              {/* Note */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Internal Note</label>
                <input
                  className="border w-full p-2 rounded-lg text-sm"
                  placeholder="e.g. Old city page removed after restructure"
                  value={form.note}
                  onChange={(e) => setField("note", e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t px-6 py-4">
              <button onClick={closeModal} className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
                Cancel
              </button>
              <button onClick={handleSaveClick} className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
                {modalMode === "create" ? "Create Rule" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Save Confirm ─────────────────────────────────────────────────── */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold mb-2">
              {modalMode === "create" ? "Create this redirect?" : "Save changes?"}
            </h3>
            <div className="text-left bg-gray-50 rounded-lg p-3 mb-5 text-xs font-mono space-y-1">
              <div><span className="text-gray-400">From: </span>{form.source_url || "—"}</div>
              {needsDest(Number(form.redirect_type)) && (
                <div><span className="text-gray-400">To:   </span>{form.redirect_url || "—"}</div>
              )}
              <div>
                <span className="text-gray-400">Type: </span>
                {TYPE_MAP[Number(form.redirect_type)]?.label || form.redirect_type}
              </div>
            </div>
            <div className="flex gap-3">
              <button disabled={saving} onClick={() => setConfirmOpen(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">
                Go back
              </button>
              <button disabled={saving} onClick={doSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 text-sm font-medium">
                {saving ? "Saving..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirm ───────────────────────────────────────────────── */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
            <h3 className="text-lg font-semibold mb-2 text-red-600">Delete this rule?</h3>
            <p className="text-sm text-gray-500 mb-1">
              Source: <code className="bg-gray-100 px-1 rounded">{deleteTarget.source_url}</code>
            </p>
            <p className="text-xs text-gray-400 mb-6">
              This cannot be undone. The URL will no longer redirect.
            </p>
            <div className="flex gap-3">
              <button disabled={saving} onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm">
                Cancel
              </button>
              <button disabled={saving} onClick={doDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 text-sm font-medium">
                {saving ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-sm ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}