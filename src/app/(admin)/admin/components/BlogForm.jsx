"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import TipTapEditorWithSEO from "@/app/(admin)/admin/components/TipTapEditorWithSEO";

const EMPTY = {
  blog_title: "",
  blog_url: "",
  blog_name: "",
  blog_type: "",
  blog_cat_id: "",
  author_name: "",
  status: "active",
  publishdate: "",
  blog_image: "",
  blog_image_cover: "",
  image3: "",
  blog_description: "",
  blog_keywords: "",
  blog_content_text: "",
  ckeditercontant: "",
  Canonical: "",
  Robots: "",
};

const isActive = (s) => {
  const v = String(s ?? "").trim().toLowerCase();
  return v === "1" || v === "active" || v === "true" || v === "yes";
};


export default function BlogForm({ mode = "create", blogId = null }) {
  const router = useRouter();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [urlChecking, setUrlChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");
  const [toast, setToast] = useState(null);

  const urlTimer = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // categories for the picker
  useEffect(() => {
    fetch("/api/admin/blogs?type=categories")
      .then((r) => r.json())
      .then((d) => d.success && setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  // load existing blog when editing
  useEffect(() => {
    if (mode !== "edit" || !blogId) return;
    setLoading(true);
    fetch(`/api/admin/blogs?id=${blogId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.blog) {
          const b = d.blog;
          setForm({
            ...EMPTY,
            ...Object.fromEntries(
              Object.keys(EMPTY).map((k) => [k, b[k] ?? ""])
            ),
            status: isActive(b.status) ? "active" : "inactive",
            blog_cat_id: b.blog_cat_id ? String(b.blog_cat_id) : "",
            publishdate: b.publishdate ? String(b.publishdate).slice(0, 10) : "",
          });
        } else {
          showToast(d.message || "Could not load blog.", "error");
        }
      })
      .catch((e) => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [mode, blogId]);

  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  // debounced duplicate check on blog_url
  const checkUrl = (value) => {
    clearTimeout(urlTimer.current);
    if (!value.trim()) {
      setUrlChecking(false);
      setErrors((e) => ({ ...e, blog_url: undefined }));
      return;
    }
    setUrlChecking(true);
    urlTimer.current = setTimeout(async () => {
      try {
        const exclude = mode === "edit" && blogId ? `&excludeId=${blogId}` : "";
        const res = await fetch(
          `/api/admin/blogs?type=check_duplicate&value=${encodeURIComponent(
            value.trim()
          )}${exclude}`
        );
        const data = await res.json();
        setErrors((e) => ({
          ...e,
          blog_url: data.exists ? "This blog URL is already taken." : undefined,
        }));
      } catch {
        /* ignore */
      } finally {
        setUrlChecking(false);
      }
    }, 450);
  };

  const validate = () => {
    const e = {};
    if (!form.blog_title.trim()) e.blog_title = "Blog title is required.";
    if (!form.blog_url.trim()) e.blog_url = "Blog URL is required.";
    if (errors.blog_url) e.blog_url = errors.blog_url;
    return e;
  };

  const handleSubmit = async () => {
    const v = validate();
    if (Object.keys(v).length) {
      setErrors(v);
      return;
    }
    setSaving(true);
    try {
      const isEdit = mode === "edit";
      const res = await fetch("/api/admin/blogs", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { ...form, id: blogId } : form),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          isEdit
            ? "Blog updated successfully!"
            : `Blog created! (ID: ${data.blog_id})`
        );
        setTimeout(() => router.push("/admin/blogs"), 800);
      } else if (data.errors) {
        setErrors(data.errors);
        showToast(data.message || "Please fix the errors below.", "error");
      } else {
        showToast(data.message || "Save failed.", "error");
      }
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── shared styles / sub-components (same look as create_page) ──
  const inputClass = (field) =>
    `border rounded-lg p-2.5 text-sm w-full focus:outline-none focus:ring-2 transition ${
      errors[field]
        ? "border-red-400 focus:ring-red-200"
        : "border-gray-300 focus:ring-blue-200 focus:border-blue-400"
    }`;

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

  const SectionHeader = ({ title }) => (
    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
      {title}
    </p>
  );

  if (loading) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          Loading blog…
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            {mode === "edit" ? "Edit Blog" : "Create New Blog"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Fields marked <span className="text-red-500">*</span> are required.
          </p>
        </div>
        <a
          href="/admin/blogs"
          className="text-sm text-blue-600 hover:underline hidden sm:block"
        >
          ← Back to blogs
        </a>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-8">
        {/* Basic Info */}
        <div>
          <SectionHeader title="Basic Info" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Blog Title" required error={errors.blog_title}>
              <input
                className={inputClass("blog_title")}
                placeholder="e.g. Why Regular Water Purifier Service Matters"
                value={form.blog_title}
                onChange={(e) => setField("blog_title", e.target.value)}
              />
            </Field>

            <Field
              label="Blog URL"
              required
              error={errors.blog_url}
              checking={urlChecking}
              hint="Auto-formatted to a lowercase slug. Must be unique."
            >
              <input
                className={inputClass("blog_url")}
                placeholder="e.g. why-regular-water-purifier-service"
                value={form.blog_url}
                onChange={(e) => {
                  const slug = e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, "");
                  setField("blog_url", slug);
                  checkUrl(slug);
                }}
              />
            </Field>

            <Field label="Short Name" hint="Internal/short label (blog_name).">
              <input
                className={inputClass("blog_name")}
                placeholder="e.g. Why Regular"
                value={form.blog_name}
                onChange={(e) => setField("blog_name", e.target.value)}
              />
            </Field>

            <Field label="Blog Type">
              <input
                className={inputClass("blog_type")}
                placeholder="e.g. 1"
                value={form.blog_type}
                onChange={(e) => setField("blog_type", e.target.value)}
              />
            </Field>

            <Field label="Category">
              <select
                className={inputClass("blog_cat_id")}
                value={form.blog_cat_id}
                onChange={(e) => setField("blog_cat_id", e.target.value)}
              >
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Author">
              <input
                className={inputClass("author_name")}
                placeholder="Author name"
                value={form.author_name}
                onChange={(e) => setField("author_name", e.target.value)}
              />
            </Field>

            <Field label="Publish Date">
              <input
                type="date"
                className={inputClass("publishdate")}
                value={form.publishdate}
                onChange={(e) => setField("publishdate", e.target.value)}
              />
            </Field>

            <Field label="Status">
              <select
                className={inputClass("status")}
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Media */}
        <div className="border-t pt-6">
          <SectionHeader title="Media" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field label="Cover Image" hint="Path / URL (blog_image_cover).">
              <input
                className={inputClass("blog_image_cover")}
                placeholder="e.g. /uploads/cover.jpg"
                value={form.blog_image_cover}
                onChange={(e) => setField("blog_image_cover", e.target.value)}
              />
            </Field>
            <Field label="Banner Image" hint="Path / URL (blog_image).">
              <input
                className={inputClass("blog_image")}
                placeholder="e.g. /uploads/banner.jpg"
                value={form.blog_image}
                onChange={(e) => setField("blog_image", e.target.value)}
              />
            </Field>
            <Field label="Extra Image" hint="Path / URL (image3).">
              <input
                className={inputClass("image3")}
                placeholder="e.g. /uploads/extra.jpg"
                value={form.image3}
                onChange={(e) => setField("image3", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* SEO / Meta */}
        <div className="border-t pt-6">
          <SectionHeader title="SEO / Meta" />
          <div className="space-y-5">
            <Field label="Meta Description (blog_description)">
              <textarea
                rows={3}
                className={inputClass("blog_description")}
                placeholder="Short description for listings & search engines"
                value={form.blog_description}
                onChange={(e) => setField("blog_description", e.target.value)}
              />
            </Field>
            <Field label="Keywords (blog_keywords)">
              <textarea
                rows={2}
                className={inputClass("blog_keywords")}
                placeholder="keyword1, keyword2, keyword3"
                value={form.blog_keywords}
                onChange={(e) => setField("blog_keywords", e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Canonical URL">
                <input
                  className={inputClass("Canonical")}
                  placeholder="https://example.com/blog/..."
                  value={form.Canonical}
                  onChange={(e) => setField("Canonical", e.target.value)}
                />
              </Field>
              <Field label="Robots">
                <input
                  className={inputClass("Robots")}
                  placeholder="index, follow"
                  value={form.Robots}
                  onChange={(e) => setField("Robots", e.target.value)}
                />
              </Field>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="border-t pt-6">
          <SectionHeader title="Blog Content (blog_content_text)" />
          <TipTapEditorWithSEO
            content={form.blog_content_text}
            onChange={(html) => setField("blog_content_text", html)}
          />
        </div>

        {/* Legacy CKEditor content (optional) */}
        <div className="border-t pt-6">
          <SectionHeader title="Legacy Content (ckeditercontant)" />
          <textarea
            rows={4}
            className="border border-gray-300 rounded-lg p-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
            placeholder="Optional legacy HTML content kept for backward compatibility"
            value={form.ckeditercontant}
            onChange={(e) => setField("ckeditercontant", e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t pt-5 gap-3">
          <a
            href="/admin/blogs"
            className="px-5 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition"
          >
            Cancel
          </a>
          <button
            onClick={handleSubmit}
            disabled={saving || urlChecking}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition flex items-center gap-2"
          >
            {saving && (
              <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            )}
            {saving
              ? mode === "edit"
                ? "Saving..."
                : "Creating..."
              : mode === "edit"
              ? "Save Changes"
              : "Create Blog"}
          </button>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
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