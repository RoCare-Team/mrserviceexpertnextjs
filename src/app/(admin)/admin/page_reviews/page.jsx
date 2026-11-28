"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Info, ExternalLink } from "lucide-react";
import {
  PageHead,
  FormCard,
  Field,
  Input,
  Select,
  Textarea,
  Button,
  FieldNote,
  SectionTitle,
  StatusBadge,
  EditButton,
  TableState,
  ConfirmDialog,
  Modal,
  Toast,
  SearchInput,
} from "@/app/(admin)/admin/components/AdminUI";

const SITE = "https://www.mrserviceexpert.com";
const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = { page_url: "", customer_name: "", customer_city: "", rating: 5, review_text: "", review_date: "", status: "1", sort_order: 0 };

/** Same rule as lib/pageReviews normalizePageUrl, for the live preview. */
function clean(input) {
  let s = String(input || "").trim().replace(/^https?:\/\/[^/]+/i, "").split(/[?#]/)[0];
  return s.toLowerCase().replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
}

const stars = (n) => "★".repeat(n) + "☆".repeat(5 - n);

export default function PageReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [toast, setToast] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await (await fetch("/api/admin/page_reviews")).json();
      if (d.success) {
        setReviews(d.reviews || []);
        setPages(d.pages || []);
      } else setToast({ tone: "error", message: d.message });
    } catch (e) {
      setToast({ tone: "error", message: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = useMemo(() => {
    const f = clean(filter);
    return f ? reviews.filter((r) => r.page_url.includes(f)) : reviews;
  }, [reviews, filter]);

  const open = (row) => {
    setErrors({});
    // New review: prefill the URL being filtered, so adding several for one page is quick.
    setEditing(row ? { ...EMPTY, ...row, customer_city: row.customer_city || "", review_date: row.review_date || "" } : { ...EMPTY, page_url: clean(filter), review_date: today() });
  };

  const save = async () => {
    setSaving(true);
    setErrors({});
    try {
      const res = await fetch("/api/admin/page_reviews", {
        method: editing.id ? "PUT" : "POST",
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
      const d = await (await fetch(`/api/admin/page_reviews?id=${deleting.id}`, { method: "DELETE" })).json();
      setToast({ tone: d.success ? "success" : "error", message: d.message });
      if (d.success) load();
    } catch (e) {
      setToast({ tone: "error", message: e.message });
    } finally {
      setSaving(false);
      setDeleting(null);
    }
  };

  const set = (k) => (e) => setEditing({ ...editing, [k]: e.target.value });

  return (
    <>
      <PageHead
        eyebrow="Content"
        title="Page Reviews"
        subtitle="Customer reviews shown on service pages, added per page URL."
        count={reviews.length}
        countLabel={`reviews on ${pages.length} pages`}
      />

      <FormCard>
        <div className="adm-note-box">
          <Info size={16} />
          <div>
            Each review shows only on the exact service page it is added for: <code>/city/category</code> like <code>/delhi/ac</code>, or{" "}
            <code>/city/brand/category</code> like <code>/delhi/samsung/ac</code> (you can paste the full link too). Pages with active reviews get a
            reviews section and their star rating in Google schema is calculated from these reviews.
            Pages with no reviews stay as they are. Lower <strong>Order</strong> values show first.
          </div>
        </div>

        <div className="adm-formactions" style={{ gap: 10, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 260px" }}>
            <SearchInput placeholder="Filter by page URL, e.g. delhi/ac" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          <Button variant="primary" onClick={() => open(null)}>
            <Plus size={15} /> Add review
          </Button>
        </div>

        <table className="adm-table">
          <thead>
            <tr>
              <th>Page URL</th>
              <th>Customer</th>
              <th style={{ width: 100 }}>Rating</th>
              <th>Review</th>
              <th style={{ width: 60 }}>Order</th>
              <th style={{ width: 90 }}>Status</th>
              <th style={{ width: 130 }}></th>
            </tr>
          </thead>
          <tbody>
            {loading || !shown.length ? (
              <TableState colSpan={7} loading={loading} emptyTitle="No reviews yet" emptyHint="Add a review for a page URL and it will show on that page." />
            ) : (
              shown.map((r) => (
                <tr key={r.id}>
                  <td className="adm-mono">
                    <a href={`/${r.page_url}`} target="_blank" rel="noreferrer" style={{ display: "inline-flex", gap: 4, alignItems: "center" }}>
                      /{r.page_url} <ExternalLink size={12} />
                    </a>
                  </td>
                  <td>
                    {r.customer_name}
                    {r.customer_city ? <div style={{ fontSize: 12, opacity: 0.7 }}>{r.customer_city}</div> : null}
                  </td>
                  <td style={{ color: "#f59e0b", whiteSpace: "nowrap" }}>{stars(r.rating)}</td>
                  <td style={{ maxWidth: 360 }}>
                    <div style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{r.review_text}</div>
                  </td>
                  <td>{r.sort_order}</td>
                  <td>
                    <StatusBadge status={r.status} />
                  </td>
                  <td>
                    <div className="adm-rowactions">
                      <EditButton onClick={() => open(r)} />
                      <Button size="sm" variant="danger" onClick={() => setDeleting(r)}>
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
          title={editing.id ? "Edit review" : "Add review"}
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
          <SectionTitle>Page</SectionTitle>
          <Field label="Page URL">
            <Input value={editing.page_url} placeholder="/delhi/ac" onChange={set("page_url")} />
            {errors.page_url ? (
              <FieldNote tone="err">{errors.page_url}</FieldNote>
            ) : (
              <FieldNote tone="hint">
                Shows on: {clean(editing.page_url) ? <code>{SITE}/{clean(editing.page_url)}</code> : "—"}
              </FieldNote>
            )}
          </Field>

          <SectionTitle>Review</SectionTitle>
          <div className="adm-formgrid">
            <Field label="Customer name">
              <Input value={editing.customer_name} placeholder="Rahul Sharma" onChange={set("customer_name")} />
              {errors.customer_name && <FieldNote tone="err">{errors.customer_name}</FieldNote>}
            </Field>
            <Field label="Customer city / area (optional)">
              <Input value={editing.customer_city} placeholder="Dwarka, Delhi" onChange={set("customer_city")} />
            </Field>
          </div>

          <Field label="Review">
            <Textarea rows={4} value={editing.review_text} placeholder="What the customer said…" onChange={set("review_text")} />
            {errors.review_text && <FieldNote tone="err">{errors.review_text}</FieldNote>}
          </Field>

          <div className="adm-formgrid">
            <Field label="Rating">
              <Select value={String(editing.rating)} onChange={(e) => setEditing({ ...editing, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {stars(n)} ({n})
                  </option>
                ))}
              </Select>
              {errors.rating && <FieldNote tone="err">{errors.rating}</FieldNote>}
            </Field>
            <Field label="Review date">
              <Input type="date" value={editing.review_date} onChange={set("review_date")} />
              {errors.review_date && <FieldNote tone="err">{errors.review_date}</FieldNote>}
            </Field>
          </div>

          <div className="adm-formgrid">
            <Field label="Order">
              <Input type="number" value={editing.sort_order} onChange={set("sort_order")} />
            </Field>
            <Field label="Status">
              <Select value={editing.status} onChange={set("status")}>
                <option value="1">Active</option>
                <option value="0">Hidden</option>
              </Select>
            </Field>
          </div>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete this review?"
          message={`${deleting.customer_name}'s review will be removed from /${deleting.page_url}.`}
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
