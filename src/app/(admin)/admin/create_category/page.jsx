"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft } from "lucide-react";
import TipTapEditorWithSEO from "@/app/(admin)/admin/components/TipTapEditorWithSEO";
import {
  PageHead,
  Field,
  FieldNote,
  SectionTitle,
  FormCard,
  Input,
  Select,
  Textarea,
  Button,
  Toast,
} from "@/app/(admin)/admin/components/AdminUI";

const INITIAL_FORM = {
  category_name: "",
  category_url: "",
  category_content: "",
  status: "1",
  phone: "",
  banner: "",
  icon: "",
  meta_title: "",
  meta_keywords: "",
  meta_description: "",
};

export default function CategoryCreatePage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [dupChecking, setDupChecking] = useState({
    category_name: false,
    category_url: false,
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const dupTimers = useRef({});

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const checkDuplicate = (field, value) => {
    clearTimeout(dupTimers.current[field]);
    if (!value.trim()) {
      setDupChecking((s) => ({ ...s, [field]: false }));
      setErrors((e) => ({ ...e, [field]: undefined }));
      return;
    }
    setDupChecking((s) => ({ ...s, [field]: true }));
    dupTimers.current[field] = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/create_category?type=check_duplicate&field=${field}&value=${encodeURIComponent(value.trim())}`
        );
        const data = await res.json();
        if (data.exists) {
          setErrors((e) => ({
            ...e,
            [field]:
              field === "category_name"
                ? "This category name is already taken."
                : "This category URL is already taken.",
          }));
        } else {
          setErrors((e) => ({ ...e, [field]: undefined }));
        }
      } catch {
        // silently ignore network errors during check
      } finally {
        setDupChecking((s) => ({ ...s, [field]: false }));
      }
    }, 450);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.category_name.trim())
      newErrors.category_name = "Category name is required.";
    if (!form.category_url.trim())
      newErrors.category_url = "Category URL is required.";
    if (errors.category_name) newErrors.category_name = errors.category_name;
    if (errors.category_url) newErrors.category_url = errors.category_url;
    return newErrors;
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/create_category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Category created successfully! (ID: ${data.category_id})`);
        setForm(INITIAL_FORM);
        setErrors({});
      } else {
        if (data.errors) {
          setErrors(data.errors);
          showToast(data.message || "Please fix the errors below.", "error");
        } else {
          showToast(data.message || "Failed to create category.", "error");
        }
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
  };

  const isBusy = saving || dupChecking.category_name || dupChecking.category_url;
  const errClass = (f) => (errors[f] ? "err" : "");

  return (
    <div>
      <PageHead
        eyebrow="Catalogue"
        title="Create Category"
        subtitle="Add a new service category with media, SEO meta and content."
      />

      <div style={{ marginBottom: 18 }}>
        <Link href="/admin/category_edits" className="adm-btn adm-btn-sm">
          <ArrowLeft size={15} /> Back to categories
        </Link>
      </div>

      <FormCard>
        {/* Basic info */}
        <div className="adm-section">
          <SectionTitle>Basic info</SectionTitle>
          <div className="adm-formgrid">
            <Field label="Category name *">
              <Input
                className={errClass("category_name")}
                placeholder="e.g. Electronics"
                value={form.category_name}
                onChange={(e) => {
                  setField("category_name", e.target.value);
                  checkDuplicate("category_name", e.target.value);
                }}
              />
              {dupChecking.category_name ? (
                <FieldNote tone="checking">Checking availability…</FieldNote>
              ) : (
                errors.category_name && <FieldNote tone="err">{errors.category_name}</FieldNote>
              )}
            </Field>

            <Field label="Category URL *">
              <Input
                className={errClass("category_url")}
                placeholder="e.g. electronics"
                value={form.category_url}
                onChange={(e) => {
                  const slug = e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, "");
                  setField("category_url", slug);
                  checkDuplicate("category_url", slug);
                }}
              />
              {dupChecking.category_url ? (
                <FieldNote tone="checking">Checking availability…</FieldNote>
              ) : errors.category_url ? (
                <FieldNote tone="err">{errors.category_url}</FieldNote>
              ) : (
                <FieldNote tone="hint">Auto-formatted to a lowercase slug.</FieldNote>
              )}
            </Field>

            <Field label="Status">
              <Select value={form.status} onChange={(e) => setField("status", e.target.value)}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </Select>
            </Field>

            <Field label="Phone">
              <Input
                placeholder="e.g. +91 98765 43210"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Media */}
        <div className="adm-section">
          <SectionTitle>Media</SectionTitle>
          <div className="adm-formgrid">
            <Field label="Banner URL">
              <Input
                placeholder="e.g. /banners/electronics.jpg"
                value={form.banner}
                onChange={(e) => setField("banner", e.target.value)}
              />
            </Field>
            <Field label="Icon URL / class">
              <Input
                placeholder="e.g. /icons/electronics.png"
                value={form.icon}
                onChange={(e) => setField("icon", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* SEO / Meta */}
        <div className="adm-section">
          <SectionTitle>SEO / Meta</SectionTitle>
          <div className="adm-formgrid">
            <Field label="Meta title" className="full">
              <Input
                placeholder="Page title for search engines"
                value={form.meta_title}
                onChange={(e) => setField("meta_title", e.target.value)}
              />
            </Field>
            <Field label="Meta keywords" className="full">
              <Textarea
                rows={2}
                placeholder="keyword1, keyword2, keyword3"
                value={form.meta_keywords}
                onChange={(e) => setField("meta_keywords", e.target.value)}
              />
            </Field>
            <Field label="Meta description" className="full">
              <Textarea
                rows={3}
                placeholder="Brief description for search engines (150–160 chars recommended)"
                value={form.meta_description}
                onChange={(e) => setField("meta_description", e.target.value)}
              />
              <p className={`adm-counter ${form.meta_description.length > 160 ? "over" : ""}`}>
                {form.meta_description.length} / 160
              </p>
            </Field>
          </div>
        </div>

        {/* Content */}
        <div className="adm-section">
          <SectionTitle>Category content</SectionTitle>
          <TipTapEditorWithSEO
            content={form.category_content}
            onChange={(html) => setField("category_content", html)}
          />
        </div>

        {/* Actions */}
        <div className="adm-formactions">
          <Button onClick={handleReset}>Reset form</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={isBusy}>
            {saving ? (
              <>
                <Loader2 size={16} className="adm-spin" /> Creating…
              </>
            ) : (
              "Create category"
            )}
          </Button>
        </div>
      </FormCard>

      <Toast toast={toast} />
    </div>
  );
}
