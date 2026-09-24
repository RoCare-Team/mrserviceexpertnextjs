"use client";

import { useCallback, useEffect, useState } from "react";
import { Globe2, MapPin, Info } from "lucide-react";
import {
  PageHead,
  FormCard,
  Field,
  Input,
  Select,
  Button,
  FieldNote,
  SectionTitle,
  ConfirmDialog,
  Toast,
} from "@/app/(admin)/admin/components/AdminUI";

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const EMPTY = { brand_name: "", brand_url: "", category_id: "", scope: "near_me" };

export default function BrandRolloutPage() {
  const [form, setForm] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [categories, setCategories] = useState([]);
  const [preview, setPreview] = useState(null);
  const [dupes, setDupes] = useState({});
  const [errors, setErrors] = useState({});
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [result, setResult] = useState(null);

  const setField = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const category = categories.find((c) => String(c.id) === String(form.category_id));

  useEffect(() => {
    fetch("/api/admin/brand_rollout?type=categories")
      .then((r) => r.json())
      .then((d) => d.success && setCategories(d.categories || []))
      .catch(() => setToast({ tone: "error", message: "Could not load categories." }));
  }, []);

  // Keep the slug in step with the name until the admin edits it by hand.
  useEffect(() => {
    if (!slugTouched) setForm((f) => ({ ...f, brand_url: slugify(f.brand_name) }));
  }, [form.brand_name, slugTouched]);

  // How many pages this rollout would write. Recomputed whenever the inputs
  // that change the answer change, so the number on the button is never stale.
  const loadPreview = useCallback(async () => {
    if (!form.category_id) return setPreview(null);
    const qs = new URLSearchParams({
      type: "preview",
      scope: form.scope,
      category_id: form.category_id,
      brand_url: form.brand_url,
    });
    try {
      const d = await (await fetch(`/api/admin/brand_rollout?${qs}`)).json();
      setPreview(d.success ? d : null);
      if (!d.success) setToast({ tone: "error", message: d.message });
    } catch {
      setPreview(null);
    }
  }, [form.scope, form.category_id, form.brand_url]);

  useEffect(() => {
    const t = setTimeout(loadPreview, 250);
    return () => clearTimeout(t);
  }, [loadPreview]);

  // Live duplicate check, per category (a slug may repeat across categories).
  useEffect(() => {
    if (!form.category_id) return;
    const t = setTimeout(async () => {
      const check = async (field, value) => {
        if (!value) return false;
        const qs = new URLSearchParams({
          type: "check_duplicate", field, value, category_id: form.category_id,
        });
        const d = await (await fetch(`/api/admin/brand_rollout?${qs}`)).json();
        return Boolean(d.exists);
      };
      try {
        setDupes({
          brand_name: await check("brand_name", form.brand_name.trim()),
          brand_url: await check("brand_url", form.brand_url.trim()),
        });
      } catch {}
    }, 400);
    return () => clearTimeout(t);
  }, [form.brand_name, form.brand_url, form.category_id]);

  const validate = () => {
    const e = {};
    if (!form.brand_name.trim()) e.brand_name = "Brand name is required.";
    if (!form.brand_url.trim()) e.brand_url = "Brand URL is required.";
    else if (!/^[a-z0-9-]+$/.test(form.brand_url))
      e.brand_url = "Only lowercase letters, numbers and hyphens.";
    if (!form.category_id) e.category_id = "Pick a category.";
    else if (category && !category.hasCopy)
      e.category_id = "This category has no page wording yet — add it to src/lib/pageContent.js.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/brand_rollout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!d.success) {
        setErrors(d.errors || {});
        setToast({ tone: "error", message: d.message || "Could not create the brand." });
        return;
      }
      setResult(d);
      setToast({ tone: "success", message: d.message });
      setForm(EMPTY);
      setSlugTouched(false);
      setPreview(null);
    } catch (err) {
      setToast({ tone: "error", message: err.message });
    } finally {
      setSaving(false);
      setConfirming(false);
    }
  };

  const isAll = form.scope === "all";
  const count = preview?.toCreate ?? 0;

  return (
    <>
      <PageHead
        eyebrow="Catalogue"
        title="Add Brand"
        subtitle="Create a brand and decide whether it appears on every city or only on Near Me."
      />

      <FormCard>
        <SectionTitle>Brand</SectionTitle>

        <div className="adm-formgrid">
          <Field label="Brand name">
            <Input
              value={form.brand_name}
              placeholder="e.g. Blue Star"
              onChange={(e) => setField("brand_name", e.target.value)}
            />
            {errors.brand_name && <FieldNote tone="err">{errors.brand_name}</FieldNote>}
            {!errors.brand_name && dupes.brand_name && (
              <FieldNote tone="err">This name already exists in the selected category.</FieldNote>
            )}
          </Field>

          <Field label="Brand URL">
            <Input
              value={form.brand_url}
              placeholder="blue-star"
              onChange={(e) => {
                setSlugTouched(true);
                setField("brand_url", e.target.value);
              }}
            />
            {errors.brand_url && <FieldNote tone="err">{errors.brand_url}</FieldNote>}
            {!errors.brand_url && dupes.brand_url && (
              <FieldNote tone="err">
                This URL already exists in the selected category — submitting will top up its
                missing pages instead of creating a second brand.
              </FieldNote>
            )}
          </Field>
        </div>

        <Field label="Category">
          <Select
            value={form.category_id}
            onChange={(e) => setField("category_id", e.target.value)}
          >
            <option value="">Select a category…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id} disabled={!c.hasCopy}>
                {c.category_name}
                {c.hasCopy ? "" : "  (no page wording yet)"}
              </option>
            ))}
          </Select>
          {errors.category_id && <FieldNote tone="err">{errors.category_id}</FieldNote>}
        </Field>

        <SectionTitle>Where should it show?</SectionTitle>

        <div className="adm-formgrid">
          <ScopeCard
            active={form.scope === "near_me"}
            icon={MapPin}
            title="Near Me only"
            body="One page, at /near-me/{brand}/{category}. The brand will not appear on any other city."
            onClick={() => setField("scope", "near_me")}
          />
          <ScopeCard
            active={isAll}
            icon={Globe2}
            title="All cities"
            body="One page per city, at /{city}/{brand}/{category}. Every city page lists the brand."
            onClick={() => setField("scope", "all")}
          />
        </div>

        <div className="adm-note-box">
          <Info size={16} />
          <div>
            <strong>How visibility works here.</strong> A brand shows on a city page only when a
            page exists for that city, so this choice is really about how many pages get written.
            You can start with Near Me and submit the same brand again later as All cities — the
            second run only adds the pages that are missing.
          </div>
        </div>

        {preview && (
          <div className="adm-note-box">
            <Info size={16} />
            <div>
              Will create <strong>{preview.toCreate}</strong>{" "}
              page{preview.toCreate === 1 ? "" : "s"} across{" "}
              <strong>{preview.cities}</strong> {isAll ? "cities" : "city"}
              {preview.existing > 0 && <> · {preview.existing} already exist and will be left alone</>}
              {isAll && preview.toCreate > 500 && (
                <div style={{ marginTop: 6 }}>
                  This writes a lot of rows and takes a few seconds. Leave the tab open until it
                  finishes.
                </div>
              )}
            </div>
          </div>
        )}

        <div className="adm-formactions">
          <Button
            variant="primary"
            disabled={saving || !form.category_id}
            onClick={() => validate() && setConfirming(true)}
          >
            {saving ? "Creating…" : count ? `Create brand + ${count} page${count === 1 ? "" : "s"}` : "Create brand"}
          </Button>
        </div>
      </FormCard>

      {result && (
        <FormCard>
          <SectionTitle>Done</SectionTitle>
          <p>
            <strong>{result.brand.brand_name}</strong> — {result.pagesCreated} page
            {result.pagesCreated === 1 ? "" : "s"} created
            {result.pagesAlreadyThere > 0 && <>, {result.pagesAlreadyThere} already existed</>}.
          </p>
          <FieldNote tone="hint">{result.note}</FieldNote>
        </FormCard>
      )}

      {confirming && (
        <ConfirmDialog
          title={isAll ? "Create pages for every city?" : "Create the Near Me page?"}
          message={
            isAll
              ? `This writes ${count} page${count === 1 ? "" : "s"} — one for each city — and the brand will show across the whole site. This cannot be undone from here.`
              : `This writes ${count} page${count === 1 ? "" : "s"}. The brand will appear on Near Me pages only.`
          }
          confirmLabel={saving ? "Creating…" : "Yes, create"}
          saving={saving}
          tone={isAll ? "danger" : undefined}
          onCancel={() => setConfirming(false)}
          onConfirm={submit}
        />
      )}

      <Toast toast={toast} />
    </>
  );
}

function ScopeCard({ active, icon: Icon, title, body, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`adm-scope-card${active ? " is-active" : ""}`}>
      <span className="adm-scope-icon">
        <Icon size={18} />
      </span>
      <span className="adm-scope-text">
        <strong>{title}</strong>
        <span>{body}</span>
      </span>
    </button>
  );
}
