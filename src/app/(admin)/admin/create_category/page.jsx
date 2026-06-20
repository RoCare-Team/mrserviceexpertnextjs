"use client";

import { useState, useRef } from "react";
import TipTapEditorWithSEO from "@/app/(admin)/admin/components/TipTapEditorWithSEO";

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
    // Carry over any existing duplicate errors
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

  // ── Reusable field wrapper ──────────────────────────────────────────────────
  const Field = ({ label, required, error, checking, hint, children }) => (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && !checking && (
        <p className="text-xs text-gray-400">{hint}</p>
      )}
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

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Create New Category</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fields marked <span className="text-red-500">*</span> are required.
          </p>
        </div>
        <a
          href="/admin/categories"
          className="text-sm text-blue-600 hover:underline hidden sm:block"
        >
          ← Back to categories
        </a>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-6">

        {/* ── Basic Info ─────────────────────────────────────────────────────── */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Basic Info
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field
              label="Category Name"
              required
              error={errors.category_name}
              checking={dupChecking.category_name}
            >
              <input
                className={inputClass("category_name")}
                placeholder="e.g. Electronics"
                value={form.category_name}
                onChange={(e) => {
                  setField("category_name", e.target.value);
                  checkDuplicate("category_name", e.target.value);
                }}
              />
            </Field>

            <Field
              label="Category URL"
              required
              error={errors.category_url}
              checking={dupChecking.category_url}
              hint="Auto-formatted to lowercase slug."
            >
              <input
                className={inputClass("category_url")}
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

            <Field label="Phone">
              <input
                className={inputClass("phone")}
                placeholder="e.g. +91 98765 43210"
                value={form.phone}
                onChange={(e) => setField("phone", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* ── Media ──────────────────────────────────────────────────────────── */}
        <div className="border-t pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Media
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Banner URL">
              <input
                className={inputClass("banner")}
                placeholder="e.g. /banners/electronics.jpg"
                value={form.banner}
                onChange={(e) => setField("banner", e.target.value)}
              />
            </Field>

            <Field label="Icon URL / Class">
              <input
                className={inputClass("icon")}
                placeholder="e.g. /icons/electronics.png"
                value={form.icon}
                onChange={(e) => setField("icon", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* ── SEO / Meta ─────────────────────────────────────────────────────── */}
        <div className="border-t pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            SEO / Meta
          </p>
          <div className="space-y-5">
            <Field label="Meta Title">
              <input
                className={inputClass("meta_title")}
                placeholder="Page title for search engines"
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
              <p
                className={`text-xs text-right ${
                  form.meta_description.length > 160
                    ? "text-red-400"
                    : "text-gray-400"
                }`}
              >
                {form.meta_description.length} / 160
              </p>
            </Field>
          </div>
        </div>

        {/* ── Category Content ───────────────────────────────────────────────── */}
        <div className="border-t pt-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
            Category Content
          </p>
          <TipTapEditorWithSEO
            content={form.category_content}
            onChange={(html) => setField("category_content", html)}
          />
        </div>

        {/* ── Actions ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-t pt-5 gap-3">
          <button
            onClick={handleReset}
            className="px-5 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            Reset Form
          </button>
          <button
            onClick={handleSubmit}
            disabled={isBusy}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition flex items-center gap-2"
          >
            {saving && (
              <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {saving ? "Creating..." : "Create Category"}
          </button>
        </div>
      </div>

      {/* ── Toast ──────────────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}