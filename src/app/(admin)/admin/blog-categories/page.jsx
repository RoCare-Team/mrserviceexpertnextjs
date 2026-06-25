"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Plus, Trash2, ArrowLeft } from "lucide-react";
import {
  PageHead,
  Field,
  FieldNote,
  SectionTitle,
  SearchInput,
  Input,
  Textarea,
  Button,
  Dash,
  TableState,
  Pagination,
  Modal,
  ConfirmDialog,
  Toast,
} from "@/app/(admin)/admin/components/AdminUI";

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
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  // modal
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [urlChecking, setUrlChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  // delete confirm
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

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

  // debounce search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput]);

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
          `/api/admin/blog_category?type=check_duplicate&value=${encodeURIComponent(value.trim())}${exclude}`
        );
        const data = await res.json();
        setErrors((e) => ({
          ...e,
          category_url: data.exists ? "This category URL is already taken." : undefined,
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

  const doDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      const res = await fetch(`/api/admin/blog_category?id=${deleting.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        showToast("Category deleted.");
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

  return (
    <div>
      <PageHead
        eyebrow="Content"
        title="Blog Categories"
        subtitle="Organise blog posts into categories with their own SEO meta."
        count={total}
        countLabel="categories"
      />

      {/* Filters */}
      <div className="adm-toolbar">
        <Field label="Search by name or URL" grow>
          <SearchInput
            placeholder="e.g. water purifier"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </Field>

        <Link href="/admin/blogs" className="adm-btn">
          <ArrowLeft size={15} /> Blogs
        </Link>
        <Button variant="primary" onClick={openCreate}>
          <Plus size={17} /> New category
        </Button>
      </div>

      {/* Table */}
      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>URL</th>
                <th>Blogs</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading || rows.length === 0 ? (
                <TableState
                  colSpan={5}
                  loading={loading}
                  emptyTitle="No categories yet"
                  emptyHint="Create your first blog category to get started."
                />
              ) : (
                rows.map((c) => (
                  <tr key={c.id}>
                    <td className="col-id">{c.id}</td>
                    <td className="col-strong">{c.name}</td>
                    <td className="col-url">/{c.category_url}</td>
                    <td className="col-muted">{c.blog_count ?? 0}</td>
                    <td>
                      <div className="adm-rowactions">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(c.id)}>
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleting(c)}
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

      {/* Create / edit modal */}
      {open && (
        <Modal
          title={editId ? "Edit category" : "New category"}
          id={editId ?? undefined}
          onClose={() => setOpen(false)}
          footer={
            <>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} disabled={saving || urlChecking}>
                {saving ? "Saving…" : editId ? "Save changes" : "Create category"}
              </Button>
            </>
          }
        >
          <div className="adm-formgrid">
            <Field label="Name *">
              <Input
                className={errors.name ? "err" : ""}
                placeholder="e.g. Water Purifier"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
              />
              {errors.name && <FieldNote tone="err">{errors.name}</FieldNote>}
            </Field>

            <Field label="URL slug *">
              <Input
                className={errors.category_url ? "err" : ""}
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
                <FieldNote tone="checking">Checking availability…</FieldNote>
              ) : (
                errors.category_url && <FieldNote tone="err">{errors.category_url}</FieldNote>
              )}
            </Field>

            <Field label="Content (contant)" className="full">
              <Textarea
                rows={3}
                placeholder="Optional category description / HTML"
                value={form.contant}
                onChange={(e) => setField("contant", e.target.value)}
              />
            </Field>

            <div className="full" style={{ borderTop: "1px solid var(--adm-border)", paddingTop: 16, marginTop: 4 }}>
              <SectionTitle>SEO / Meta</SectionTitle>
            </div>

            <Field label="Meta title">
              <Input value={form.meta_title} onChange={(e) => setField("meta_title", e.target.value)} />
            </Field>
            <Field label="Canonical">
              <Input value={form.canonical} onChange={(e) => setField("canonical", e.target.value)} />
            </Field>
            <Field label="Meta description" className="full">
              <Textarea
                rows={2}
                value={form.meta_description}
                onChange={(e) => setField("meta_description", e.target.value)}
              />
            </Field>
            <Field label="Meta keywords">
              <Input
                value={form.meta_keywords}
                onChange={(e) => setField("meta_keywords", e.target.value)}
              />
            </Field>
            <Field label="Robots">
              <Input
                placeholder="index, follow"
                value={form.robots}
                onChange={(e) => setField("robots", e.target.value)}
              />
            </Field>
          </div>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleting && (
        <ConfirmDialog
          tone="danger"
          title="Delete category?"
          message={`"${deleting.name}" (ID ${deleting.id}) will be removed. This can't be undone.`}
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
