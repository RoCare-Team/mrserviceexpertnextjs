"use client";

// Admin → Services
//
// Services (ids + prices) come from the all_services.php feed; this screen
// overrides what visitors read — title, description, image — plus the order
// they appear in. A blank field falls back to the feed's value, and "Reset"
// drops the override completely. Changes apply on every city / brand page.

import { useCallback, useEffect, useState } from "react";
import { RefreshCw, RotateCcw, Pencil } from "lucide-react";
import TipTapEditorWithSEO from "@/app/(admin)/admin/components/TipTapEditorWithSEO";
import ImageUploader from "@/app/(admin)/admin/components/ImageUploader";
import {
  PageHead,
  Field,
  Input,
  Select,
  Button,
  Badge,
  TableState,
  Modal,
  ConfirmDialog,
  Toast,
  FieldNote,
} from "@/app/(admin)/admin/components/AdminUI";

const LEAD_TYPES = [
  { id: 1, name: "RO Water Purifier" },
  { id: 2, name: "Air Conditioner" },
  { id: 4, name: "Washing Machine" },
  { id: 5, name: "Geyser" },
  { id: 6, name: "Refrigerator" },
  { id: 8, name: "LED TV" },
  { id: 9, name: "Microwave" },
  { id: 10, name: "Kitchen Chimney" },
  { id: 11, name: "Vacuum Cleaner" },
  { id: 18, name: "Air Purifier" },
  { id: 29, name: "Sofa Cleaning" },
  { id: 30, name: "Bathroom Cleaning" },
  { id: 31, name: "Home Deep Cleaning" },
  { id: 32, name: "Kitchen Cleaning" },
  { id: 33, name: "Pest Control" },
  { id: 34, name: "Tank Cleaning" },
  { id: 35, name: "House Painting" },
  { id: 39, name: "Mason Service" },
];

