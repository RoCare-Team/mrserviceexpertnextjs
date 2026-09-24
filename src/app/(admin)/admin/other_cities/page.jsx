"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Info } from "lucide-react";
import {
  PageHead,
  FormCard,
  Field,
  Input,
  Select,
  Button,
  FieldNote,
  SectionTitle,
  StatusBadge,
  EditButton,
  TableState,
  ConfirmDialog,
  Modal,
  Toast,
} from "@/app/(admin)/admin/components/AdminUI";

const EMPTY = { title: "", url: "", sort_order: 0, status: "1" };

export default function OtherCitiesPage() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {…} (id absent = new)
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await (await fetch("/api/admin/other_cities")).json();
      if (d.success) setLinks(d.links || []);
      else setToast({ tone: "error", message: d.message });
    } catch (e) {
      setToast({ tone: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const isNew = !editing.id;
      const res = await fetch("/api/admin/other_cities", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const d = await res.json();
      if (!d.success) {
        setErrors(d.errors || {});
        setToast({ tone: "error", message: d.message });
        return;
      }
      setToast({ tone: "success", message: d.message });
      setEditing(null);
      load();
    } catch (e) {
      setToast({ tone: "error", message: e.message });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    try {
      const d = await (
        await fetch(`/api/admin/other_cities?id=${deleting.id}`, { method: "DELETE" })
      ).json();
      setToast({
        tone: d.success ? "success" : "error",
        message: d.message,
      });
      if (d.success) load();
    } catch (e) {
      setToast({ tone: "error", message: e.message });
    } finally {
      setSaving(false);
      setDeleting(null);
    }
  };

  return (
    <>
      <PageHead
        eyebrow="Content"
        title="Other Cities"
        subtitle="Links shown in the Other Cities dropdown on the homepage."
        count={links.length}
        countLabel="links"
      />

      <FormCard>
        <div className="adm-note-box">
          <Info size={16} />
          <div>
            These appear on the homepage, directly under <strong>Popular Cities</strong>. Use an
            internal path like <code>/gurgaon/ac</code>, or a full <code>https://</code> URL.
            Lower <strong>Order</strong> values come first. The homepage caches for a few minutes,
            so give it a moment before checking.
          </div>
        </div>

        <div className="adm-formactions">
          <Button variant="primary" onClick={() => { setErrors({}); setEditing({ ...EMPTY }); }}>
            <Plus size={15} /> Add link
          </Button>
        </div>

        <table className="adm-table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>Order</th>
              <th>Title</th>
              <th>URL</th>
              <th style={{ width: 90 }}>Status</th>
              <th style={{ width: 130 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading || !links.length ? (
              <TableState
                colSpan={5}
                loading={loading}
                emptyTitle="No links yet"
                emptyHint="Add the first one and it will show on the homepage."
              />
            ) : (
              links.map((l) => (
                <tr key={l.id}>
                  <td>{l.sort_order}</td>
                  <td>{l.title}</td>
                  <td className="adm-mono">{l.url}</td>
                  <td>
                    <StatusBadge status={l.status} />
                  </td>
                  <td>
                    <div className="adm-rowactions">
                      <EditButton onClick={() => { setErrors({}); setEditing({ ...l }); }} />
                      <Button size="sm" variant="danger" onClick={() => setDeleting(l)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </FormCard>

      {editing && (
        <Modal
          title={editing.id ? "Edit link" : "Add link"}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="primary" disabled={saving} onClick={save}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </>
          }
        >
          <SectionTitle>Link</SectionTitle>

          <Field label="Title">
            <Input
              value={editing.title}
              placeholder="AC Service in Gurgaon"
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
            />
            {errors.title && <FieldNote tone="err">{errors.title}</FieldNote>}
          </Field>

          <Field label="URL">
            <Input
              value={editing.url}
              placeholder="/gurgaon/ac"
              onChange={(e) => setEditing({ ...editing, url: e.target.value })}
            />
            {errors.url ? (
              <FieldNote tone="err">{errors.url}</FieldNote>
            ) : (
              <FieldNote tone="hint">
                Internal path (a leading slash is added for you) or a full https:// URL.
              </FieldNote>
            )}
          </Field>

          <div className="adm-formgrid">
            <Field label="Order">
              <Input
                type="number"
                value={editing.sort_order}
                onChange={(e) => setEditing({ ...editing, sort_order: e.target.value })}
              />
            </Field>

            <Field label="Status">
              <Select
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value })}
              >
                <option value="1">Active</option>
                <option value="0">Hidden</option>
              </Select>
            </Field>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this link?"
          message={`"${deleting.title}" will stop showing on the homepage.`}
          confirmLabel={saving ? "Deleting…" : "Yes, delete"}
          saving={saving}
          tone="danger"
          onCancel={() => setDeleting(null)}
          onConfirm={remove}
        />
      )}

      <Toast toast={toast} />
    </>
  );
}
