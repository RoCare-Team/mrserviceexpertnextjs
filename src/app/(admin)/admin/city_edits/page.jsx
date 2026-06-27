"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Info, Search as SearchIcon, FileText } from "lucide-react";
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
} from "@/app/(admin)/admin/components/AdminUI";

const NEW_CITY = {
  city_name: "",
  city_url: "",
  state: "",
  status: "1",
  meta_title: "",
  meta_keywords: "",
  meta_description: "",
  city_content: "",
};

const slugify = (v) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

/* ── Add-city modal: tabbed, themed, wired to /api/admin/create_city ── */
function CreateCityModal({ states, onClose, onCreated, showToast }) {
  const [tab, setTab] = useState("basic");
  const [form, setForm] = useState(NEW_CITY);
  const [urlEdited, setUrlEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const set = (field, value) =>
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "city_name" && !urlEdited) next.city_url = slugify(value);
      return next;
    });

  const validate = () => {
    if (!form.city_name.trim()) return "City name is required.";
    if (!form.city_url.trim()) return "City URL is required.";
    return null;
  };

  const handleSaveClick = () => {
    const err = validate();
    if (err) {
      setTab("basic");
      return showToast(err, "error");
    }
    setConfirmOpen(true);
  };

  const doCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/create_city", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`City created (ID: ${data.cityId})`);
        onCreated();
        onClose();
      } else {
        showToast(data.message || "Failed to create city.", "error");
        setConfirmOpen(false);
      }
    } catch (e) {
      showToast(e.message, "error");
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { key: "basic", label: "Basic Info", icon: Info },
    { key: "seo", label: "SEO", icon: SearchIcon },
    { key: "content", label: "Content", icon: FileText },
  ];

  return (
    <>
      <Modal
        title="Add city"
        size="wide"
        onClose={onClose}
        footer={
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveClick}>
              Create city
            </Button>
          </>
        }
      >
        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === "basic" && (
          <div className="adm-formgrid adm-tabpanel">
            <Field label="City name">
              <Input value={form.city_name} onChange={(e) => set("city_name", e.target.value)} placeholder="e.g. Mumbai" />
            </Field>
            <Field label="City URL">
              <Input
                value={form.city_url}
                onChange={(e) => {
                  setUrlEdited(true);
                  set("city_url", e.target.value);
                }}
                placeholder="e.g. mumbai"
              />
            </Field>
            <Field label="State">
              <Input
                value={form.state}
                onChange={(e) => set("state", e.target.value)}
                placeholder="e.g. Maharashtra"
                list="adm-states"
              />
              <datalist id="adm-states">
                {states.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </Select>
            </Field>
          </div>
        )}

        {tab === "seo" && (
          <div className="adm-formgrid adm-tabpanel">
            <Field label="Meta title" className="full">
              <Input value={form.meta_title} onChange={(e) => set("meta_title", e.target.value)} placeholder="50–60 characters recommended" />
            </Field>
            <Field label="Meta keywords" className="full">
              <Textarea rows={2} value={form.meta_keywords} onChange={(e) => set("meta_keywords", e.target.value)} placeholder="keyword1, keyword2" />
            </Field>
            <Field label="Meta description" className="full">
              <Textarea rows={3} value={form.meta_description} onChange={(e) => set("meta_description", e.target.value)} placeholder="120–160 characters recommended" />
            </Field>
          </div>
        )}

        {tab === "content" && (
          <div className="adm-tabpanel">
            <Field label="City content">
              <TipTapEditorWithSEO content={form.city_content} onChange={(html) => set("city_content", html)} />
            </Field>
          </div>
        )}
      </Modal>

      {confirmOpen && (
        <ConfirmDialog
          title="Create this city?"
          message={`Add "${form.city_name}" (/${form.city_url}) to the catalogue.`}
          saving={saving}
          confirmLabel="Yes, create"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={doCreate}
        />
      )}
    </>
  );
}

