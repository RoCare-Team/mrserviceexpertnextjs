"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  FileText,
  Image as ImageIcon,
  Search as SearchIcon,
  AlignLeft,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Link2,
  Save,
} from "lucide-react";
import TipTapEditorWithSEO from "@/app/(admin)/admin/components/TipTapEditorWithSEO";
import { Toast } from "@/app/(admin)/admin/components/AdminUI";

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

const TABS = [
  { key: "basic", label: "Basics", icon: FileText },
  { key: "content", label: "Content", icon: AlignLeft },
  { key: "media", label: "Media", icon: ImageIcon },
  { key: "seo", label: "SEO & Meta", icon: SearchIcon },
];

export default function BlogForm({ mode = "create", blogId = null }) {
  const router = useRouter();

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [urlChecking, setUrlChecking] = useState(false);
  const [urlOk, setUrlOk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(mode === "edit");
  const [toast, setToast] = useState(null);
  const [tab, setTab] = useState("basic");

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
            ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, b[k] ?? ""])),
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
    setUrlOk(false);
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
        setUrlOk(!data.exists);
      } catch {
        /* ignore */
      } finally {
        setUrlChecking(false);
      }
    }, 450);
  };

  // auto-suggest a slug from the title (only while creating & url untouched)
  const onTitleChange = (value) => {
    setField("blog_title", value);
    if (mode === "create" && !form.blog_url) {
      const slug = value
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      setField("blog_url", slug);
      checkUrl(slug);
    }
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
      // jump to the tab that holds the first error
      if (v.blog_title || v.blog_url) setTab("basic");
      showToast("Please fix the highlighted fields.", "error");
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
          isEdit ? "Blog updated successfully!" : `Blog created! (ID: ${data.blog_id})`
        );
        setTimeout(() => router.push("/admin/blogs"), 800);
      } else if (data.errors) {
        setErrors(data.errors);
        setTab("basic");
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

  if (loading) {
    return (
      <div className="adm-blogform">
        <div className="adm-card adm-formcard" style={{ display: "flex", gap: 10, alignItems: "center", color: "var(--adm-muted)" }}>
          <Loader2 size={18} className="adm-spin" /> Loading blog…
        </div>
      </div>
    );
  }

  const coverPreview = form.blog_image_cover || form.blog_image;

  return (
    <div className="adm-blogform">
      {/* Header */}
      <div className="adm-pagehead">
        <div>
          <span className="eyebrow">Content</span>
          <h1>{mode === "edit" ? "Edit Blog" : "Create New Blog"}</h1>
          <p>
            {mode === "edit"
              ? `Updating post #${blogId}. Fields marked * are required.`
              : "Write a new article for the public site. Fields marked * are required."}
          </p>
        </div>
        <a href="/admin/blogs" className="adm-btn adm-btn-sm">
          <ArrowLeft size={15} /> Back to blogs
        </a>
      </div>

      <div className="adm-blogform-grid">
        {/* ── Main editing column ── */}
        <div className="adm-blogform-main">
          {/* Tabs */}
          <div className="adm-tabs" role="tablist">
            {TABS.map((t) => {
              const Icon = t.icon;
              const on = tab === t.key;
              const hasErr =
                (t.key === "basic" && (errors.blog_title || errors.blog_url)) || false;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  className={`adm-tab ${on ? "on" : ""}`}
                  onClick={() => setTab(t.key)}
                >
                  <Icon size={15} />
                  <span>{t.label}</span>
                  {hasErr && <span className="adm-tab-dot" />}
                </button>
              );
            })}
          </div>

          <section className="adm-card adm-formcard">
            {/* BASICS */}
            {tab === "basic" && (
              <div className="adm-form-rows">
                <div className="adm-field grow">
                  <label className="adm-label">Blog Title *</label>
                  <input
                    className={`adm-input ${errors.blog_title ? "err" : ""}`}
                    placeholder="e.g. Why Regular Water Purifier Service Matters"
                    value={form.blog_title}
                    onChange={(e) => onTitleChange(e.target.value)}
                  />
                  {errors.blog_title && (
                    <p className="adm-note err">
                      <AlertCircle size={13} /> <span>{errors.blog_title}</span>
                    </p>
                  )}
                </div>

                <div className="adm-field grow">
                  <label className="adm-label">Blog URL (slug url) *</label>
                  <div className="adm-inputwrap">
                    <Link2 size={15} className="adm-inputicon" />
                    <input
                      className={`adm-input ${errors.blog_url ? "err" : ""}`}
                      style={{ paddingLeft: 38 }}
                      placeholder="why-regular-water-purifier-service"
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
                  </div>
                  {form.blog_url && !errors.blog_url && !urlChecking && (
                    <p className="adm-note hint">
                      Preview: <span style={{ color: "var(--adm-brand)" }}>/blogs/{form.blog_url}</span>
                    </p>
                  )}
                  {urlChecking && (
                    <p className="adm-note checking">
                      <Loader2 size={13} className="adm-spin" /> <span>Checking availability…</span>
                    </p>
                  )}
                  {urlOk && !urlChecking && !errors.blog_url && (
                    <p className="adm-note ok">
                      <CheckCircle2 size={13} /> <span>This URL is available.</span>
                    </p>
                  )}
                  {errors.blog_url && !urlChecking && (
                    <p className="adm-note err">
                      <AlertCircle size={13} /> <span>{errors.blog_url}</span>
                    </p>
                  )}
                </div>

                <div className="adm-form-2col">
                  <div className="adm-field">
                    <label className="adm-label">Category</label>
                    <select
                      className="adm-select"
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
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">Author</label>
                    <input
                      className="adm-input"
                      placeholder="Author name"
                      value={form.author_name}
                      onChange={(e) => setField("author_name", e.target.value)}
                    />
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">Publish Date</label>
                    <input
                      type="date"
                      className="adm-input"
                      value={form.publishdate}
                      onChange={(e) => setField("publishdate", e.target.value)}
                    />
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">Short Name</label>
                    <input
                      className="adm-input"
                      placeholder="Internal short label"
                      value={form.blog_name}
                      onChange={(e) => setField("blog_name", e.target.value)}
                    />
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">Blog Type</label>
                    <input
                      className="adm-input"
                      placeholder="e.g. 1"
                      value={form.blog_type}
                      onChange={(e) => setField("blog_type", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CONTENT */}
            {tab === "content" && (
              <div className="adm-form-rows">
                <p className="adm-section-title">Article Body</p>
                <TipTapEditorWithSEO
                  content={form.blog_content_text}
                  onChange={(html) => setField("blog_content_text", html)}
                />
                <div className="adm-field" style={{ marginTop: 8 }}>
                  <label className="adm-label">Legacy Content (ckeditercontant)</label>
                  <textarea
                    rows={4}
                    className="adm-textarea"
                    placeholder="Optional legacy HTML kept for backward compatibility"
                    value={form.ckeditercontant}
                    onChange={(e) => setField("ckeditercontant", e.target.value)}
                  />
                  <p className="adm-note hint">
                    Leave blank unless migrating old posts. The public page prefers this field if present.
                  </p>
                </div>
              </div>
            )}

            {/* MEDIA */}
            {tab === "media" && (
              <div className="adm-form-rows">
                <p className="adm-section-title">Images</p>
                <div className="adm-form-2col">
                  <ImageField
                    label="Cover Image"
                    hint="Shown on listing cards (blog_image_cover)."
                    value={form.blog_image_cover}
                    onChange={(v) => setField("blog_image_cover", v)}
                  />
                  <ImageField
                    label="Banner Image"
                    hint="Large header image (blog_image)."
                    value={form.blog_image}
                    onChange={(v) => setField("blog_image", v)}
                  />
                  <ImageField
                    label="Extra Image"
                    hint="Optional (image3)."
                    value={form.image3}
                    onChange={(v) => setField("image3", v)}
                  />
                </div>
              </div>
            )}

            {/* SEO */}
            {tab === "seo" && (
              <div className="adm-form-rows">
                <p className="adm-section-title">Search & Meta</p>
                <div className="adm-field grow">
                  <label className="adm-label">Meta Description</label>
                  <textarea
                    rows={3}
                    className="adm-textarea"
                    placeholder="Short description for listings & search engines"
                    value={form.blog_description}
                    onChange={(e) => setField("blog_description", e.target.value)}
                  />
                  <p className="adm-note hint">{(form.blog_description || "").length} characters · aim for 150–160.</p>
                </div>
                <div className="adm-field grow">
                  <label className="adm-label">Keywords</label>
                  <textarea
                    rows={2}
                    className="adm-textarea"
                    placeholder="keyword1, keyword2, keyword3"
                    value={form.blog_keywords}
                    onChange={(e) => setField("blog_keywords", e.target.value)}
                  />
                </div>
                <div className="adm-form-2col">
                  <div className="adm-field">
                    <label className="adm-label">Canonical URL</label>
                    <input
                      className="adm-input"
                      placeholder="https://example.com/blogs/..."
                      value={form.Canonical}
                      onChange={(e) => setField("Canonical", e.target.value)}
                    />
                  </div>
                  <div className="adm-field">
                    <label className="adm-label">Robots</label>
                    <input
                      className="adm-input"
                      placeholder="index, follow"
                      value={form.Robots}
                      onChange={(e) => setField("Robots", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── Sticky side panel: status + live card preview ── */}
        <aside className="adm-blogform-side">
          <section className="adm-card" style={{ padding: 18 }}>
            <p className="adm-section-title" style={{ marginBottom: 14 }}>Publish</p>
            <div className="adm-field" style={{ marginBottom: 14 }}>
              <label className="adm-label">Status</label>
              <select
                className="adm-select"
                value={form.status}
                onChange={(e) => setField("status", e.target.value)}
              >
                <option value="active">Active (visible)</option>
                <option value="inactive">Inactive (hidden)</option>
              </select>
            </div>
            <button
              onClick={handleSubmit}
              disabled={saving || urlChecking}
              className="adm-btn adm-btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="adm-spin" />
                  {mode === "edit" ? "Saving…" : "Creating…"}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {mode === "edit" ? "Save Changes" : "Create Blog"}
                </>
              )}
            </button>
            <a
              href="/admin/blogs"
              className="adm-btn"
              style={{ width: "100%", justifyContent: "center", marginTop: 10 }}
            >
              Cancel
            </a>
          </section>

          {/* Live preview of the listing card */}
          <section className="adm-card" style={{ padding: 18 }}>
            <p className="adm-section-title" style={{ marginBottom: 14 }}>Card Preview</p>
            <div className="adm-blogpreview">
              <div className="adm-blogpreview-img">
                {coverPreview ? (
                  <img src={coverPreview} alt="" onError={(e) => (e.currentTarget.style.display = "none")} />
                ) : (
                  <div className="adm-blogpreview-ph">
                    <ImageIcon size={22} />
                    <span>No image</span>
                  </div>
                )}
              </div>
              <div className="adm-blogpreview-body">
                <span className="adm-blogpreview-cat">
                  {categories.find((c) => String(c.id) === String(form.blog_cat_id))?.name ||
                    "Uncategorised"}
                </span>
                <h4>{form.blog_title || "Your blog title appears here"}</h4>
                <p>
                  {form.blog_description ||
                    "The meta description shows up as the card excerpt on the public blog."}
                </p>
                <div className="adm-blogpreview-meta">
                  <span>{form.author_name || "Mr. Service Expert"}</span>
                  <span>{form.publishdate || "—"}</span>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      <Toast toast={toast} />
    </div>
  );
}

function ImageField({ label, hint, value, onChange }) {
  return (
    <div className="adm-field">
      <label className="adm-label">{label}</label>
      <input
        className="adm-input"
        placeholder="/uploads/image.jpg or https://…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value ? (
        <div className="adm-imgthumb">
          <img src={value} alt="" onError={(e) => (e.currentTarget.parentElement.style.display = "none")} />
        </div>
      ) : (
        hint && <p className="adm-note hint">{hint}</p>
      )}
    </div>
  );
}
