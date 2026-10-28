"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHead, Field, Input, Select, Button, Badge, TableState, Toast } from "@/app/(admin)/admin/components/AdminUI";

async function call(url, method = "GET", body) {
  const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => null);
  if (!json?.success) throw new Error(json?.error?.message || json?.message || "Request failed.");
  return json.data;
}

/** Partner-facing service catalogue (Repair, Installation, AMC…) per category. */
export default function PartnerServiceTypesPage() {
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState({ category_id: "", name: "", sort_order: "" });
  const [edits, setEdits] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await call("/api/admin/partners/service-types");
      setRows(d.rows);
      setCategories(d.categories);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (fn, msg) => {
    setSaving(true);
    try {
      await fn();
      showToast(msg);
      await load();
      return true;
    } catch (e) {
      showToast(e.message, "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const shown = filter ? rows.filter((r) => String(r.category_id) === filter) : rows;

  return (
    <div>
      <Link href="/admin/partners" className="adm-btn adm-btn-ghost adm-btn-sm" style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> All partners
      </Link>
      <PageHead
        eyebrow="Partners"
        title="Partner service catalogue"
        subtitle="Services partners can pick per category. A category appears in the registration form once it has at least one active service. Deactivate instead of deleting — existing partner selections stay intact."
      />

      <div className="adm-toolbar">
        <Field label="Category">
          <Select value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}>
            <option value="">Choose…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
          </Select>
        </Field>
        <Field label="New service name" grow>
          <Input value={form.name} maxLength={120} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Gas Refilling" />
        </Field>
        <Field label="Order">
          <Input type="number" value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))} style={{ width: 90 }} />
        </Field>
        <Button
          variant="primary"
          disabled={saving || !form.category_id || form.name.trim().length < 2}
          onClick={async () => {
            if (await act(() => call("/api/admin/partners/service-types", "POST", { ...form, sort_order: Number(form.sort_order) || 0 }), "Service added."))
              setForm((f) => ({ ...f, name: "", sort_order: "" }));
          }}
        >
          Add service
        </Button>
      </div>

      <div className="adm-toolbar">
        <Field label="Show category">
          <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
          </Select>
        </Field>
      </div>

      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr><th>Category</th><th>Service</th><th>Order</th><th>Partners</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {loading || shown.length === 0 ? (
                <TableState colSpan={6} loading={loading} emptyTitle="No services" emptyHint="Add one above." />
              ) : (
                shown.map((r) => {
                  const e = edits[r.id] || {};
                  const dirty = (e.name !== undefined && e.name !== r.name) || (e.sort_order !== undefined && Number(e.sort_order) !== r.sort_order);
                  return (
                    <tr key={r.id}>
                      <td className="col-muted">{r.category_name}</td>
                      <td><Input value={e.name ?? r.name} maxLength={120} onChange={(ev) => setEdits((x) => ({ ...x, [r.id]: { ...e, name: ev.target.value } }))} /></td>
                      <td><Input type="number" style={{ width: 80 }} value={e.sort_order ?? r.sort_order} onChange={(ev) => setEdits((x) => ({ ...x, [r.id]: { ...e, sort_order: ev.target.value } }))} /></td>
                      <td>{r.partner_count}</td>
                      <td><Badge tone={r.status ? "ok" : "off"}>{r.status ? "Active" : "Inactive"}</Badge></td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={!dirty || saving}
                          onClick={async () => {
                            if (await act(() => call("/api/admin/partners/service-types", "PUT", { id: r.id, name: e.name ?? r.name, sort_order: Number(e.sort_order ?? r.sort_order) }), "Saved."))
                              setEdits((x) => ({ ...x, [r.id]: undefined }));
                          }}
                        >
                          Save
                        </Button>{" "}
                        <Button size="sm" disabled={saving} onClick={() => act(() => call("/api/admin/partners/service-types", "PUT", { id: r.id, status: !r.status }), r.status ? "Deactivated." : "Activated.")}>
                          {r.status ? "Deactivate" : "Activate"}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Toast toast={toast} />
    </div>
  );
}
