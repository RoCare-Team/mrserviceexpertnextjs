"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2, ArrowRight } from "lucide-react";
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
   NOTE: No API wired yet. Runs on in-memory sample data so the design
   can be reviewed. Swap SEED + doSave/doDelete for /api/admin/redirects
   calls when the backend is ready.
   301 = Permanent  ·  302 = Temporary
   --------------------------------------------------------------------- */
const SEED = [
  { id: 8, source: "/ac-repair-delhi", destination: "/delhi/ac-service", type: "301", status: "1", hits: 1240 },
  { id: 7, source: "/old-ro-page", destination: "/ro-service", type: "301", status: "1", hits: 642 },
  { id: 6, source: "/summer-offer", destination: "/offers/summer", type: "302", status: "1", hits: 318 },
  { id: 5, source: "/blog/ac-tips-2024", destination: "/blog/ac-electricity-saving-tips", type: "301", status: "1", hits: 205 },
  { id: 4, source: "/contactus", destination: "/contact", type: "301", status: "1", hits: 980 },
  { id: 3, source: "/temp-maintenance", destination: "/", type: "302", status: "0", hits: 12 },
  { id: 2, source: "/washing-machine", destination: "/appliances/washing-machine", type: "301", status: "1", hits: 451 },
  { id: 1, source: "/old-careers", destination: "/careers", type: "301", status: "0", hits: 73 },
];

const blankRedirect = () => ({
  id: null,
  source: "",
  destination: "",
  type: "301",
  status: "1",
  notes: "",
});

