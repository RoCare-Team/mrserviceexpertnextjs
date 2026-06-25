"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
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

const EMPTY = {
  blog_title: "",
  blog_url: "",
  blog_name: "",
  blog_type: "",
  blog_cat_id: "",
  author_name: "",
  status: "1",
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

/**
 * mode  : "create" | "edit"
 * blogId: required when mode === "edit"
 */
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

  useEffect(() => {
    fetch("/api/admin/blogs?type=categories")
      .then((r) => r.json())
      .then((d) => d.success && setCategories(d.categories || []))
      .catch(() => {});
  }, []);

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
            status: String(b.status ?? "1"),
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
          `/api/admin/blogs?type=check_duplicate&value=${encodeURIComponent(value.trim())}${exclude}`
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
          isEdit ? "Blog updated successfully!" : `Blog created! (ID: ${data.blog_id})`
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

  if (loading) {
    return (
      <div>
        <PageHead eyebrow="Content" title="Edit Blog" subtitle="Loading the blog…" />
        <FormCard>
          <div className="adm-note checking" style={{ marginTop: 0 }}>
            <Loader2 size={15} className="adm-spin" />
            <span>Loading blog…</span>
          </div>
        </FormCard>
      </div>
    );
  }

  const isEdit = mode === "edit";

  return (
    <div>
      <PageHead
        eyebrow="Content"
        title={isEdit ? "Edit Blog" : "Create Blog"}
        subtitle={
          isEdit
            ? "Update this article, its media and SEO meta."
            : "Write a new article with media and SEO meta."
        }
      />

      <div style={{ marginBottom: 18 }}>
        <Link href="/admin/blogs" className="adm-btn adm-btn-sm">
          <ArrowLeft size={15} /> Back to blogs
        </Link>
      </div>

      <FormCard>
        {/* Basic info */}
        <div className="adm-section">
          <SectionTitle>Basic info</SectionTitle>
          <div className="adm-formgrid">
            <Field label="Blog title *" className="full">
              <Input
                className={errors.blog_title ? "err" : ""}
                placeholder="e.g. Why Regular Water Purifier Service Matters"
                value={form.blog_title}
                onChange={(e) => setField("blog_title", e.target.value)}
              />
              {errors.blog_title && <FieldNote tone="err">{errors.blog_title}</FieldNote>}
            </Field>

            <Field label="Blog URL *">
              <Input
                className={errors.blog_url ? "err" : ""}
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
              {urlChecking ? (
                <FieldNote tone="checking">Checking availability…</FieldNote>
              ) : errors.blog_url ? (
                <FieldNote tone="err">{errors.blog_url}</FieldNote>
              ) : (
                <FieldNote tone="hint">Auto-formatted to a lowercase slug. Must be unique.</FieldNote>
              )}
            </Field>

            <Field label="Short name">
              <Input
                placeholder="e.g. Why Regular"
                value={form.blog_name}
                onChange={(e) => setField("blog_name", e.target.value)}
              />
              <FieldNote tone="hint">Internal / short label (blog_name).</FieldNote>
            </Field>

            <Field label="Blog type">
              <Input
                placeholder="e.g. 1"
                value={form.blog_type}
                onChange={(e) => setField("blog_type", e.target.value)}
              />
            </Field>

            <Field label="Category">
              <Select value={form.blog_cat_id} onChange={(e) => setField("blog_cat_id", e.target.value)}>
                <option value="">— None —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Author">
              <Input
                placeholder="Author name"
                value={form.author_name}
                onChange={(e) => setField("author_name", e.target.value)}
              />
            </Field>

            <Field label="Publish date">
              <Input
                type="date"
                value={form.publishdate}
                onChange={(e) => setField("publishdate", e.target.value)}
              />
            </Field>

            <Field label="Status">
              <Select value={form.status} onChange={(e) => setField("status", e.target.value)}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </Select>
            </Field>
          </div>
        </div>

        {/* Media */}
        <div className="adm-section">
          <SectionTitle>Media</SectionTitle>
          <div className="adm-formgrid">
            <Field label="Cover image">
              <Input
                placeholder="e.g. /uploads/cover.jpg"
                value={form.blog_image_cover}
                onChange={(e) => setField("blog_image_cover", e.target.value)}
              />
              <FieldNote tone="hint">Path / URL (blog_image_cover).</FieldNote>
            </Field>
            <Field label="Banner image">
              <Input
                placeholder="e.g. /uploads/banner.jpg"
                value={form.blog_image}
                onChange={(e) => setField("blog_image", e.target.value)}
              />
              <FieldNote tone="hint">Path / URL (blog_image).</FieldNote>
            </Field>
            <Field label="Extra image" className="full">
              <Input
                placeholder="e.g. /uploads/extra.jpg"
                value={form.image3}
                onChange={(e) => setField("image3", e.target.value)}
              />
              <FieldNote tone="hint">Path / URL (image3).</FieldNote>
            </Field>
          </div>
        </div>

        {/* SEO / Meta */}
        <div className="adm-section">
          <SectionTitle>SEO / Meta</SectionTitle>
          <div className="adm-formgrid">
            <Field label="Meta description (blog_description)" className="full">
              <Textarea
                rows={3}
                placeholder="Short description for listings & search engines"
                value={form.blog_description}
                onChange={(e) => setField("blog_description", e.target.value)}
              />
            </Field>
            <Field label="Keywords (blog_keywords)" className="full">
              <Textarea
                rows={2}
                placeholder="keyword1, keyword2, keyword3"
                value={form.blog_keywords}
                onChange={(e) => setField("blog_keywords", e.target.value)}
              />
            </Field>
            <Field label="Canonical URL">
              <Input
                placeholder="https://example.com/blog/..."
                value={form.Canonical}
                onChange={(e) => setField("Canonical", e.target.value)}
              />
            </Field>
            <Field label="Robots">
              <Input
                placeholder="index, follow"
                value={form.Robots}
                onChange={(e) => setField("Robots", e.target.value)}
              />
            </Field>
          </div>
        </div>

        {/* Content */}
        <div className="adm-section">
          <SectionTitle>Blog content (blog_content_text)</SectionTitle>
          <TipTapEditorWithSEO
            content={form.blog_content_text}
            onChange={(html) => setField("blog_content_text", html)}
          />
        </div>

        {/* Legacy content */}
        <div className="adm-section">
          <SectionTitle>Legacy content (ckeditercontant)</SectionTitle>
          <Textarea
            rows={4}
            placeholder="Optional legacy HTML content kept for backward compatibility"
            value={form.ckeditercontant}
            onChange={(e) => setField("ckeditercontant", e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="adm-formactions">
          <Link href="/admin/blogs" className="adm-btn">
            Cancel
          </Link>
          <Button variant="primary" onClick={handleSubmit} disabled={saving || urlChecking}>
            {saving ? (
              <>
                <Loader2 size={16} className="adm-spin" /> {isEdit ? "Saving…" : "Creating…"}
              </>
            ) : isEdit ? (
              "Save changes"
            ) : (
              "Create blog"
            )}
          </Button>
        </div>
      </FormCard>

      <Toast toast={toast} />
    </div>
  );
}
