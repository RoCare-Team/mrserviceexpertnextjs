"use client";

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
      setSortBy(col);
      setSortDir("ASC");
    }
    setPage(1);
  };

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