export default function CityEditPage() {
  const [cities, setCities] = useState([]);
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
  const [state, setState] = useState("");
  const [states, setStates] = useState([]);

  // sorting
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("DESC");

  // edit modal + confirm
  const [editing, setEditing] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  // load distinct states once for the dropdown
  useEffect(() => {
    fetch("/api/admin/edit_city?type=states")
      .then((r) => r.json())
      .then((d) => d.success && setStates(d.states || []))
      .catch(() => {});
  }, []);

  const fetchCities = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        status,
        state,
        sortBy,
        sortDir,
      });
      const res = await fetch(`/api/admin/edit_city?${qs.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCities(data.data);
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
  }, [page, limit, search, status, state, sortBy, sortDir]);

  useEffect(() => {
    fetchCities();
  }, [fetchCities]);

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
    setState("");
    setSortBy("id");
    setSortDir("DESC");
    setPage(1);
  };

  const openEdit = (city) => setEditing({ ...city });
  const setField = (field, value) => setEditing((c) => ({ ...c, [field]: value }));

  const doUpdate = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/edit_city", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Updated successfully");
        setConfirmOpen(false);
        setEditing(null);
        fetchCities();
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
        title="Cities"
        subtitle="Manage the service locations shown across the site."
        count={total}
        countLabel="cities"
      />

      {/* Filters */}
      <div className="adm-toolbar">
        <Field label="Search by name or URL" grow>
          <SearchInput
            placeholder="e.g. delhi"
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

        <Field label="State">
          <Select
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
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
        <Button variant="primary" onClick={() => setCreating(true)}>
          <Plus size={17} /> Add city
        </Button>
      </div>

      {/* Table */}
      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr>
                <SortHeader label="ID" col="id" {...sortProps} />
                <SortHeader label="City name" col="city_name" {...sortProps} />
                <SortHeader label="URL" col="city_url" {...sortProps} />
                <SortHeader label="State" col="state" {...sortProps} />
                <SortHeader label="Status" col="status" sortable={false} />
                <SortHeader label="Action" col="action" sortable={false} />
              </tr>
            </thead>
            <tbody>
              {loading || cities.length === 0 ? (
                <TableState
                  colSpan={6}
                  loading={loading}
                  emptyTitle="No cities found"
                  emptyHint="Try a different search or clear the filters."
                />
              ) : (
                cities.map((city) => (
                  <tr key={city.id}>
                    <td className="col-id">{city.id}</td>
                    <td className="col-strong">{city.city_name}</td>
                    <td className="col-url">{city.city_url}</td>
                    <td className="col-muted">{city.state || <Dash />}</td>
                    <td>
                      <StatusBadge status={city.status} />
                    </td>
                    <td>
                      <EditButton onClick={() => openEdit(city)} />
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
          title={`Edit ${editing.city_name}`}
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
            <Field label="City name">
              <Input value={editing.city_name || ""} onChange={(e) => setField("city_name", e.target.value)} />
            </Field>
            <Field label="City URL">
              <Input value={editing.city_url || ""} onChange={(e) => setField("city_url", e.target.value)} />
            </Field>
            <Field label="State">
              <Input value={editing.state || ""} onChange={(e) => setField("state", e.target.value)} />
            </Field>
            <Field label="Status">
              <Select value={String(editing.status)} onChange={(e) => setField("status", e.target.value)}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </Select>
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
            <Field label="City content" className="full">
              <TipTapEditorWithSEO
                content={editing.city_content || ""}
                onChange={(html) => setField("city_content", html)}
              />
            </Field>
          </div>
        </Modal>
      )}

      {/* Confirm dialog */}
      {confirmOpen && editing && (
        <ConfirmDialog
          title="Save changes?"
          message={`Update ${editing.city_name} (ID ${editing.id})? This overwrites the existing record.`}
          saving={saving}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={doUpdate}
        />
      )}

      {/* Create Modal */}
      {creating && (
        <CreateCityModal
          states={states}
          showToast={showToast}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setPage(1);
            fetchCities();
          }}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
