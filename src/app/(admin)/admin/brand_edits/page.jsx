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

export default function BrandEditPage() {
  const [brands, setBrands] = useState([]);
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
  const [categoryId, setCategoryId] = useState("");
  const [categories, setCategories] = useState([]);

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

  // load categories once (filter dropdown + edit form)
  useEffect(() => {
    fetch("/api/admin/edit_brand?type=categories")
      .then((r) => r.json())
      .then((d) => d.success && setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const fetchBrands = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        status,
        category_id: categoryId,
        sortBy,
        sortDir,
      });
      const res = await fetch(`/api/admin/edit_brand?${qs.toString()}`);
      const data = await res.json();
      if (data.success) {
        setBrands(data.data);
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
  }, [page, limit, search, status, categoryId, sortBy, sortDir]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

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
    setCategoryId("");
    setSortBy("id");
    setSortDir("DESC");
    setPage(1);
  };

  const openEdit = (brand) => setEditing({ ...brand });
  const setField = (field, value) => setEditing((b) => ({ ...b, [field]: value }));

  const doUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/edit_brand", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Updated successfully");
        setConfirmOpen(false);
        setEditing(null);
        fetchBrands();
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
        title="Brands"
        subtitle="Search, edit and manage every brand and its SEO content."
        count={total}
        countLabel="brands"
      />

      {/* Filters */}
      <div className="adm-toolbar">
        <Field label="Search by name or URL" grow>
          <SearchInput
            placeholder="e.g. kent"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </Field>

        <Field label="Category">
          <Select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.category_name}
              </option>
            ))}
          </Select>
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
        <Link href="/admin/create_brands" className="adm-btn adm-btn-primary">
          <Plus size={17} /> New brand
        </Link>
      </div>

      {/* Table */}
      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr>
                <SortHeader label="ID" col="id" {...sortProps} />
                <SortHeader label="Brand name" col="brand_name" {...sortProps} />
                <SortHeader label="Category" col="category" sortable={false} />
                <SortHeader label="URL" col="brand_url" {...sortProps} />
                <SortHeader label="Status" col="status" sortable={false} />
                <SortHeader label="Action" col="action" sortable={false} />
              </tr>
            </thead>
            <tbody>
              {loading || brands.length === 0 ? (
                <TableState
                  colSpan={6}
                  loading={loading}
                  emptyTitle="No brands found"
                  emptyHint="Try a different search or clear the filters."
                />
              ) : (
                brands.map((brand) => (
                  <tr key={brand.id}>
                    <td className="col-id">{brand.id}</td>
                    <td className="col-strong">{brand.brand_name}</td>
                    <td className="col-muted">{brand.category_name || <Dash />}</td>
                    <td className="col-url">{brand.brand_url}</td>
                    <td>
                      <StatusBadge status={brand.status} />
                    </td>
                    <td>
                      <EditButton onClick={() => openEdit(brand)} />
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
          title={`Edit ${editing.brand_name}`}
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
            <Field label="Brand name">
              <Input value={editing.brand_name || ""} onChange={(e) => setField("brand_name", e.target.value)} />
            </Field>
            <Field label="Brand URL">
              <Input value={editing.brand_url || ""} onChange={(e) => setField("brand_url", e.target.value)} />
            </Field>
            <Field label="Category">
              <Select
                value={String(editing.category_id ?? "")}
                onChange={(e) => setField("category_id", e.target.value)}
              >
                <option value="">— none —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.category_name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select value={String(editing.status)} onChange={(e) => setField("status", e.target.value)}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </Select>
            </Field>
            <Field label="Icon" className="full">
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
            <Field label="Brand content" className="full">
              <TipTapEditorWithSEO
                content={editing.brand_content || ""}
                onChange={(html) => setField("brand_content", html)}
              />
            </Field>
          </div>
        </Modal>
      )}

      {/* Confirm dialog */}
      {confirmOpen && editing && (
        <ConfirmDialog
          title="Save changes?"
          message={`Update ${editing.brand_name} (ID ${editing.id})? This overwrites the existing record.`}
          saving={saving}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={doUpdate}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
