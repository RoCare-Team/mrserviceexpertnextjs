"use client";

import { useEffect, useState, useRef, useCallback } from "react";

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
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [catId, setCatId] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("DESC");

  const [categories, setCategories] = useState([]);
  const [deletingId, setDeletingId] = useState(null);

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

  // debounce search input -> resets to page 1
  const onSearchChange = (val) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      setSearch(val);
    }, 350);
  };

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(col);
      setSortDir("ASC");
    }
    setPage(1);
  };

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete blog "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/blogs?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Blog deleted.");
        // if last item on the page, step back a page
        if (rows.length === 1 && page > 1) setPage((p) => p - 1);
        else load();
      } else {
        showToast(data.message || "Delete failed.", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setDeletingId(null);
    }
  };

  const sortIcon = (col) =>
    sortBy === col ? (sortDir === "ASC" ? "▲" : "▼") : "↕";

  const headerBtn =
    "flex items-center gap-1 text-left font-medium text-gray-600 hover:text-gray-900";

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Blogs</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/blog-categories"
            className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            Categories
          </a>
          <a
            href="/admin/blogs/create"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            + New Blog
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-xl shadow-sm p-4 mb-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input
          className="border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 sm:col-span-2"
          placeholder="Search title, URL or author…"
          defaultValue={search}
          onChange={(e) => onSearchChange(e.target.value)}
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
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 w-16">
                  <button className={headerBtn} onClick={() => toggleSort("id")}>
                    ID <span className="text-xs">{sortIcon("id")}</span>
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    className={headerBtn}
                    onClick={() => toggleSort("blog_title")}
                  >
                    Title <span className="text-xs">{sortIcon("blog_title")}</span>
                  </button>
                </th>
                <th className="px-4 py-3 hidden md:table-cell">Category</th>
                <th className="px-4 py-3 hidden lg:table-cell">
                  <button
                    className={headerBtn}
                    onClick={() => toggleSort("author_name")}
                  >
                    Author{" "}
                    <span className="text-xs">{sortIcon("author_name")}</span>
                  </button>
                </th>
                <th className="px-4 py-3">
                  <button
                    className={headerBtn}
                    onClick={() => toggleSort("status")}
                  >
                    Status <span className="text-xs">{sortIcon("status")}</span>
                  </button>
                </th>
                <th className="px-4 py-3 hidden lg:table-cell">
                  <button
                    className={headerBtn}
                    onClick={() => toggleSort("created_at")}
                  >
                    Created{" "}
                    <span className="text-xs">{sortIcon("created_at")}</span>
                  </button>
                </th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                      Loading…
                    </span>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No blogs found. Try adjusting your filters or{" "}
                    <a
                      href="/admin/blogs/create"
                      className="text-blue-600 hover:underline"
                    >
                      create one
                    </a>
                    .
                  </td>
                </tr>
              ) : (
                rows.map((b) => (
                  <tr key={b.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{b.id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800 line-clamp-1">
                        {b.blog_title || "(untitled)"}
                      </div>
                      <div className="text-xs text-gray-400 line-clamp-1">
                        /{b.blog_url}
                      </div>
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
                    <td className="px-4 py-3 hidden lg:table-cell text-gray-500 text-xs">
                      {b.created_at
                        ? String(b.created_at).slice(0, 10)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/admin/blogs/${b.id}/edit`}
                          className="text-blue-600 hover:underline text-xs font-medium"
                        >
                          Edit
                        </a>
                        <button
                          onClick={() => handleDelete(b.id, b.blog_title)}
                          disabled={deletingId === b.id}
                          className="text-red-500 hover:underline text-xs font-medium disabled:opacity-50"
                        >
                          {deletingId === b.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer */}
        <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-t bg-gray-50 text-sm">
          <div className="flex items-center gap-2 text-gray-500">
            <span>
              {from}–{to} of {total}
            </span>
            <select
              className="border border-gray-300 rounded-lg p-1.5 text-xs focus:outline-none"
              value={limit}
              onChange={(e) => {
                setPage(1);
                setLimit(parseInt(e.target.value, 10));
              }}
            >
              {LIMIT_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n} / page
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(1)}
              disabled={page <= 1}
              className="px-2.5 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-white"
            >
              «
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-white"
            >
              ‹
            </button>
            <span className="px-3 text-gray-600">
              Page {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-white"
            >
              ›
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={page >= totalPages}
              className="px-2.5 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-white"
            >
              »
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}