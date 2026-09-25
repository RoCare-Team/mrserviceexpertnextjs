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
import CityPicker from "@/app/(admin)/admin/components/CityPicker";

// mode "pick" builds the URL from City + Category (+ Brand); "custom" is typed.
const EMPTY = {
  mode: "pick",
  title: "",
  url: "",
  sort_order: 0,
  status: "1",
  city: null,
  category_id: "",
  brand_id: "",
};

/** URL + default title for a City + Category (+ Brand) selection, or null. */
function buildLink(city, category, brand) {
  if (!city || !category) return null;
  const url = brand
    ? `/${city.city_url}/${brand.brand_url}/${category.category_url}`
    : `/${city.city_url}/${category.category_url}`;
  const what = [brand?.brand_name, category.category_name].filter(Boolean).join(" ");
  const suffix = /service|repair/i.test(category.category_name) ? "" : " Service";
  return { url, title: `${what}${suffix} in ${city.city_name}` };
}

export default function OtherCitiesPage() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {…} (id absent = new)
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

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
    fetch("/api/admin/other_cities?type=lookup")
      .then((r) => r.json())
      .then((d) => {
        if (!d.success) return;
        setCategories(d.categories || []);
        setBrands(d.brands || []);
      })
      .catch(() => {});
  }, [load]);

  // Apply a change to the picker and rebuild url + title from it.
  const pick = (patch) => {
    const next = { ...editing, ...patch };
    const category = categories.find((c) => String(c.id) === String(next.category_id));
    const brand = brands.find((b) => String(b.id) === String(next.brand_id));
    const built = buildLink(next.city, category, brand);
    setEditing(built ? { ...next, ...built } : { ...next, url: "" });
  };

  const categoryBrands = brands.filter(
    (b) => String(b.category_id) === String(editing?.category_id)
  );

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const isNew = !editing.id;
      const res = await fetch("/api/admin/other_cities", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          title: editing.title,
          url: editing.url,
          sort_order: editing.sort_order,
          status: editing.status,
        }),
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
        title="Homepage Cities"
        subtitle="Links shown in the Homepage Cities dropdown on the homepage."
        count={links.length}
        countLabel="links"
      />

      <FormCard>
        <div className="adm-note-box">
          <Info size={16} />
          <div>
            These appear on the homepage, directly under <strong>Popular Cities</strong>. Pick a
            City + Category (+ Brand) and the URL is built for you, or switch to{" "}
            <strong>Custom URL</strong> for an internal path like <code>/gurgaon/ac</code> or a
            full <code>https://</code> URL.
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
                      <EditButton onClick={() => { setErrors({}); setEditing({ ...EMPTY, ...l, mode: "custom" }); }} />
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

          <Field label="Link type">
            <Select
              value={editing.mode}
              onChange={(e) => setEditing({ ...editing, mode: e.target.value })}
            >
              <option value="pick">Pick page (City + Category + Brand)</option>
              <option value="custom">Custom URL</option>
            </Select>
          </Field>

          {editing.mode === "pick" && (
            <>
              <Field label="City">
                <CityPicker
                  valueLabel={editing.city?.city_name}
                  onPick={(c) => pick({ city: c })}
                  onClear={() => pick({ city: null })}
                />
              </Field>

              <div className="adm-formgrid">
                <Field label="Category">
                  <Select
                    value={String(editing.category_id)}
                    onChange={(e) => pick({ category_id: e.target.value, brand_id: "" })}
                  >
                    <option value="">— select —</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.category_name}</option>
                    ))}
                  </Select>
                </Field>

                <Field label="Brand (optional)">
                  <Select
                    value={String(editing.brand_id)}
                    disabled={!editing.category_id}
                    onChange={(e) => pick({ brand_id: e.target.value })}
                  >
                    <option value="">— no brand —</option>
                    {categoryBrands.map((b) => (
                      <option key={b.id} value={b.id}>{b.brand_name}</option>
                    ))}
                  </Select>
                </Field>
              </div>
            </>
          )}

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
              readOnly={editing.mode === "pick"}
              onChange={(e) => setEditing({ ...editing, url: e.target.value })}
            />
            {errors.url ? (
              <FieldNote tone="err">{errors.url}</FieldNote>
            ) : editing.mode === "pick" ? (
              <FieldNote tone="hint">
                Built from the selection above. Switch to Custom URL to type your own.
              </FieldNote>
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
