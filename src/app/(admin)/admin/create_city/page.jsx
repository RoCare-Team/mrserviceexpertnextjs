"use client";

import { useEffect, useState } from "react";
import TipTapEditorWithSEO from "@/app/(admin)/admin/components/TipTapEditorWithSEO";

const INITIAL_FORM = {
  city_name: "",
  city_url: "",
  state: "",
  status: "1",
  meta_title: "",
  meta_keywords: "",
  meta_description: "",
  city_content: "",
};

export default function CityCreatePage() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [states, setStates] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // ---- auto-generate city_url from city_name ----
  const [urlManuallyEdited, setUrlManuallyEdited] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load existing states for the dropdown
  useEffect(() => {
    fetch("/api/admin/edit_city?type=states")
      .then((r) => r.json())
      .then((d) => d.success && setStates(d.states || []))
      .catch(() => {});
  }, []);

  const setField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };

      // Auto-slug city_url when city_name changes, unless user already typed a URL
      if (field === "city_name" && !urlManuallyEdited) {
        next.city_url = value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/-+/g, "-");
      }

      return next;
    });
  };

  const handleUrlChange = (e) => {
    setUrlManuallyEdited(true);
    setField("city_url", e.target.value);
  };

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setUrlManuallyEdited(false);
  };

  // ---- validation before opening confirm dialog ----
  const handleSaveClick = () => {
    if (!form.city_name.trim()) {
      showToast("City name is required.", "error");
      return;
    }
    if (!form.city_url.trim()) {
      showToast("City URL is required.", "error");
      return;
    }
    setConfirmOpen(true);
  };

  // ---- submit to API ----
  const doCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/create_city", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (data.success) {
        showToast(`City created successfully! (ID: ${data.cityId})`);
        setConfirmOpen(false);
        resetForm();
      } else {
        // 409 duplicate or 400 validation — show the server message
        showToast(data.message || "Failed to create city.", "error");
        setConfirmOpen(false);
      }
    } catch (e) {
      showToast(e.message, "error");
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const charCount = (str, max) => {
    const len = (str || "").length;
    const over = len > max;
    return (
      <span className={`text-xs mt-0.5 ${over ? "text-red-500 font-medium" : "text-gray-400"}`}>
        {len}/{max}
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Create New City</h1>
          <p className="text-sm text-gray-500 mt-1">
            Fill in the details below. City name and URL must be unique.
          </p>
        </div>
      </div>

      {/* ---- Basic Info ---- */}
      <section className="bg-white border rounded-xl shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b">
          Basic Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* City Name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              City Name <span className="text-red-500">*</span>
            </label>
            <input
              className="border w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Mumbai"
              value={form.city_name}
              onChange={(e) => setField("city_name", e.target.value)}
            />
          </div>

          {/* City URL */}
          <div>
            <label className="block text-sm font-medium mb-1">
              City URL <span className="text-red-500">*</span>
            </label>
            <input
              className="border w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="e.g. mumbai"
              value={form.city_url}
              onChange={handleUrlChange}
            />
            <p className="text-xs text-gray-400 mt-0.5">
              Auto-generated from name. Edit if needed.
            </p>
          </div>

          {/* State */}
          <div>
            <label className="block text-sm font-medium mb-1">State</label>
            <div className="flex gap-2">
              {/* Dropdown for existing states */}
              <select
                className="border p-2 rounded-lg text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={states.includes(form.state) ? form.state : ""}
                onChange={(e) => setField("state", e.target.value)}
              >
                <option value="">— pick or type below —</option>
                {states.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            {/* Allow typing a new state too */}
            <input
              className="border w-full p-2 rounded-lg text-sm mt-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Or type a new state"
              value={form.state}
              onChange={(e) => setField("state", e.target.value)}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select
              className="border w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.status}
              onChange={(e) => setField("status", e.target.value)}
            >
              <option value="1">Active</option>
              <option value="0">Inactive</option>
            </select>
          </div>
        </div>
      </section>

      {/* ---- SEO / Meta ---- */}
      <section className="bg-white border rounded-xl shadow-sm p-6 mb-5">
        <h2 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b">
          SEO / Meta
        </h2>
        <div className="flex flex-col gap-4">
          {/* Meta Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">Meta Title</label>
              {charCount(form.meta_title, 60)}
            </div>
            <input
              className="border w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Recommended: 50–60 characters"
              value={form.meta_title}
              onChange={(e) => setField("meta_title", e.target.value)}
            />
          </div>

          {/* Meta Keywords */}
          <div>
            <label className="block text-sm font-medium mb-1">Meta Keywords</label>
            <textarea
              rows={2}
              className="border w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="keyword1, keyword2, keyword3"
              value={form.meta_keywords}
              onChange={(e) => setField("meta_keywords", e.target.value)}
            />
          </div>

          {/* Meta Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium">Meta Description</label>
              {charCount(form.meta_description, 160)}
            </div>
            <textarea
              rows={3}
              className="border w-full p-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Recommended: 120–160 characters"
              value={form.meta_description}
              onChange={(e) => setField("meta_description", e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* ---- City Content ---- */}
      <section className="bg-white border rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4 pb-2 border-b">
          City Content
        </h2>
        <TipTapEditorWithSEO
          content={form.city_content}
          onChange={(html) => setField("city_content", html)}
        />
      </section>

      {/* ---- Action Buttons ---- */}
      <div className="flex justify-end gap-3">
        <button
          onClick={resetForm}
          className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
        >
          Reset
        </button>
        <button
          onClick={handleSaveClick}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Create City
        </button>
      </div>

      {/* ---- Confirm Dialog ---- */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm text-center">
            <div className="text-3xl mb-3">🏙️</div>
            <h3 className="text-lg font-semibold mb-2">Create this city?</h3>
            <p className="text-sm text-gray-500 mb-1">
              <strong>{form.city_name}</strong>
            </p>
            <p className="text-xs text-gray-400 mb-6 font-mono">{form.city_url}</p>
            <div className="flex gap-3">
              <button
                disabled={saving}
                onClick={() => setConfirmOpen(false)}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={doCreate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 text-sm font-medium"
              >
                {saving ? "Creating..." : "Yes, Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Toast ---- */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg text-sm font-medium max-w-sm ${
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