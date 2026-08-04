"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Info, MapPin, Phone } from "lucide-react";
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
  FieldNote,
} from "@/app/(admin)/admin/components/AdminUI";

const BLANK_STORE = {
  store_code: "",
  business_name: "Mr Service Expert",
  city_id: "",
  city_url: "",
  locality: "",
  state: "",
  address: "",
  postal_code: "",
  phone: "",
  website: "",
  primary_category: "Appliance repair service",
  additional_categories: "",
  latitude: "",
  longitude: "",
  hours: "Open 24 hours",
  description: "",
  status: "1",
};

const TABS = [
  { key: "basic", label: "Basic Info", icon: Info },
  { key: "location", label: "Location", icon: MapPin },
  { key: "contact", label: "Contact & Details", icon: Phone },
];

/* ── Shared add/edit form ───────────────────────────────────────────────── */
function StoreForm({ form, set, cities, tab, onTab }) {
  // Picking a city fills city_id + city_url together, so the store always
  // resolves on the public city page (getStoresByCityUrl / getStoresByCityId).
  const pickCity = (id) => {
    const city = cities.find((c) => String(c.id) === String(id));
    set("city_id", id);
    set("city_url", city ? city.city_url : "");
    if (city?.state && !form.state) set("state", city.state);
  };

  return (
    <>
      <Tabs tabs={TABS} active={tab} onChange={onTab} />

      {tab === "basic" && (
        <div className="adm-formgrid adm-tabpanel">
          <Field label="Business name *">
            <Input
              value={form.business_name || ""}
              onChange={(e) => set("business_name", e.target.value)}
              placeholder="e.g. Mr Service Expert"
            />
          </Field>
          <Field label="Store code">
            <Input
              value={form.store_code || ""}
              onChange={(e) => set("store_code", e.target.value)}
              placeholder="Google Business Profile store code"
            />
          </Field>
          <Field label="City *">
            <Select value={String(form.city_id || "")} onChange={(e) => pickCity(e.target.value)}>
              <option value="">Select a city…</option>
              {cities.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.city_name} ({c.city_url})
                </option>
              ))}
            </Select>
            <FieldNote>Links this store to /{form.city_url || "city-url"}.</FieldNote>
          </Field>
          <Field label="City URL">
            <Input
              value={form.city_url || ""}
              onChange={(e) => set("city_url", e.target.value.toLowerCase())}
              placeholder="e.g. new-delhi"
            />
          </Field>
          <Field label="Locality">
            <Input
              value={form.locality || ""}
              onChange={(e) => set("locality", e.target.value)}
              placeholder="e.g. New Delhi"
            />
          </Field>
          <Field label="State">
            <Input
              value={form.state || ""}
              onChange={(e) => set("state", e.target.value)}
              placeholder="e.g. Delhi"
            />
          </Field>
          <Field label="Status">
            <Select value={String(form.status)} onChange={(e) => set("status", e.target.value)}>
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </Select>
            <FieldNote>Only active stores appear on the website.</FieldNote>
          </Field>
        </div>
      )}

      {tab === "location" && (
        <div className="adm-formgrid adm-tabpanel">
          <Field label="Address *" className="full">
            <Textarea
              rows={3}
              value={form.address || ""}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Shop No. 1, Street No. 1, near Sanjay Travels…"
            />
          </Field>
          <Field label="Postal code">
            <Input
              value={form.postal_code || ""}
              onChange={(e) => set("postal_code", e.target.value)}
              placeholder="e.g. 110018"
            />
          </Field>
          <Field label="Hours">
            <Input
              value={form.hours || ""}
              onChange={(e) => set("hours", e.target.value)}
              placeholder="e.g. Open 24 hours"
            />
          </Field>
          <Field label="Latitude">
            <Input
              value={form.latitude ?? ""}
              onChange={(e) => set("latitude", e.target.value)}
              placeholder="e.g. 28.6139"
            />
          </Field>
          <Field label="Longitude">
            <Input
              value={form.longitude ?? ""}
              onChange={(e) => set("longitude", e.target.value)}
              placeholder="e.g. 77.2090"
            />
          </Field>
        </div>
      )}

      {tab === "contact" && (
        <div className="adm-formgrid adm-tabpanel">
          <Field label="Phone">
            <Input
              value={form.phone || ""}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 9311587715"
            />
          </Field>
          <Field label="Website">
            <Input
              value={form.website || ""}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://www.mrserviceexpert.com/city"
            />
          </Field>
          <Field label="Primary category">
            <Input
              value={form.primary_category || ""}
              onChange={(e) => set("primary_category", e.target.value)}
              placeholder="Appliance repair service"
            />
          </Field>
          <Field label="Additional categories">
            <Input
              value={form.additional_categories || ""}
              onChange={(e) => set("additional_categories", e.target.value)}
              placeholder="Repair service, Air conditioning store"
            />
          </Field>
          <Field label="Description" className="full">
            <Textarea
              rows={4}
              value={form.description || ""}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Mr Service Expert is a trusted home appliance repair…"
            />
          </Field>
        </div>
      )}
    </>
  );
}