export default function RedirectsPage() {
  const [redirects, setRedirects] = useState(SEED);

  // filters / sorting / pagination (client-side for now)
  const [searchInput, setSearchInput] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("DESC");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // edit / confirm / toast
  const [editing, setEditing] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, t = "success") => {
    setToast({ message, type: t });
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
    setType("");
    setStatus("");
    setSortBy("id");
    setSortDir("DESC");
    setPage(1);
  };

  const filtered = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    let rows = redirects.filter((r) => {
      const matchesQ = !q || r.source.toLowerCase().includes(q) || r.destination.toLowerCase().includes(q);
      const matchesType = type === "" || r.type === type;
      const matchesStatus = status === "" || String(r.status) === status;
      return matchesQ && matchesType && matchesStatus;
    });
    rows = [...rows].sort((a, b) => {
      const va = a[sortBy] ?? "";
      const vb = b[sortBy] ?? "";
      const cmp = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sortDir === "ASC" ? cmp : -cmp;
    });
    return rows;
  }, [redirects, searchInput, type, status, sortBy, sortDir]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (safePage - 1) * limit + 1;
  const to = Math.min(safePage * limit, total);
  const pageRows = filtered.slice((safePage - 1) * limit, safePage * limit);

  const openNew = () => setEditing(blankRedirect());
  const openEdit = (r) => setEditing({ ...r });
  const setField = (field, value) => setEditing((r) => ({ ...r, [field]: value }));

  const doSave = () => {
    setSaving(true);
    setTimeout(() => {
      setRedirects((list) => {
        if (editing.id == null) {
          const id = (list.reduce((m, x) => Math.max(m, x.id), 0) || 0) + 1;
          return [{ ...editing, hits: 0, id }, ...list];
        }
        return list.map((x) => (x.id === editing.id ? { ...x, ...editing } : x));
      });
      showToast(editing.id == null ? "Redirect created" : "Redirect updated");
      setSaving(false);
      setConfirmOpen(false);
      setEditing(null);
    }, 350);
  };

  const doDelete = () => {
    setSaving(true);
    setTimeout(() => {
      setRedirects((list) => list.filter((x) => x.id !== deleting.id));
      showToast("Redirect deleted");
      setSaving(false);
      setDeleting(null);
    }, 300);
  };

  const sortProps = { sortBy, sortDir, onSort: toggleSort };

  return (
    <div>
      <PageHead
        eyebrow="System"
        title="Redirects"
        subtitle="Manage 301 (permanent) and 302 (temporary) URL redirects."
        count={total}
        countLabel="rules"
      />

      {/* Filters */}
      <div className="adm-toolbar">
        <Field label="Search source or destination" grow>
          <SearchInput
            placeholder="e.g. /old-page"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
          />
        </Field>

        <Field label="Type">
          <Select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All types</option>
            <option value="301">301 · Permanent</option>
            <option value="302">302 · Temporary</option>
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
        <Button variant="primary" onClick={openNew}>
          <Plus size={17} /> New redirect
        </Button>
      </div>

      {/* Table */}
      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr>
                <SortHeader label="ID" col="id" {...sortProps} />
                <SortHeader label="Source" col="source" {...sortProps} />
                <SortHeader label="Destination" col="destination" {...sortProps} />
                <SortHeader label="Type" col="type" {...sortProps} />
                <SortHeader label="Hits" col="hits" {...sortProps} />
                <SortHeader label="Status" col="status" sortable={false} />
                <SortHeader label="Action" col="action" sortable={false} />
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <TableState
                  colSpan={7}
                  loading={false}
                  emptyTitle="No redirects found"
                  emptyHint="Try a different search, or add your first rule."
                />
              ) : (
                pageRows.map((r) => (
                  <tr key={r.id}>
                    <td className="col-id">{r.id}</td>
                    <td className="col-url">{r.source}</td>
                    <td className="col-url">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <ArrowRight size={13} style={{ color: "var(--adm-faint)", flexShrink: 0 }} />
                        {r.destination}
                      </span>
                    </td>
                    <td>
                      <Badge tone={r.type === "301" ? "info" : "warn"} code>
                        {r.type} · {r.type === "301" ? "Permanent" : "Temporary"}
                      </Badge>
                    </td>
                    <td className="col-id">{Number(r.hits ?? 0).toLocaleString("en-IN")}</td>
                    <td>
                      <Badge tone={String(r.status) === "1" ? "ok" : "off"}>
                        {String(r.status) === "1" ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td>
                      <div className="adm-rowactions">
                        <EditButton onClick={() => openEdit(r)} />
                        <Button variant="ghost" size="sm" onClick={() => setDeleting(r)} aria-label="Delete">
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
          title={editing.id == null ? "New redirect" : `Edit redirect`}
          id={editing.id == null ? undefined : editing.id}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="primary" onClick={() => setConfirmOpen(true)}>
                {editing.id == null ? "Create redirect" : "Save changes"}
              </Button>
            </>
          }
        >
          <div className="adm-formgrid">
            <Field label="Source path" className="full">
              <Input
                value={editing.source || ""}
                onChange={(e) => setField("source", e.target.value)}
                placeholder="/old-url"
              />
            </Field>
            <Field label="Destination URL" className="full">
              <Input
                value={editing.destination || ""}
                onChange={(e) => setField("destination", e.target.value)}
                placeholder="/new-url or https://…"
              />
            </Field>
            <Field label="Type">
              <Select value={editing.type} onChange={(e) => setField("type", e.target.value)}>
                <option value="301">301 · Permanent</option>
                <option value="302">302 · Temporary</option>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={String(editing.status)} onChange={(e) => setField("status", e.target.value)}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </Select>
            </Field>
            <Field label="Notes (internal)" className="full">
              <Textarea
                rows={2}
                value={editing.notes || ""}
                onChange={(e) => setField("notes", e.target.value)}
                placeholder="Why this redirect exists (optional)"
              />
            </Field>
          </div>

          <p style={{ marginTop: 14, fontSize: 12.5, color: "var(--adm-muted)", lineHeight: 1.55 }}>
            Use <b>301</b> when a page has moved for good (passes SEO value). Use <b>302</b> for
            temporary moves like a sale or maintenance page.
          </p>
        </Modal>
      )}

      {/* Save confirm */}
      {confirmOpen && editing && (
        <ConfirmDialog
          title={editing.id == null ? "Create redirect?" : "Save changes?"}
          message={`${editing.source || "/source"}  →  ${editing.destination || "/destination"}  (${editing.type})`}
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
          title="Delete redirect?"
          message={`${deleting.source} → ${deleting.destination} will be removed. This can't be undone.`}
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
