"use client";

import { useEffect, useState, useRef, useCallback } from "react";

const EMPTY = {
  name: "",
  category_url: "",
  contant: "",
  meta_title: "",
  canonical: "",
  meta_description: "",
  meta_keywords: "",
  robots: "",
};

export default function BlogCategoriesPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");

  // modal
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [urlChecking, setUrlChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const searchTimer = useRef(null);
  const urlTimer = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
      });
      const res = await fetch(`/api/admin/blog_category?${qs.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.data || []);
        setTotalPages(data.totalPages || 1);
        setTotal(data.total || 0);
      } else {
        showToast(data.message || "Failed to load categories.", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search]);

  useEffect(() => {
    load();
  }, [load]);

  const onSearchChange = (val) => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      setSearch(val);
    }, 350);
  };

  // ── modal helpers ──
  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY);
    setErrors({});
    setOpen(true);
  };

  const openEdit = async (id) => {
    setEditId(id);
    setErrors({});
    setForm(EMPTY);
    setOpen(true);
    try {
      const res = await fetch(`/api/admin/blog_category?id=${id}`);
      const data = await res.json();
      if (data.success && data.category) {
        const c = data.category;
        setForm({
          ...EMPTY,
          ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, c[k] ?? ""])),
        });
      }
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const checkUrl = (value) => {
    clearTimeout(urlTimer.current);
    if (!value.trim()) {
      setUrlChecking(false);
      setErrors((e) => ({ ...e, category_url: undefined }));
      return;
    }
    setUrlChecking(true);
    urlTimer.current = setTimeout(async () => {
      try {
        const exclude = editId ? `&excludeId=${editId}` : "";
        const res = await fetch(
          `/api/admin/blog_category?type=check_duplicate&value=${encodeURIComponent(
            value.trim()
          )}${exclude}`
        );
        const data = await res.json();
        setErrors((e) => ({
          ...e,
          category_url: data.exists
            ? "This category URL is already taken."
            : undefined,
        }));
      } catch {
        /* ignore */
      } finally {
        setUrlChecking(false);
      }
    }, 450);
  };

  const handleSave = async () => {
    const e = {};
    if (!form.name.trim()) e.name = "Category name is required.";
    if (!form.category_url.trim()) e.category_url = "Category URL is required.";
    if (errors.category_url) e.category_url = errors.category_url;
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/blog_category", {
        method: editId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editId ? { ...form, id: editId } : form),
      });
      const data = await res.json();
      if (data.success) {
        showToast(editId ? "Category updated." : "Category created.");
        setOpen(false);
        load();
      } else if (data.errors) {
        setErrors(data.errors);
        showToast(data.message || "Please fix the errors.", "error");
      } else {
        showToast(data.message || "Save failed.", "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/blog_category?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast("Category deleted.");
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

  const inputClass = (field) =>
    `border rounded-lg p-2.5 text-sm w-full focus:outline-none focus:ring-2 transition ${
      errors[field]
        ? "border-red-400 focus:ring-red-200"
        : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
    }`;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Blog Categories</h1>
          <p className="text-sm text-gray-500 mt-1">{total} total</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/admin/blogs"
            className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            ← Blogs
          </a>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
          >
            + New Category
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-4 mb-4">
        <input
          className="border border-gray-300 rounded-lg p-2.5 text-sm w-full max-w-md focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
          placeholder="Search name or URL…"
          defaultValue={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-600">
                <th className="px-4 py-3 w-16">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3 hidden sm:table-cell">URL</th>
                <th className="px-4 py-3 hidden md:table-cell">Blogs</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                      Loading…
                    </span>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    No categories yet.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">{c.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {c.name}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-400 text-xs">
                      /{c.category_url}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                      {c.blog_count ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(c.id)}
                          className="text-blue-600 hover:underline text-xs font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(c.id, c.name)}
                          disabled={deletingId === c.id}
                          className="text-red-500 hover:underline text-xs font-medium disabled:opacity-50"
                        >
                          {deletingId === c.id ? "Deleting…" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50 text-sm">
          <span className="text-gray-500">
            Page {page} / {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-2.5 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-white"
            >
              ‹ Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-2.5 py-1.5 border rounded-lg disabled:opacity-40 hover:bg-white"
            >
              Next ›
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">
                {editId ? "Edit Category" : "New Category"}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={inputClass("name")}
                    placeholder="e.g. Water Purifier"
                    value={form.name}
                    onChange={(e) => setField("name", e.target.value)}
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500">⚠ {errors.name}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">
                    URL slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    className={inputClass("category_url")}
                    placeholder="e.g. water-purifier"
                    value={form.category_url}
                    onChange={(e) => {
                      const slug = e.target.value
                        .toLowerCase()
                        .replace(/\s+/g, "-")
                        .replace(/[^a-z0-9-]/g, "");
                      setField("category_url", slug);
                      checkUrl(slug);
                    }}
                  />
                  {urlChecking ? (
                    <p className="text-xs text-gray-400">Checking…</p>
                  ) : (
                    errors.category_url && (
                      <p className="text-xs text-red-500">
                        ⚠ {errors.category_url}
                      </p>
                    )
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">
                  Content (contant)
                </label>
                <textarea
                  rows={3}
                  className={inputClass("contant")}
                  placeholder="Optional category description / HTML"
                  value={form.contant}
                  onChange={(e) => setField("contant", e.target.value)}
                />
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                  SEO / Meta
                </p>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">
                        Meta Title
                      </label>
                      <input
                        className={inputClass("meta_title")}
                        value={form.meta_title}
                        onChange={(e) => setField("meta_title", e.target.value)}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">
                        Canonical
                      </label>
                      <input
                        className={inputClass("canonical")}
                        value={form.canonical}
                        onChange={(e) => setField("canonical", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">
                      Meta Description
                    </label>
                    <textarea
                      rows={2}
                      className={inputClass("meta_description")}
                      value={form.meta_description}
                      onChange={(e) =>
                        setField("meta_description", e.target.value)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">
                        Meta Keywords
                      </label>
                      <input
                        className={inputClass("meta_keywords")}
                        value={form.meta_keywords}
                        onChange={(e) =>
                          setField("meta_keywords", e.target.value)
                        }
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-gray-700">
                        Robots
                      </label>
                      <input
                        className={inputClass("robots")}
                        placeholder="index, follow"
                        value={form.robots}
                        onChange={(e) => setField("robots", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t sticky bottom-0 bg-white">
              <button
                onClick={() => setOpen(false)}
                className="px-5 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || urlChecking}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2"
              >
                {saving && (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                )}
                {editId ? "Save Changes" : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
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