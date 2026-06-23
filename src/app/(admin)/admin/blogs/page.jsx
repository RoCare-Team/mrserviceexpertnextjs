"use client";

<<<<<<< HEAD
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import TipTapEditorWithSEO from "@/app/(admin)/admin/components/TipTapEditorWithSEO";
import {
  PageHead,
  Field,
  SearchInput,
  Input,
  Select,
  Textarea,
  Button,
  SortHeader,
  Badge,
  Dash,
  EditButton,
  TableState,
  Pagination,
  Modal,
  ConfirmDialog,
  Toast,
} from "@/app/(admin)/admin/components/AdminUI";

/* ---------------------------------------------------------------------
   NOTE: No API wired yet. This page runs on in-memory sample data so the
   design and interactions can be reviewed. Replace SEED + the doSave /
   doDelete handlers with real /api/admin/blogs calls when ready.
   --------------------------------------------------------------------- */
const SEED = [
  { id: 7, title: "How often should you service your AC?", slug: "ac-service-frequency", author: "Team MSE", category: "AC Care", status: "1", published_at: "2026-05-28" },
  { id: 6, title: "RO vs UV water purifier: which is right for you?", slug: "ro-vs-uv-purifier", author: "Ankit S.", category: "Water Care", status: "1", published_at: "2026-05-14" },
  { id: 5, title: "5 signs your refrigerator needs a technician", slug: "fridge-warning-signs", author: "Team MSE", category: "Appliances", status: "1", published_at: "2026-04-30" },
  { id: 4, title: "Monsoon checklist for home appliances", slug: "monsoon-appliance-checklist", author: "Priya R.", category: "Seasonal", status: "0", published_at: "2026-04-09" },
  { id: 3, title: "Washing machine drum cleaning guide", slug: "washing-machine-drum-cleaning", author: "Team MSE", category: "Appliances", status: "1", published_at: "2026-03-22" },
  { id: 2, title: "Cut your summer electricity bill with these AC tips", slug: "ac-electricity-saving-tips", author: "Ankit S.", category: "AC Care", status: "0", published_at: "2026-03-05" },
  { id: 1, title: "Booking a technician: what to expect", slug: "technician-booking-guide", author: "Team MSE", category: "Guides", status: "1", published_at: "2026-02-18" },
];

const blankBlog = () => ({
  id: null,
  title: "",
  slug: "",
  author: "",
  category: "",
  status: "1",
  published_at: new Date().toISOString().slice(0, 10),
  excerpt: "",
  image: "",
  meta_title: "",
  meta_keywords: "",
  meta_description: "",
  content: "",
});

export default function BlogsPage() {
  const [blogs, setBlogs] = useState(SEED);

  // filters / sorting / pagination (client-side for now)
  const [searchInput, setSearchInput] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("published_at");
  const [sortDir, setSortDir] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // edit / confirm / toast
  const [editing, setEditing] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    else {
=======
import { useEffect, useState, useRef, useCallback } from "react";

const LIMIT_OPTIONS = [10, 25, 50, 100];

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
>>>>>>> c0e11381e7142232c414614be30007ed5ab6fc1d
      setSortBy(col);
      setSortDir("ASC");
    }
    setPage(1);
  };

