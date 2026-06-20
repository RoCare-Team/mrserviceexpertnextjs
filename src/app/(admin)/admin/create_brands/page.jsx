"use client";

import { useEffect, useState, useRef } from "react";
import TipTapEditorWithSEO from "@/app/(admin)/admin/components/TipTapEditorWithSEO";

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

  // Debounce timers for duplicate checks
  const dupTimers = useRef({});

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load categories on mount
  useEffect(() => {
    fetch("/api/admin/create_brand?type=categories")
      .then((r) => r.json())
      .then((d) => d.success && setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    // Clear existing error for this field on change
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  // Real-time duplicate check for brand_name / brand_url
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
    // Don't submit if there are already duplicate errors
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
        // Server returned field-level errors (duplicate, validation)
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

  const Field = ({ label, required, error, checking, children }) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {checking && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <span className="inline-block w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          Checking availability…
        </p>
      )}
      {error && !checking && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );

  const inputClass = (field) =>
    `border rounded-lg p-2.5 text-sm w-full focus:outline-none focus:ring-2 transition ${
      errors[field]
        ? "border-red-400 focus:ring-red-200"
        : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
    }`;

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Create New Brand</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fields marked <span className="text-red-500">*</span> are required.
          </p>
        </div>
        <a
          href="/admin/brands/edit"
          className="text-sm text-blue-600 hover:underline hidden sm:block"
        >
          ← Back to brand list
        </a>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-6">
        {/* Row 1: Brand Name + URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field
            label="Brand Name"
            required
            error={errors.brand_name}
            checking={dupChecking.brand_name}
          >
            <input
              className={inputClass("brand_name")}
              placeholder="e.g. Samsung"
              value={form.brand_name}
              onChange={(e) => {
                setField("brand_name", e.target.value);
                checkDuplicate("brand_name", e.target.value);
              }}
            />
          </Field>

          <Field
            label="Brand URL"
            required
            error={errors.brand_url}
            checking={dupChecking.brand_url}
          >
            <input
              className={inputClass("brand_url")}
              placeholder="e.g. samsung"
              value={form.brand_url}
              onChange={(e) => {
                // Auto-lowercase + slug-friendly
                const slug = e.target.value.toLowerCase().replace(/\s+/g, "-");
                setField("brand_url", slug);
                checkDuplicate("brand_url", slug);
              }}
            />
            <p className="text-xs text-gray-400">
              Used as the URL slug. Auto-formatted to lowercase.
            </p>
          </Field>
        </div>

        {/* Row 2: Category + Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Field label="Category">
            <select
              className={inputClass("category_id")}
              value={form.category_id}
              onChange={(e) => setField("category_id", e.target.value)}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.category_name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Status">
            <select
              className={inputClass("status")}
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </Field>
        </div>

        {/* Row 3: Icon */}
        <Field label="Icon URL / Class">
          <input
            className={inputClass("icon")}
            placeholder="e.g. /icons/samsung.png or fa-brand"
            value={form.icon}
            onChange={(e) => setField("icon", e.target.value)}
          />
        </Field>

        {/* Divider */}
        <div className="border-t pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            SEO / Meta
          </p>
          <div className="space-y-5">
            <Field label="Meta Title">
              <input
                className={inputClass("meta_title")}
                placeholder="Page title for SEO"
                value={form.meta_title}
                onChange={(e) => setField("meta_title", e.target.value)}
              />
            </Field>

            <Field label="Meta Keywords">
              <textarea
                rows={2}
                className={inputClass("meta_keywords")}
                placeholder="keyword1, keyword2, keyword3"
                value={form.meta_keywords}
                onChange={(e) => setField("meta_keywords", e.target.value)}
              />
            </Field>

            <Field label="Meta Description">
              <textarea
                rows={3}
                className={inputClass("meta_description")}
                placeholder="Brief description for search engines (150–160 chars recommended)"
                value={form.meta_description}
                onChange={(e) => setField("meta_description", e.target.value)}
              />
              <p className="text-xs text-gray-400 text-right">
                {form.meta_description.length} / 160
              </p>
            </Field>
          </div>
        </div>

        {/* Brand Content */}
        <div className="border-t pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Brand Content
          </p>
          <TipTapEditorWithSEO
            content={form.brand_content}
            onChange={(html) => setField("brand_content", html)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t pt-5 gap-3">
          <button
            onClick={handleReset}
            className="px-5 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            Reset Form
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || dupChecking.brand_name || dupChecking.brand_url}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition flex items-center gap-2"
          >
            {saving && (
              <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {saving ? "Creating..." : "Create Brand"}
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}