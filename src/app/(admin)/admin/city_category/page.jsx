"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { X, Plus, Info, Search as SearchIcon, Network, HelpCircle, Clock } from "lucide-react";
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
  Tabs,
  ReadOnly,
} from "@/app/(admin)/admin/components/AdminUI";

const fmtTs = (v) => (v ? new Date(v).toLocaleString("en-IN") : "—");

function CityPicker({ valueLabel, onPick, onClear, placeholder = "Search city..." }) {
  const [q, setQ] = useState(valueLabel || "");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => setQ(valueLabel || ""), [valueLabel]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/edit_page?type=cities&q=${encodeURIComponent(q)}`);
        const d = await res.json();
        if (d.success) setResults(d.cities || []);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [q, open]);

  return (
    <div className="adm-combo">
      <div className="adm-combo-row">
        <Input
          placeholder={placeholder}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {onClear && q && (
          <button
            type="button"
            className="adm-combo-clear"
            aria-label="Clear city"
            onClick={() => {
              setQ("");
              onClear();
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="adm-combo-menu">
          {results.map((c) => (
            <li
              key={c.id}
              className="adm-combo-opt"
              onMouseDown={() => {
                onPick(c);
                setQ(c.city_name);
                setOpen(false);
              }}
            >
              {c.city_name} <small>/{c.city_url}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Derive a readable label from an unknown service-type row shape.
const serviceTypeLabel = (row) =>
  row.service_type_name || row.name || row.title || row.type || `Type ${row.id}`;

export default function PageEditPage() {
  const [pages, setPages] = useState([]);
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
  const [filterCity, setFilterCity] = useState(null); // { id, city_name }
  const [categoryId, setCategoryId] = useState("");
  const [brandId, setBrandId] = useState("");

  // lookups
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);

  // sorting
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("DESC");

  // edit + confirm
  const [editing, setEditing] = useState(null);
  const [editTab, setEditTab] = useState("basic");
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

  // load lookups once
  useEffect(() => {
    fetch("/api/admin/edit_page?type=categories")
      .then((r) => r.json())
      .then((d) => d.success && setCategories(d.categories || []))
      .catch(() => {});
    fetch("/api/admin/edit_page?type=brands")
      .then((r) => r.json())
      .then((d) => d.success && setBrands(d.brands || []))
      .catch(() => {});
    fetch("/api/admin/edit_page?type=service_types")
      .then((r) => r.json())
      .then((d) => d.success && setServiceTypes(d.service_types || []))
      .catch(() => {});
  }, []);

  const fetchPages = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        status,
        city_id: filterCity?.id ? String(filterCity.id) : "",
        category_id: categoryId,
        brand_id: brandId,
        sortBy,
        sortDir,
      });
      const res = await fetch(`/api/admin/edit_page?${qs.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPages(data.data);
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
  }, [page, limit, search, status, filterCity, categoryId, brandId, sortBy, sortDir]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

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
    setFilterCity(null);
    setCategoryId("");
    setBrandId("");
    setSortBy("id");
    setSortDir("DESC");
    setPage(1);
  };

  const openEdit = (pg) => {
    setEditTab("basic");
    setEditing({ ...pg });
  };
  const setField = (field, value) => setEditing((p) => ({ ...p, [field]: value }));

  const doUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/edit_page", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Updated successfully");
        setConfirmOpen(false);
        setEditing(null);
        fetchPages();
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
        title="City Pages"
        subtitle="Edit the content for each city & category landing page."
        count={total}
        countLabel="pages"
      />

      {/* Filters */}
      <div className="adm-toolbar">
        <Field label="Search by title or URL" grow>
          <SearchInput
            placeholder="e.g. ro service"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </Field>

        <Field label="City">
          <CityPicker
            valueLabel={filterCity?.city_name || ""}
            placeholder="All cities"
            onPick={(c) => {
              setFilterCity(c);
              setPage(1);
            }}
            onClear={() => {
              setFilterCity(null);
              setPage(1);
            }}
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
            <option value="">All</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.category_name}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Brand">
          <Select
            value={brandId}
            onChange={(e) => {
              setBrandId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.brand_name}
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
        <Link href="/admin/create_page" className="adm-btn adm-btn-primary">
          <Plus size={17} /> New page
        </Link>
      </div>

      {/* Table */}
      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr>
                <SortHeader label="ID" col="id" {...sortProps} />
                <SortHeader label="Page title" col="page_title" {...sortProps} />
                <SortHeader label="City" col="city" sortable={false} />
                <SortHeader label="Category" col="category" sortable={false} />
                <SortHeader label="Brand" col="brand" sortable={false} />
                <SortHeader label="Status" col="status" sortable={false} />
                <SortHeader label="Action" col="action" sortable={false} />
              </tr>
            </thead>
            <tbody>
              {loading || pages.length === 0 ? (
                <TableState
                  colSpan={7}
                  loading={loading}
                  emptyTitle="No pages found"
                  emptyHint="Try a different search or clear the filters."
                />
              ) : (
                pages.map((pg) => (
                  <tr key={pg.id}>
                    <td className="col-id">{pg.id}</td>
                    <td className="col-strong">
                      <span className="adm-truncate" style={{ display: "block" }}>
                        {pg.page_title}
                      </span>
                    </td>
                    <td className="col-muted">{pg.city_name || <Dash />}</td>
                    <td className="col-muted">{pg.category_name || <Dash />}</td>
                    <td className="col-muted">{pg.brand_name || <Dash />}</td>
                    <td>
                      <StatusBadge status={pg.status} />
                    </td>
                    <td>
                      <EditButton onClick={() => openEdit(pg)} />
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
          title={`Edit ${editing.page_title || "page"}`}
          id={editing.id}
          size="wide"
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
          <Tabs
            tabs={[
              { key: "basic", label: "Basic Info", icon: Info },
              { key: "seo", label: "SEO", icon: SearchIcon },
              { key: "relations", label: "Relations", icon: Network },
              { key: "faqs", label: "FAQs", icon: HelpCircle },
              { key: "timestamps", label: "Timestamps", icon: Clock },
            ]}
            active={editTab}
            onChange={setEditTab}
          />

          {/* ── Basic Info ───────────────────────────────── */}
          {editTab === "basic" && (
            <div className="adm-formgrid adm-tabpanel">
              <Field label="ID (read-only)">
                <ReadOnly value={editing.id} mono />
              </Field>
              <Field label="Status">
                <Select value={String(editing.status)} onChange={(e) => setField("status", e.target.value)}>
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </Select>
              </Field>
              <Field label="Page title" className="full">
                <Input value={editing.page_title || ""} onChange={(e) => setField("page_title", e.target.value)} />
              </Field>
              <Field label="Page URL" className="full">
                <Input value={editing.page_url || ""} onChange={(e) => setField("page_url", e.target.value)} />
              </Field>
              <Field label="YouTube URL" className="full">
                <Input
                  value={editing.youtube_url || ""}
                  onChange={(e) => setField("youtube_url", e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=…"
                />
              </Field>
              <Field label="Page content" className="full">
                <TipTapEditorWithSEO content={editing.page_content || ""} onChange={(html) => setField("page_content", html)} />
              </Field>
            </div>
          )}

          {/* ── SEO ──────────────────────────────────────── */}
          {editTab === "seo" && (
            <div className="adm-formgrid adm-tabpanel">
              <Field label="Meta title" className="full">
                <Input value={editing.meta_title || ""} onChange={(e) => setField("meta_title", e.target.value)} />
              </Field>
              <Field label="Meta keywords" className="full">
                <Textarea rows={2} value={editing.meta_keywords || ""} onChange={(e) => setField("meta_keywords", e.target.value)} />
              </Field>
              <Field label="Meta description" className="full">
                <Textarea rows={3} value={editing.meta_description || ""} onChange={(e) => setField("meta_description", e.target.value)} />
              </Field>
            </div>
          )}

          {/* ── Relations ────────────────────────────────── */}
          {editTab === "relations" && (
            <div className="adm-formgrid adm-tabpanel">
              <Field label="City">
                <CityPicker
                  valueLabel={editing.city_name || ""}
                  onPick={(c) => setEditing((p) => ({ ...p, city_id: c.id, city_name: c.city_name }))}
                />
              </Field>
              <Field label="Category">
                <Select value={String(editing.category_id ?? "")} onChange={(e) => setField("category_id", e.target.value)}>
                  <option value="">— none —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.category_name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Brand">
                <Select value={String(editing.brand_id ?? "")} onChange={(e) => setField("brand_id", e.target.value)}>
                  <option value="">— none —</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.brand_name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Service type">
                {serviceTypes.length > 0 ? (
                  <Select
                    value={String(editing.service_type_id ?? "")}
                    onChange={(e) => setField("service_type_id", e.target.value)}
                  >
                    <option value="">— none —</option>
                    {serviceTypes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {serviceTypeLabel(s)}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    value={editing.service_type_id ?? ""}
                    onChange={(e) => setField("service_type_id", e.target.value)}
                    placeholder="service_type_id"
                  />
                )}
              </Field>
            </div>
          )}

          {/* ── FAQs ─────────────────────────────────────── */}
          {editTab === "faqs" && (
            <div className="adm-tabpanel">
              <p className="adm-tabhint">Up to 5 question / answer pairs shown on the live page.</p>
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="adm-faqcard">
                  <Field label={`Question ${i}`}>
                    <Input
                      value={editing[`faqquestion${i}`] || ""}
                      onChange={(e) => setField(`faqquestion${i}`, e.target.value)}
                    />
                  </Field>
                  <div style={{ height: 10 }} />
                  <Field label={`Answer ${i}`}>
                    <Textarea
                      rows={2}
                      value={editing[`faqanswer${i}`] || ""}
                      onChange={(e) => setField(`faqanswer${i}`, e.target.value)}
                    />
                  </Field>
                </div>
              ))}
            </div>
          )}

          {/* ── Timestamps ───────────────────────────────── */}
          {editTab === "timestamps" && (
            <div className="adm-formgrid adm-tabpanel">
              <Field label="ID (read-only)">
                <ReadOnly value={editing.id} mono />
              </Field>
              <Field label="Status">
                <ReadOnly value={String(editing.status) === "1" ? "Active" : "Inactive"} />
              </Field>
              <Field label="Created at (read-only)">
                <ReadOnly value={fmtTs(editing.created_at)} mono />
              </Field>
              <Field label="Updated at (read-only)">
                <ReadOnly value={fmtTs(editing.updated_at)} mono />
              </Field>
            </div>
          )}
        </Modal>
      )}

      {/* Confirm dialog */}
      {confirmOpen && editing && (
        <ConfirmDialog
          title="Save changes?"
          message={`Update page #${editing.id}? This overwrites the existing record.`}
          saving={saving}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={doUpdate}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
