"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button, ConfirmDialog, Dash, PageHead, Pagination, SortHeader, TableState, Toast } from "../components/AdminUI";
import Link from "next/link";
import { Trash2, Plus } from "lucide-react";

const LIMIT_OPTIONS = [10, 25, 50, 100];

const isActive = (s) => {
  const v = String(s ?? "").trim().toLowerCase();
  return v === "1" || v === "active" || v === "true" || v === "yes";
};

export default function BlogsListPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // query state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [catId, setCatId] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("DESC");

  const [categories, setCategories] = useState([]);

  // delete confirm
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const searchTimer = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetch("/api/admin/blogs?type=categories")
      .then((r) => r.json())
      .then((d) => d.success && setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  // debounce search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        status,
        blog_cat_id: catId,
        sortBy,
        sortDir,
      });
      const res = await fetch(`/api/admin/blogs?${qs.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      } else {
        showToast(data.message || "Failed to load blogs.", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, catId, sortBy, sortDir]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    else {
      setSortBy(col);
      setSortDir("ASC");
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setCatId("");
    setSortBy("id");
    setSortDir("DESC");
    setPage(1);
  };

  const doDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/admin/blogs?id=${deleting.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Blog deleted.");
        setDeleting(null);
        if (rows.length === 1 && page > 1) setPage((p) => p - 1);
        else load();
      } else {
        showToast(data.message || "Delete failed.", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setDeleteBusy(false);
    }
  };

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const sortProps = { sortBy, sortDir, onSort: toggleSort };

  return (
    <div>
      <PageHead
        eyebrow="Content"
        title="Blogs"
        subtitle="Write, publish and manage articles for the public site."
        count={total}
        countLabel="posts"
      />

      {/* Create + Filters */}
      <div className="flex justify-end mb-3">
        <Link href="/admin/blogs/create" className="adm-btn adm-btn-primary adm-btn-sm">
          <Plus size={15} /> New blog post
        </Link>
      </div>
      <div className="bg-white border rounded-xl shadow-sm p-4 mb-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input
          className="border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 sm:col-span-2"
          placeholder="Search title, URL or author…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <select
          className="border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={catId}
          onChange={(e) => {
            setPage(1);
            setCatId(e.target.value);
          }}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr>
                <SortHeader label="ID" col="id" {...sortProps} />
                <SortHeader label="Title" col="blog_title" {...sortProps} />
                <SortHeader label="Category" col="category" sortable={false} />
                <SortHeader label="Author" col="author_name" {...sortProps} />
                <SortHeader label="Status" col="status" {...sortProps} />
                <SortHeader label="Created" col="created_at" {...sortProps} />
                <SortHeader label="Action" col="action" sortable={false} />
              </tr>
            </thead>
            <tbody>
              {loading || rows.length === 0 ? (
                <TableState
                  colSpan={7}
                  loading={loading}
                  emptyTitle="No blogs found"
                  emptyHint="Try a different search, or create your first post."
                />
              ) : (
                rows.map((b) => (
                  <tr key={b.id}>
                    <td className="col-id">{b.id}</td>
                    <td className="col-strong">
                      <span className="adm-truncate" style={{ display: "block" }}>
                        {b.blog_title || "(untitled)"}
                      </span>
                      <span className="col-url">/{b.blog_url}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                      {b.category_name || (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-600">
                      {b.author_name || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          isActive(b.status)
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {isActive(b.status) ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="col-muted">
                      {b.created_at ? String(b.created_at).slice(0, 10) : <Dash />}
                    </td>
                    <td>
                      <div className="adm-rowactions">
                        <Link href={`/admin/blogs/${b.id}/edit`} className="adm-btn adm-btn-ghost adm-btn-sm">
                          Edit
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleting(b)}
                          aria-label="Delete"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        from={from}
        to={to}
        total={total}
        onPage={setPage}
      />

      {/* Delete confirm */}
      {deleting && (
        <ConfirmDialog
          tone="danger"
          title="Delete blog?"
          message={`"${deleting.blog_title || "Untitled"}" (ID ${deleting.id}) will be removed. This can't be undone.`}
          confirmLabel="Yes, delete"
          saving={deleteBusy}
          onCancel={() => setDeleting(null)}
          onConfirm={doDelete}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
