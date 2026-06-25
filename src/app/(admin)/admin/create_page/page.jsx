"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, ChevronDown } from "lucide-react";
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
  const [cityOpen, setCityOpen] = useState(false);
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
          setErrors((e) => ({ ...e, page_url: "This page URL is already taken." }));
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

  return (
    <div>
      <PageHead
        eyebrow="Catalogue"
        title="Create City Page"
        subtitle="Build a city &amp; category landing page with SEO meta, content and FAQs."
      />

      <div style={{ marginBottom: 18 }}>
        <Link href="/admin/city_category" className="adm-btn adm-btn-sm">
          <ArrowLeft size={15} /> Back to city pages
        </Link>
      </div>

      <FormCard>
        {/* Basic info */}
        <div className="adm-section">
          <SectionTitle>Basic info</SectionTitle>
          <div className="adm-formgrid">
            <Field label="Page title *">
              <Input
                className={errors.page_title ? "err" : ""}
                placeholder="e.g. AC Repair in Delhi"
                value={form.page_title}
                onChange={(e) => setField("page_title", e.target.value)}
              />
              {errors.page_title && <FieldNote tone="err">{errors.page_title}</FieldNote>}
            </Field>

            <Field label="Page URL *">
              <Input
                className={errors.page_url ? "err" : ""}
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
              {urlChecking ? (
                <FieldNote tone="checking">Checking availability…</FieldNote>
              ) : errors.page_url ? (
                <FieldNote tone="err">{errors.page_url}</FieldNote>
              ) : (
                <FieldNote tone="hint">Auto-formatted to a lowercase slug. Must be unique.</FieldNote>
              )}
            </Field>

            <Field label="Status">
              <Select value={form.status} onChange={(e) => setField("status", e.target.value)}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </Select>
            </Field>
          </div>
        </div>

        {/* Relations */}
        <div className="adm-section">
          <SectionTitle>Relations</SectionTitle>
          <div className="adm-formgrid">
            {/* City — searchable */}
            <Field label="City" className="full">
              <div className="adm-combo">
                <Input
                  placeholder="Search city…"
                  value={citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    setCityOpen(true);
                  }}
                  onFocus={() => setCityOpen(true)}
                  onBlur={() => setTimeout(() => setCityOpen(false), 150)}
                />
                {cityOpen && cities.length > 0 && (
                  <div className="adm-picker-menu">
                    <button
                      type="button"
                      className="adm-picker-opt"
                      onMouseDown={() => {
                        setField("city_id", "");
                        setCitySearch("");
                        setCityOpen(false);
                      }}
                    >
                      <span style={{ color: "var(--adm-faint)" }}>— None —</span>
                    </button>
                    {cities.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`adm-picker-opt ${
                          String(form.city_id) === String(c.id) ? "active" : ""
                        }`}
                        onMouseDown={() => {
                          setField("city_id", String(c.id));
                          setCitySearch(c.city_name);
                          setCityOpen(false);
                        }}
                      >
                        <span>{c.city_name}</span>
                        <small>/{c.city_url}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {form.city_id && (
                <FieldNote tone="ok">City ID {form.city_id} selected</FieldNote>
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

            <Field label="Brand">
              <Select value={form.brand_id} onChange={(e) => setField("brand_id", e.target.value)}>
                <option value="">— None —</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.brand_name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Service type" className="full">
              <Select
                value={form.service_type_id}
                onChange={(e) => setField("service_type_id", e.target.value)}
              >
                <option value="">— None —</option>
                {serviceTypes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.service_type_name || s.name || `ID ${s.id}`}
                  </option>
                ))}
              </Select>
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
          <SectionTitle>Page content</SectionTitle>
          <TipTapEditorWithSEO
            content={form.page_content}
            onChange={(html) => setField("page_content", html)}
          />
        </div>

        {/* FAQs */}
        <div className="adm-section">
          <SectionTitle>FAQs (up to 5)</SectionTitle>
          <div style={{ display: "grid", gap: 10 }}>
            {Array.from({ length: FAQ_COUNT }, (_, i) => {
              const n = i + 1;
              const qKey = `faqquestion${n}`;
              const aKey = `faqanswer${n}`;
              const isOpen = openFaq === n;
              const hasContent = form[qKey] || form[aKey];

              return (
                <div key={n} className="adm-faqcard" style={{ padding: 0, overflow: "hidden" }}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : n)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "13px 16px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--adm-ink)",
                    }}
                  >
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      FAQ {n}
                      {hasContent && (
                        <span
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background: "var(--adm-brand)",
                            display: "inline-block",
                          }}
                        />
                      )}
                    </span>
                    <ChevronDown
                      size={17}
                      style={{
                        color: "var(--adm-muted)",
                        transform: isOpen ? "rotate(180deg)" : "none",
                        transition: "transform .18s",
                      }}
                    />
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: "4px 16px 16px",
                        borderTop: "1px solid var(--adm-border)",
                      }}
                    >
                      <div style={{ marginTop: 12 }}>
                        <Field label="Question">
                          <Input
                            placeholder={`FAQ ${n} question`}
                            value={form[qKey]}
                            onChange={(e) => setField(qKey, e.target.value)}
                          />
                        </Field>
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <Field label="Answer">
                          <Textarea
                            rows={3}
                            placeholder={`FAQ ${n} answer`}
                            value={form[aKey]}
                            onChange={(e) => setField(aKey, e.target.value)}
                          />
                        </Field>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
              "Create page"
            )}
          </Button>
        </div>
      </FormCard>

      <Toast toast={toast} />
    </div>
  );
}
