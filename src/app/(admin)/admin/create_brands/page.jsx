"use client";

import { useEffect, useState, useRef } from "react";
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
  brand_name: "",
  brand_url: "",
  category_id: "",
  status: "1",
  icon: "",
  meta_title: "",
  meta_keywords: "",
  meta_description: "",
  brand_content: "",
};

export default function BrandCreatePage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [dupChecking, setDupChecking] = useState({ brand_name: false, brand_url: false });
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const dupTimers = useRef({});

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetch("/api/admin/create_brand?type=categories")
      .then((r) => r.json())
      .then((d) => d.success && setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const checkDuplicate = (field, value) => {
    clearTimeout(dupTimers.current[field]);
    if (!value.trim()) {
      setDupChecking((s) => ({ ...s, [field]: false }));
      return;
    }
    setDupChecking((s) => ({ ...s, [field]: true }));
    dupTimers.current[field] = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/create_brand?type=check_duplicate&field=${field}&value=${encodeURIComponent(value.trim())}`
        );
        const data = await res.json();
        if (data.exists) {
          setErrors((e) => ({
            ...e,
            [field]: `This ${field === "brand_name" ? "brand name" : "brand URL"} is already taken.`,
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
    if (!form.brand_name.trim()) newErrors.brand_name = "Brand name is required.";
    if (!form.brand_url.trim()) newErrors.brand_url = "Brand URL is required.";
    if (errors.brand_name) newErrors.brand_name = errors.brand_name;
    if (errors.brand_url) newErrors.brand_url = errors.brand_url;
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
      const res = await fetch("/api/admin/create_brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Brand created! (ID: ${data.brand_id})`);
        setForm(INITIAL_FORM);
        setErrors({});
      } else {
        if (data.errors) {
          setErrors(data.errors);
          showToast(data.message || "Please fix the errors below.", "error");
        } else {
          showToast(data.message || "Failed to create brand.", "error");
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

  const isBusy = saving || dupChecking.brand_name || dupChecking.brand_url;
  const errClass = (f) => (errors[f] ? "err" : "");

  return (
    <div>
      <PageHead
        eyebrow="Catalogue"
        title="Create Brand"
        subtitle="Add a new brand with its SEO meta and rich content."
      />

      <div style={{ marginBottom: 18 }}>
        <Link href="/admin/brand_edits" className="adm-btn adm-btn-sm">
          <ArrowLeft size={15} /> Back to brands
        </Link>
      </div>

      <FormCard>
        {/* Basic info */}
        <div className="adm-section">
          <SectionTitle>Basic info</SectionTitle>
          <div className="adm-formgrid">
            <Field label="Brand name *">
              <Input
                className={errClass("brand_name")}
                placeholder="e.g. Samsung"
                value={form.brand_name}
                onChange={(e) => {
                  setField("brand_name", e.target.value);
                  checkDuplicate("brand_name", e.target.value);
                }}
              />
              {dupChecking.brand_name ? (
                <FieldNote tone="checking">Checking availability…</FieldNote>
              ) : (
                errors.brand_name && <FieldNote tone="err">{errors.brand_name}</FieldNote>
              )}
            </Field>

            <Field label="Brand URL *">
              <Input
                className={errClass("brand_url")}
                placeholder="e.g. samsung"
                value={form.brand_url}
                onChange={(e) => {
                  const slug = e.target.value.toLowerCase().replace(/\s+/g, "-");
                  setField("brand_url", slug);
                  checkDuplicate("brand_url", slug);
                }}
              />
              {dupChecking.brand_url ? (
                <FieldNote tone="checking">Checking availability…</FieldNote>
              ) : errors.brand_url ? (
                <FieldNote tone="err">{errors.brand_url}</FieldNote>
              ) : (
                <FieldNote tone="hint">Used as the URL slug. Auto-formatted to lowercase.</FieldNote>
              )}
            </Field>

            <Field label="Category">
              <Select value={form.category_id} onChange={(e) => setField("category_id", e.target.value)}>
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.category_name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Status">
              <Select value={form.status} onChange={(e) => setField("status", e.target.value)}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </Select>
            </Field>

            <Field label="Icon URL / class" className="full">
              <Input
                placeholder="e.g. /icons/samsung.png or fa-brand"
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
                placeholder="Page title for SEO"
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
          <SectionTitle>Brand content</SectionTitle>
          <TipTapEditorWithSEO
            content={form.brand_content}
            onChange={(html) => setField("brand_content", html)}
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
              "Create brand"
            )}
          </Button>
        </div>
      </FormCard>

      <Toast toast={toast} />
    </div>
  );
}