export default function StoreLocatorPage() {
  const [stores, setStores] = useState([]);
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
  const [cities, setCities] = useState([]);

  // sorting
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("DESC");

  // modals
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(null);
  const [tab, setTab] = useState("basic");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

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

  // reference data for the filter + form dropdowns
  useEffect(() => {
    fetch("/api/admin/store_locator?type=states")
      .then((r) => r.json())
      .then((d) => d.success && setStates(d.states || []))
      .catch(() => {});
    fetch("/api/admin/store_locator?type=cities")
      .then((r) => r.json())
      .then((d) => d.success && setCities(d.cities || []))
      .catch(() => {});
  }, []);

  const fetchStores = useCallback(async () => {
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
      const res = await fetch(`/api/admin/store_locator?${qs.toString()}`);
      const data = await res.json();
      if (data.success) {
        setStores(data.data);
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
    fetchStores();
  }, [fetchStores]);

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

  const openCreate = () => {
    setTab("basic");
    setCreating({ ...BLANK_STORE });
  };
  const openEdit = (store) => {
    setTab("basic");
    setEditing({ ...store, status: String(store.status ?? "1") });
  };

  const closeForm = () => {
    setEditing(null);
    setCreating(null);
    setConfirmOpen(false);
  };

  const form = editing || creating;
  const isNew = !editing && !!creating;
  const setField = (field, value) =>
    (editing ? setEditing : setCreating)((s) => ({ ...s, [field]: value }));

  // Required fields live on different tabs — jump to the offending one.
  const validate = () => {
    if (!form?.business_name?.trim()) return ["Business name is required.", "basic"];
    if (!form?.city_url?.trim()) return ["Pick a city so the store shows on its city page.", "basic"];
    if (!form?.address?.trim()) return ["Address is required.", "location"];
    return null;
  };

  const handleSaveClick = () => {
    const err = validate();
    if (err) {
      setTab(err[1]);
      return showToast(err[0], "error");
    }
    setConfirmOpen(true);
  };

  const doSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/store_locator", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast(isNew ? `Store created (ID: ${data.storeId})` : "Store updated successfully");
        closeForm();
        if (isNew) setPage(1);
        fetchStores();
      } else {
        showToast(data.message || "Save failed", "error");
        setConfirmOpen(false);
      }
    } catch (e) {
      showToast(e.message, "error");
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/store_locator?id=${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        showToast("Store deleted");
        setDeleteTarget(null);
        fetchStores();
      } else {
        showToast(data.message || "Delete failed", "error");
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
        title="Store Locator"
        subtitle="Manage the physical branches shown on city pages and the store locator."
        count={total}
        countLabel="stores"
      />

      {/* Filters */}
      <div className="adm-toolbar">
        <Field label="Search name, code, locality, address or phone" grow>
          <SearchInput
            placeholder="e.g. new-delhi"
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
        <Button variant="primary" onClick={openCreate}>
          <Plus size={17} /> Add store
        </Button>
      </div>

      {/* Table */}
      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr>
                <SortHeader label="ID" col="id" {...sortProps} />
                <SortHeader label="Business name" col="business_name" {...sortProps} />
                <SortHeader label="Store code" col="store_code" {...sortProps} />
                <SortHeader label="City URL" col="city_url" sortable={false} />
                <SortHeader label="Locality" col="locality" {...sortProps} />
                <SortHeader label="State" col="state" {...sortProps} />
                <SortHeader label="Pincode" col="postal_code" {...sortProps} />
                <SortHeader label="Phone" col="phone" sortable={false} />
                <SortHeader label="Status" col="status" sortable={false} />
                <SortHeader label="Action" col="action" sortable={false} />
              </tr>
            </thead>
            <tbody>
              {loading || stores.length === 0 ? (
                <TableState
                  colSpan={10}
                  loading={loading}
                  emptyTitle="No stores found"
                  emptyHint="Try a different search, or add your first store."
                />
              ) : (
                stores.map((store) => (
                  <tr key={store.id}>
                    <td className="col-id">{store.id}</td>
                    <td className="col-strong">{store.business_name}</td>
                    <td className="col-muted">{store.store_code || <Dash />}</td>
                    <td className="col-url">{store.city_url || <Dash />}</td>
                    <td className="col-muted">{store.locality || <Dash />}</td>
                    <td className="col-muted">{store.state || <Dash />}</td>
                    <td className="col-muted">{store.postal_code || <Dash />}</td>
                    <td className="col-muted">{store.phone || <Dash />}</td>
                    <td>
                      <StatusBadge status={store.status} />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <EditButton onClick={() => openEdit(store)} />
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setDeleteTarget(store)}
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
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

      {/* Add / Edit modal */}
      {form && (
        <Modal
          title={isNew ? "Add store" : `Edit ${form.business_name}`}
          id={isNew ? undefined : form.id}
          size="wide"
          onClose={closeForm}
          footer={
            <>
              <Button onClick={closeForm}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveClick}>
                {isNew ? "Create store" : "Save changes"}
              </Button>
            </>
          }
        >
          <StoreForm form={form} set={setField} cities={cities} tab={tab} onTab={setTab} />
        </Modal>
      )}

      {/* Save confirmation */}
      {confirmOpen && form && (
        <ConfirmDialog
          title={isNew ? "Create this store?" : "Save changes?"}
          message={
            isNew
              ? `Add "${form.business_name}" (${form.locality || form.city_url}) to the store locator.`
              : `Update ${form.business_name} (ID ${form.id})? This overwrites the existing record.`
          }
          saving={saving}
          confirmLabel={isNew ? "Yes, create" : "Yes, save"}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={doSave}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete this store?"
          message={`"${deleteTarget.business_name}" (ID ${deleteTarget.id}) will be removed permanently. This cannot be undone.`}
          saving={saving}
          tone="danger"
          confirmLabel="Yes, delete"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={doDelete}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