// Compare editor HTML with the feed's without tripping on whitespace or the
// tags Tiptap closes/adds (the feed's <li>s are never closed).
const normHtml = (html) =>
  String(html || "")
    .replace(/<\/?(p|li|ul|ol)\b[^>]*>/gi, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const effective = (row, key) => row.override?.[key] || row.api[key];

export default function ServicesAdminPage() {
  const [leadType, setLeadType] = useState(1);
  const [rows, setRows] = useState([]);
  const [feedTitle, setFeedTitle] = useState("");
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(null); // row
  const [form, setForm] = useState({ title: "", description: "", image: "", sort_order: "" });
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(null); // row

  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/services?lead_type=${leadType}`);
      const d = await res.json();
      if (d.success) {
        setRows(d.rows);
        setFeedTitle(d.title);
      } else {
        setRows([]);
        showToast(d.message || "Failed to load services", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  }, [leadType]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      title: effective(row, "title") || "",
      description: effective(row, "description") || "",
      image: row.override?.image || "",
      sort_order: row.override?.sort_order ?? "",
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      // Only store what actually differs from the feed, so later feed edits
      // still show through for untouched fields.
      const title = form.title.trim() === (editing.api.title || "").trim() ? "" : form.title;
      const description =
        normHtml(form.description) === normHtml(editing.api.description) ? "" : form.description;

      const res = await fetch("/api/admin/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: editing.id,
          lead_type: leadType,
          title,
          description,
          image: form.image,
          sort_order: form.sort_order,
        }),
      });
      const d = await res.json();
      if (d.success) {
        showToast(d.message || "Saved");
        setEditing(null);
        fetchRows();
      } else {
        showToast(d.message || "Save failed", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!resetting) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/services?service_id=${resetting.id}`, {
        method: "DELETE",
      });
      const d = await res.json();
      if (d.success) {
        showToast(d.message);
        fetchRows();
      } else {
        showToast(d.message || "Reset failed", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
      setResetting(null);
    }
  };

  // Show rows in the order the site will (sort_order first, then feed order).
  const ordered = rows
    .map((r, i) => ({ r, i }))
    .sort((a, b) => {
      const ao = a.r.override?.sort_order ?? Infinity;
      const bo = b.r.override?.sort_order ?? Infinity;
      return ao === bo ? a.i - b.i : ao - bo;
    })
    .map(({ r }) => r);

  return (
    <div>
      <PageHead
        eyebrow="Catalogue"
        title="Services"
        subtitle="Service ids and prices come from the services API. Title, description, image and order are managed here and apply on every city and brand page — blank fields use the API's value."
        count={rows.length}
        countLabel="services"
      />

      <div className="adm-toolbar">
        <Field label="Category">
          <Select value={leadType} onChange={(e) => setLeadType(parseInt(e.target.value, 10))}>
            {LEAD_TYPES.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
        {feedTitle && (
          <span className="adm-tabhint" style={{ alignSelf: "flex-end", paddingBottom: 10 }}>
            API title: <b>{feedTitle}</b>
          </span>
        )}
        <div style={{ flex: 1 }} />
        <Button onClick={fetchRows}>
          <RefreshCw size={16} /> Refresh
        </Button>
      </div>

      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ width: 70 }}>Order</th>
                <th style={{ width: 72 }}>Image</th>
                <th>Title</th>
                <th style={{ width: 70 }}>API id</th>
                <th style={{ width: 120 }}>Price</th>
                <th style={{ width: 120 }}>Status</th>
                <th style={{ width: 150 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading || ordered.length === 0 ? (
                <TableState
                  colSpan={7}
                  loading={loading}
                  emptyTitle="No services"
                  emptyHint="The services API returned nothing for this category."
                />
              ) : (
                ordered.map((r) => (
                  <tr key={r.id}>
                    <td className="col-muted">{r.override?.sort_order ?? "—"}</td>
                    <td>
                      {effective(r, "image") ? (
                        <img
                          src={effective(r, "image")}
                          alt=""
                          width={48}
                          height={48}
                          style={{ objectFit: "cover", borderRadius: 8 }}
                        />
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="col-strong">
                      {effective(r, "title")}
                      {r.override?.title && (
                        <div className="col-muted" style={{ fontSize: 12, fontWeight: 400 }}>
                          API: {r.api.title}
                        </div>
                      )}
                    </td>
                    <td className="col-id">{r.id}</td>
                    <td>
                      ₹{r.price}
                      {r.mrp && r.mrp !== r.price && (
                        <s className="col-muted" style={{ marginLeft: 6, fontSize: 12 }}>
                          ₹{r.mrp}
                        </s>
                      )}
                    </td>
                    <td>
                      {r.override ? <Badge tone="info">Customised</Badge> : <Badge>API</Badge>}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Button size="sm" onClick={() => openEdit(r)}>
                          <Pencil size={15} /> Edit
                        </Button>
                        {r.override && (
                          <Button
                            size="sm"
                            title="Reset to API values"
                            onClick={() => setResetting(r)}
                          >
                            <RotateCcw size={15} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <Modal
          title={`Edit service`}
          id={editing.id}
          size="wide"
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="primary" disabled={saving} onClick={save}>
                {saving ? "Saving…" : "Save service"}
              </Button>
            </>
          }
        >
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 140px", gap: 12 }}>
              <Field label="Title">
                <Input
                  value={form.title}
                  placeholder={editing.api.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
                <FieldNote>API: {editing.api.title}</FieldNote>
              </Field>
              <Field label="Sort order">
                <Input
                  type="number"
                  value={form.sort_order}
                  placeholder="API order"
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                />
                <FieldNote>Chhota number pehle</FieldNote>
              </Field>
            </div>

            <div>
              <label className="adm-label">Description</label>
              <TipTapEditorWithSEO
                key={editing.id}
                content={form.description}
                storagePath="services"
                onChange={(html) => setForm((f) => ({ ...f, description: html }))}
              />
            </div>

            <div>
              <label className="adm-label">Image</label>
              <FieldNote>
                Khaali chhodo to API wali image dikhegi
                {editing.api.image && (
                  <>
                    {" "}
                    (
                    <a href={editing.api.image} target="_blank" rel="noreferrer">
                      current API image
                    </a>
                    )
                  </>
                )}
                .
              </FieldNote>
              <ImageUploader
                value={form.image}
                storagePath="services"
                onChange={(url) => setForm((f) => ({ ...f, image: url || "" }))}
              />
            </div>

            <p className="adm-tabhint">
              Price API se aata hai: <b>₹{editing.price}</b>
              {editing.mrp ? ` (MRP ₹${editing.mrp})` : ""}. Ye change har city aur brand page
              pe lagu hoga.
            </p>
          </div>
        </Modal>
      )}

      {resetting && (
        <ConfirmDialog
          title="Reset to API values?"
          message={`"${effective(resetting, "title")}" ka title, description, image aur order hata ke API wale values wapas aa jayenge.`}
          saving={saving}
          confirmLabel="Yes, reset"
          tone="danger"
          onCancel={() => setResetting(null)}
          onConfirm={reset}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
