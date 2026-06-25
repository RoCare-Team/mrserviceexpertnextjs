"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
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
  StatusBadge,
  Dash,
  EditButton,
  TableState,
  Pagination,
  Modal,
  ConfirmDialog,
  Toast,
} from "@/app/(admin)/admin/components/AdminUI";

export default function CategoryEditPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  // sorting
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("DESC");

  // edit modal + confirm
  const [editing, setEditing] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        status,
        sortBy,
        sortDir,
      });
      const res = await fetch(`/api/admin/edit_category?${qs.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      } else {
        showToast(data.message || "Failed to load", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, sortBy, sortDir]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const toggleSort = (col) => {
    if (sortBy === col) {
      setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortBy(col);
      setSortDir("ASC");
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setSortBy("id");
    setSortDir("DESC");
    setPage(1);
  };

  const openEdit = (cat) => setEditing({ ...cat });
  const setField = (field, value) => setEditing((c) => ({ ...c, [field]: value }));

  const doUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/edit_category", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Updated successfully");
        setConfirmOpen(false);
        setEditing(null);
        fetchCategories();
      } else {
        showToast(data.message || "Update failed", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const sortProps = { sortBy, sortDir, onSort: toggleSort };

  return (
    <div>
      <PageHead
        eyebrow="Catalogue"
        title="Categories"
        subtitle="Organise the service categories that group your brands."
        count={total}
        countLabel="categories"
      />

      {/* Filters */}
      <div className="adm-toolbar">
        <Field label="Search by name or URL" grow>
          <SearchInput
            placeholder="e.g. ac service"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
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
            <option value="1">Active</option>
            <option value="0">Inactive</option>
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
        <Link href="/admin/create_category" className="adm-btn adm-btn-primary">
          <Plus size={17} /> New category
        </Link>
      </div>

      {/* Table */}
      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr>
                <SortHeader label="ID" col="id" {...sortProps} />
                <SortHeader label="Category name" col="category_name" {...sortProps} />
                <SortHeader label="URL" col="category_url" {...sortProps} />
                <SortHeader label="Phone" col="phone" sortable={false} />
                <SortHeader label="Status" col="status" sortable={false} />
                <SortHeader label="Action" col="action" sortable={false} />
              </tr>
            </thead>
            <tbody>
              {loading || categories.length === 0 ? (
                <TableState
                  colSpan={6}
                  loading={loading}
                  emptyTitle="No categories found"
                  emptyHint="Try a different search or clear the filters."
                />
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id}>
                    <td className="col-id">{cat.id}</td>
                    <td className="col-strong">{cat.category_name}</td>
                    <td className="col-url">{cat.category_url}</td>
                    <td className="col-muted">{cat.phone || <Dash />}</td>
                    <td>
                      <StatusBadge status={cat.status} />
                    </td>
                    <td>
                      <EditButton onClick={() => openEdit(cat)} />
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

      {/* Edit Modal */}
      {editing && (
        <Modal
          title={`Edit ${editing.category_name}`}
          id={editing.id}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => setConfirmOpen(true)}>
                Save changes
              </Button>
            </>
          }
        >
          <div className="adm-formgrid">
            <Field label="Category name">
              <Input value={editing.category_name || ""} onChange={(e) => setField("category_name", e.target.value)} />
            </Field>
            <Field label="Category URL">
              <Input value={editing.category_url || ""} onChange={(e) => setField("category_url", e.target.value)} />
            </Field>
            <Field label="Phone">
              <Input value={editing.phone || ""} onChange={(e) => setField("phone", e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={String(editing.status)} onChange={(e) => setField("status", e.target.value)}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </Select>
            </Field>
            <Field label="Banner">
              <Input value={editing.banner || ""} onChange={(e) => setField("banner", e.target.value)} />
            </Field>
            <Field label="Icon">
              <Input value={editing.icon || ""} onChange={(e) => setField("icon", e.target.value)} />
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
            <Field label="Category content" className="full">
              <TipTapEditorWithSEO
                content={editing.category_content || ""}
                onChange={(html) => setField("category_content", html)}
              />
            </Field>
          </div>
        </Modal>
      )}

      {/* Confirm dialog */}
      {confirmOpen && editing && (
        <ConfirmDialog
          title="Save changes?"
          message={`Update ${editing.category_name} (ID ${editing.id})? This overwrites the existing record.`}
          saving={saving}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={doUpdate}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
