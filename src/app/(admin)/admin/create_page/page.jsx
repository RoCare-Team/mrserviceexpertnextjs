"use client";

import { useEffect, useState, useRef } from "react";
import TipTapEditorWithSEO from "@/app/(admin)/admin/components/TipTapEditorWithSEO";

const FAQ_COUNT = 5;

const INITIAL_FORM = {
  page_title: "",
  page_url: "",
  page_content: "",
  status: "1",
  city_id: "",
  category_id: "",
  brand_id: "",
  service_type_id: "",
  meta_title: "",
  meta_keywords: "",
  meta_description: "",
  ...Object.fromEntries(
    Array.from({ length: FAQ_COUNT }, (_, i) => [
      [`faqquestion${i + 1}`, ""],
      [`faqanswer${i + 1}`, ""],
    ]).flat()
  ),
};

export default function PageCreatePage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [urlChecking, setUrlChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Relation data
  const [cities, setCities] = useState([]);
  const [citySearch, setCitySearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);

  // FAQ accordion
  const [openFaq, setOpenFaq] = useState(null);

  const urlTimer = useRef(null);
  const cityTimer = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load dropdowns on mount
  useEffect(() => {
    const base = "/api/admin/create_page";
    Promise.all([
      fetch(`${base}?type=categories`).then((r) => r.json()),
      fetch(`${base}?type=brands`).then((r) => r.json()),
      fetch(`${base}?type=service_types`).then((r) => r.json()),
    ]).then(([cat, br, st]) => {
      if (cat.success) setCategories(cat.categories || []);
      if (br.success) setBrands(br.brands || []);
      if (st.success) setServiceTypes(st.service_types || []);
    });
  }, []);

  // Debounced city search
  useEffect(() => {
    clearTimeout(cityTimer.current);
    cityTimer.current = setTimeout(() => {
      fetch(`/api/admin/create_page?type=cities&q=${encodeURIComponent(citySearch)}`)
        .then((r) => r.json())
        .then((d) => d.success && setCities(d.cities || []));
    }, 350);
  }, [citySearch]);

  const setField = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  // Real-time page_url duplicate check
  const checkUrl = (value) => {
    clearTimeout(urlTimer.current);
    if (!value.trim()) {
      setUrlChecking(false);
      setErrors((e) => ({ ...e, page_url: undefined }));
      return;
    }
    setUrlChecking(true);
    urlTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/admin/create_page?type=check_duplicate&value=${encodeURIComponent(value.trim())}`
        );
        const data = await res.json();
        if (data.exists) {
          setErrors((e) => ({
            ...e,
            page_url: "This page URL is already taken.",
          }));
        } else {
          setErrors((e) => ({ ...e, page_url: undefined }));
        }
      } catch {
        // silently ignore
      } finally {
        setUrlChecking(false);
      }
    }, 450);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.page_title.trim()) newErrors.page_title = "Page title is required.";
    if (!form.page_url.trim()) newErrors.page_url = "Page URL is required.";
    if (errors.page_url) newErrors.page_url = errors.page_url;
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
      const res = await fetch("/api/admin/create_page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Page created successfully! (ID: ${data.page_id})`);
        setForm(INITIAL_FORM);
        setErrors({});
        setCitySearch("");
      } else {
        if (data.errors) {
          setErrors(data.errors);
          showToast(data.message || "Please fix the errors below.", "error");
        } else {
          showToast(data.message || "Failed to create page.", "error");
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
    setCitySearch("");
    setOpenFaq(null);
  };

  const isBusy = saving || urlChecking;

  // ── Helpers ─────────────────────────────────────────────────────────────────
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

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Create New Page</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fields marked <span className="text-red-500">*</span> are required.
          </p>
        </div>
        <a
          href="/admin/pages"
          className="text-sm text-blue-600 hover:underline hidden sm:block"
        >
          ← Back to pages
        </a>
      </div>

      <div className="bg-white border rounded-xl shadow-sm p-6 space-y-8">

        {/* ── Basic Info ────────────────────────────────────────────────────── */}
        <div>
          <SectionHeader title="Basic Info" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Field
              label="Page Title"
              required
              error={errors.page_title}
            >
              <input
                className={inputClass("page_title")}
                placeholder="e.g. AC Repair in Delhi"
                value={form.page_title}
                onChange={(e) => setField("page_title", e.target.value)}
              />
            </Field>

            <Field
              label="Page URL"
              required
              error={errors.page_url}
              checking={urlChecking}
              hint="Auto-formatted to lowercase slug. Must be unique."
            >
              <input
                className={inputClass("page_url")}
                placeholder="e.g. ac-repair-delhi"
                value={form.page_url}
                onChange={(e) => {
                  const slug = e.target.value
                    .toLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9-]/g, "");
                  setField("page_url", slug);
                  checkUrl(slug);
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
          </div>
        </div>

        {/* ── Relations ─────────────────────────────────────────────────────── */}
        <div className="border-t pt-6">
          <SectionHeader title="Relations" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* City — searchable */}
            <div className="sm:col-span-2">
              <Field label="City">
                <input
                  className={inputClass("city_id")}
                  placeholder="Search city…"
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                />
                {cities.length > 0 && (
                  <div className="border rounded-lg mt-1 max-h-48 overflow-y-auto shadow-sm">
                    {/* Clear selection option */}
                    <button
                      type="button"
                      onClick={() => {
                        setField("city_id", "");
                        setCitySearch("");
                        setCities([]);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-50 border-b"
                    >
                      — None —
                    </button>
                    {cities.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setField("city_id", String(c.id));
                          setCitySearch(c.city_name);
                          setCities([]);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex justify-between ${
                          String(form.city_id) === String(c.id)
                            ? "bg-blue-50 text-blue-700 font-medium"
                            : ""
                        }`}
                      >
                        <span>{c.city_name}</span>
                        <span className="text-gray-400 text-xs">{c.city_url}</span>
                      </button>
                    ))}
                  </div>
                )}
                {form.city_id && (
                  <p className="text-xs text-green-600 mt-1">
                    ✓ City ID {form.city_id} selected
                  </p>
                )}
              </Field>
            </div>

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

            <Field label="Brand">
              <select
                className={inputClass("brand_id")}
                value={form.brand_id}
                onChange={(e) => setField("brand_id", e.target.value)}
              >
                <option value="">— None —</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.brand_name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Service Type">
              <select
                className={inputClass("service_type_id")}
                value={form.service_type_id}
                onChange={(e) => setField("service_type_id", e.target.value)}
              >
                <option value="">— None —</option>
                {serviceTypes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.service_type_name || s.name || `ID ${s.id}`}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        {/* ── SEO / Meta ────────────────────────────────────────────────────── */}
        <div className="border-t pt-6">
          <SectionHeader title="SEO / Meta" />
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

        {/* ── Page Content ──────────────────────────────────────────────────── */}
        <div className="border-t pt-6">
          <SectionHeader title="Page Content" />
          <TipTapEditorWithSEO
            content={form.page_content}
            onChange={(html) => setField("page_content", html)}
          />
        </div>

        {/* ── FAQs ──────────────────────────────────────────────────────────── */}
        <div className="border-t pt-6">
          <SectionHeader title="FAQs (up to 5)" />
          <div className="space-y-2">
            {Array.from({ length: FAQ_COUNT }, (_, i) => {
              const n = i + 1;
              const qKey = `faqquestion${n}`;
              const aKey = `faqanswer${n}`;
              const isOpen = openFaq === n;
              const hasContent = form[qKey] || form[aKey];

              return (
                <div key={n} className="border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : n)}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium hover:bg-gray-50 text-left"
                  >
                    <span className="flex items-center gap-2">
                      FAQ {n}
                      {hasContent && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                      )}
                    </span>
                    <span className="text-gray-400">{isOpen ? "▲" : "▼"}</span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 space-y-3 border-t bg-gray-50">
                      <div className="pt-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Question
                        </label>
                        <input
                          className="border rounded-lg p-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white"
                          placeholder={`FAQ ${n} question`}
                          value={form[qKey]}
                          onChange={(e) => setField(qKey, e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Answer
                        </label>
                        <textarea
                          rows={3}
                          className="border rounded-lg p-2.5 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white"
                          placeholder={`FAQ ${n} answer`}
                          value={form[aKey]}
                          onChange={(e) => setField(aKey, e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Actions ───────────────────────────────────────────────────────── */}
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
            {saving ? "Creating..." : "Create Page"}
          </button>
        </div>
      </div>

      {/* Toast */}
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