<<<<<<< HEAD
  const clearFilters = () => {
    setSearchInput("");
    setStatus("");
    setSortBy("published_at");
    setSortDir("DESC");
    setPage(1);
  };

  // derive the visible slice
  const filtered = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    let rows = blogs.filter((b) => {
      const matchesQ = !q || b.title.toLowerCase().includes(q) || b.slug.toLowerCase().includes(q);
      const matchesStatus = status === "" || String(b.status) === status;
      return matchesQ && matchesStatus;
    });
    rows = [...rows].sort((a, b) => {
      const va = a[sortBy] ?? "";
      const vb = b[sortBy] ?? "";
      const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === "ASC" ? cmp : -cmp;
    });
    return rows;
  }, [blogs, searchInput, status, sortBy, sortDir]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * limit + 1;
  const to = Math.min(safePage * limit, total);
  const pageRows = filtered.slice((safePage - 1) * limit, safePage * limit);

  const openNew = () => setEditing(blankBlog());
  const openEdit = (b) => setEditing({ ...b });
  const setField = (field, value) => setEditing((b) => ({ ...b, [field]: value }));

  // in-memory save (swap for POST/PUT later)
  const doSave = () => {
    setSaving(true);
    setTimeout(() => {
      setBlogs((list) => {
        if (editing.id == null) {
          const id = (list.reduce((m, x) => Math.max(m, x.id), 0) || 0) + 1;
          return [{ ...editing, id }, ...list];
        }
        return list.map((x) => (x.id === editing.id ? { ...editing } : x));
      });
      showToast(editing.id == null ? "Blog created" : "Blog updated");
      setSaving(false);
      setConfirmOpen(false);
      setEditing(null);
    }, 350);
  };

  const doDelete = () => {
    setSaving(true);
    setTimeout(() => {
      setBlogs((list) => list.filter((x) => x.id !== deleting.id));
      showToast("Blog deleted");
      setSaving(false);
      setDeleting(null);
    }, 300);
  };

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

      {/* Filters */}
      <div className="adm-toolbar">
        <Field label="Search by title or slug" grow>
          <SearchInput
            placeholder="e.g. ac service"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
          />
        </Field>

        <Field label="Status">
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            <option value="1">Published</option>
            <option value="0">Draft</option>
          </Select>
        </Field>

        <Field label="Per page">
          <Select
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setPage(1);
            }}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </Select>
        </Field>

        <Button onClick={clearFilters}>Clear</Button>
        <Button variant="primary" onClick={openNew}>
          <Plus size={17} /> New blog
        </Button>
      </div>

      {/* Table */}
      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr>
                <SortHeader label="ID" col="id" {...sortProps} />
                <SortHeader label="Title" col="title" {...sortProps} />
                <SortHeader label="Author" col="author" {...sortProps} />
                <SortHeader label="Category" col="category" sortable={false} />
                <SortHeader label="Published" col="published_at" {...sortProps} />
                <SortHeader label="Status" col="status" sortable={false} />
                <SortHeader label="Action" col="action" sortable={false} />
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <TableState
                  colSpan={7}
                  loading={false}
                  emptyTitle="No blogs found"
                  emptyHint="Try a different search, or create your first post."
                />
              ) : (
                pageRows.map((b) => (
                  <tr key={b.id}>
                    <td className="col-id">{b.id}</td>
                    <td className="col-strong">
                      <span className="adm-truncate" style={{ display: "block" }}>{b.title}</span>
                      <span className="col-url">/{b.slug}</span>
                    </td>
                    <td className="col-muted">{b.author || <Dash />}</td>
                    <td className="col-muted">{b.category || <Dash />}</td>
                    <td className="col-muted">{b.published_at || <Dash />}</td>
                    <td>
                      <Badge tone={String(b.status) === "1" ? "ok" : "off"}>
                        {String(b.status) === "1" ? "Published" : "Draft"}
                      </Badge>
                    </td>
                    <td>
                      <div className="adm-rowactions">
                        <EditButton onClick={() => openEdit(b)} />
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(b)} aria-label="Delete">
                          <Trash2 size={15} />
                        </Button>
=======
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
          <option value="1">Active</option>
          <option value="0">Inactive</option>
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
                          String(b.status) === "1"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {String(b.status) === "1" ? "Active" : "Inactive"}
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
>>>>>>> c0e11381e7142232c414614be30007ed5ab6fc1d
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
<<<<<<< HEAD
      </div>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        from={from}
        to={to}
        total={total}
        onPage={setPage}
      />

      {/* Edit / new modal */}
      {editing && (
        <Modal
          title={editing.id == null ? "New blog" : `Edit ${editing.title || "blog"}`}
          id={editing.id == null ? undefined : editing.id}
          size="wide"
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => setConfirmOpen(true)}>
                {editing.id == null ? "Create blog" : "Save changes"}
              </Button>
            </>
          }
        >
          <div className="adm-formgrid">
            <Field label="Title" className="full">
              <Input value={editing.title || ""} onChange={(e) => setField("title", e.target.value)} placeholder="Post title" />
            </Field>
            <Field label="Slug">
              <Input value={editing.slug || ""} onChange={(e) => setField("slug", e.target.value)} placeholder="post-url-slug" />
            </Field>
            <Field label="Author">
              <Input value={editing.author || ""} onChange={(e) => setField("author", e.target.value)} />
            </Field>
            <Field label="Category">
              <Input value={editing.category || ""} onChange={(e) => setField("category", e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={String(editing.status)} onChange={(e) => setField("status", e.target.value)}>
                <option value="1">Published</option>
                <option value="0">Draft</option>
              </Select>
            </Field>
            <Field label="Publish date">
              <Input type="date" value={editing.published_at || ""} onChange={(e) => setField("published_at", e.target.value)} />
            </Field>
            <Field label="Featured image URL">
              <Input value={editing.image || ""} onChange={(e) => setField("image", e.target.value)} placeholder="https://…" />
            </Field>
            <Field label="Excerpt" className="full">
              <Textarea rows={2} value={editing.excerpt || ""} onChange={(e) => setField("excerpt", e.target.value)} placeholder="Short summary shown in listings" />
            </Field>
            <Field label="Meta title" className="full">
              <Input value={editing.meta_title || ""} onChange={(e) => setField("meta_title", e.target.value)} />
            </Field>
            <Field label="Meta keywords" className="full">
              <Textarea rows={2} value={editing.meta_keywords || ""} onChange={(e) => setField("meta_keywords", e.target.value)} />
            </Field>
            <Field label="Meta description" className="full">
              <Textarea rows={3} value={editing.meta_description || ""} onChange={(e) => setField("meta_description", e.target.value)} />
            </Field>
            <Field label="Content" className="full">
              <TipTapEditorWithSEO content={editing.content || ""} onChange={(html) => setField("content", html)} />
            </Field>
          </div>
        </Modal>
      )}

      {/* Save confirm */}
      {confirmOpen && editing && (
        <ConfirmDialog
          title={editing.id == null ? "Create blog?" : "Save changes?"}
          message={
            editing.id == null
              ? `Publish/save "${editing.title || "Untitled"}" to the blog list.`
              : `Update "${editing.title}" (ID ${editing.id})? This overwrites the existing post.`
          }
          confirmLabel={editing.id == null ? "Yes, create" : "Yes, save"}
          saving={saving}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={doSave}
        />
      )}

      {/* Delete confirm */}
      {deleting && (
        <ConfirmDialog
          tone="danger"
          title="Delete blog?"
          message={`"${deleting.title}" (ID ${deleting.id}) will be removed. This can't be undone.`}
          confirmLabel="Yes, delete"
          saving={saving}
          onCancel={() => setDeleting(null)}
          onConfirm={doDelete}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
=======

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
>>>>>>> c0e11381e7142232c414614be30007ed5ab6fc1d
