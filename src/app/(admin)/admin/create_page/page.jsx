"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Info, Search as SearchIcon, Network, HelpCircle, FileText } from "lucide-react";
import TipTapEditorWithSEO from "@/app/(admin)/admin/components/TipTapEditorWithSEO";
import {
  PageHead,
  Field,
  Input,
  Select,
  Textarea,
  Button,
  FieldNote,
  ConfirmDialog,
  Toast,
  Tabs,
} from "@/app/(admin)/admin/components/AdminUI";

const INITIAL = {
  page_title: "",
  page_url: "",
  youtube_url: "",
  page_content: "",
  status: "1",
  city_id: "",
  city_name: "",
  category_id: "",
  brand_id: "",
  service_type_id: "",
  meta_title: "",
  meta_keywords: "",
  meta_description: "",
};

const serviceTypeLabel = (row) =>
  row.service_type_name || row.name || row.title || row.type || `Type ${row.id}`;

/* Compact city search/picker (queries the create_page lookup endpoint). */
function CityPicker({ valueLabel, onPick, onClear }) {
  const [q, setQ] = useState(valueLabel || "");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);

  useEffect(() => setQ(valueLabel || ""), [valueLabel]);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/create_page?type=cities&q=${encodeURIComponent(q)}`);
        const d = await res.json();
        if (d.success) setResults(d.cities || []);
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [q, open]);

  return (
    <div className="adm-combo">
      <div className="adm-combo-row">
        <Input
          placeholder="Search city…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {onClear && q && (
          <button type="button" className="adm-combo-clear" aria-label="Clear" onClick={() => { setQ(""); onClear(); }}>
            <X size={16} />
          </button>
        )}
      </div>
      {open && results.length > 0 && (
        <ul className="adm-combo-menu">
          {results.map((c) => (
            <li
              key={c.id}
              className="adm-combo-opt"
              onMouseDown={() => {
                onPick(c);
                setQ(c.city_name);
                setOpen(false);
              }}
            >
              {c.city_name} <small>/{c.city_url}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function CreatePage() {
  const router = useRouter();
  const [tab, setTab] = useState("basic");
  const [form, setForm] = useState(INITIAL);
  const [urlEdited, setUrlEdited] = useState(false);
  const [dupStatus, setDupStatus] = useState(null); // null | 'checking' | 'free' | 'taken'

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);

  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const dupTimer = useRef(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetch("/api/admin/create_page?type=categories").then((r) => r.json()).then((d) => d.success && setCategories(d.categories || [])).catch(() => {});
    fetch("/api/admin/create_page?type=brands").then((r) => r.json()).then((d) => d.success && setBrands(d.brands || [])).catch(() => {});
    fetch("/api/admin/create_page?type=service_types").then((r) => r.json()).then((d) => d.success && setServiceTypes(d.service_types || [])).catch(() => {});
  }, []);

  const set = (field, value) =>
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "page_title" && !urlEdited) {
        next.page_url = value.toLowerCase().trim().replace(/[^a-z0-9\s/-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-");
      }
      return next;
    });

  // live duplicate check on page_url
  useEffect(() => {
    clearTimeout(dupTimer.current);
    const url = form.page_url.trim();
    if (!url) { setDupStatus(null); return; }
    setDupStatus("checking");
    dupTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/create_page?type=check_duplicate&value=${encodeURIComponent(url)}`);
        const d = await res.json();
        setDupStatus(d.exists ? "taken" : "free");
      } catch { setDupStatus(null); }
    }, 450);
  }, [form.page_url]);

  const validate = () => {
    if (!form.page_title.trim()) { setTab("basic"); return "Page title is required."; }
    if (!form.page_url.trim()) { setTab("basic"); return "Page URL is required."; }
    if (dupStatus === "taken") { setTab("basic"); return "That page URL is already taken."; }
    return null;
  };

  const handleSaveClick = () => {
    const err = validate();
    if (err) return showToast(err, "error");
    setConfirmOpen(true);
  };

  const doCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/create_page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Page created (ID: ${data.page_id}). Redirecting…`);
        setConfirmOpen(false);
        setTimeout(() => router.push("/admin/city_category"), 800);
      } else {
        showToast(data.message || data.errors?.page_url || "Failed to create page.", "error");
        setConfirmOpen(false);
      }
    } catch (e) {
      showToast(e.message, "error");
      setConfirmOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { key: "basic", label: "Basic Info", icon: Info },
    { key: "seo", label: "SEO", icon: SearchIcon },
    { key: "relations", label: "Relations", icon: Network },
    { key: "faqs", label: "FAQs", icon: HelpCircle },
  ];

  return (
    <div>
      <PageHead
        eyebrow="Catalogue"
        title="New City Page"
        subtitle="Create a city & category landing page. Title and URL are required."
      />

      <section className="adm-card" style={{ padding: 22 }}>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        {tab === "basic" && (
          <div className="adm-formgrid adm-tabpanel">
            <Field label="Page title" className="full">
              <Input value={form.page_title} onChange={(e) => set("page_title", e.target.value)} placeholder="e.g. Washing Machine Service Hazaribagh" />
            </Field>
            <Field label="Page URL" className="full">
              <Input
                value={form.page_url}
                onChange={(e) => { setUrlEdited(true); set("page_url", e.target.value); }}
                placeholder="e.g. hazaribagh/washing-machine-repair"
              />
              {dupStatus === "checking" && <FieldNote tone="checking">Checking availability…</FieldNote>}
              {dupStatus === "free" && <FieldNote tone="ok">This URL is available.</FieldNote>}
              {dupStatus === "taken" && <FieldNote tone="err">This URL is already taken.</FieldNote>}
            </Field>
            <Field label="YouTube URL" className="full">
              <Input value={form.youtube_url} onChange={(e) => set("youtube_url", e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </Select>
            </Field>
            <Field label="Page content" className="full">
              <TipTapEditorWithSEO content={form.page_content} onChange={(html) => set("page_content", html)} />
            </Field>
          </div>
        )}

        {tab === "seo" && (
          <div className="adm-formgrid adm-tabpanel">
            <Field label="Meta title" className="full">
              <Input value={form.meta_title} onChange={(e) => set("meta_title", e.target.value)} placeholder="50–60 characters recommended" />
            </Field>
            <Field label="Meta keywords" className="full">
              <Textarea rows={2} value={form.meta_keywords} onChange={(e) => set("meta_keywords", e.target.value)} placeholder="keyword1, keyword2" />
            </Field>
            <Field label="Meta description" className="full">
              <Textarea rows={3} value={form.meta_description} onChange={(e) => set("meta_description", e.target.value)} placeholder="120–160 characters recommended" />
            </Field>
          </div>
        )}

        {tab === "relations" && (
          <div className="adm-formgrid adm-tabpanel">
            <Field label="City">
              <CityPicker
                valueLabel={form.city_name}
                onPick={(c) => setForm((p) => ({ ...p, city_id: c.id, city_name: c.city_name }))}
                onClear={() => setForm((p) => ({ ...p, city_id: "", city_name: "" }))}
              />
            </Field>
            <Field label="Category">
              <Select value={String(form.category_id)} onChange={(e) => set("category_id", e.target.value)}>
                <option value="">— none —</option>
                {categories.map((c) => (<option key={c.id} value={c.id}>{c.category_name}</option>))}
              </Select>
            </Field>
            <Field label="Brand">
              <Select value={String(form.brand_id)} onChange={(e) => set("brand_id", e.target.value)}>
                <option value="">— none —</option>
                {brands.map((b) => (<option key={b.id} value={b.id}>{b.brand_name}</option>))}
              </Select>
            </Field>
            <Field label="Service type">
              {serviceTypes.length > 0 ? (
                <Select value={String(form.service_type_id)} onChange={(e) => set("service_type_id", e.target.value)}>
                  <option value="">— none —</option>
                  {serviceTypes.map((s) => (<option key={s.id} value={s.id}>{serviceTypeLabel(s)}</option>))}
                </Select>
              ) : (
                <Input value={form.service_type_id} onChange={(e) => set("service_type_id", e.target.value)} placeholder="service_type_id" />
              )}
            </Field>
          </div>
        )}

        {tab === "faqs" && (
          <div className="adm-tabpanel">
            <p className="adm-tabhint">Up to 5 question / answer pairs shown on the live page.</p>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="adm-faqcard">
                <Field label={`Question ${i}`}>
                  <Input value={form[`faqquestion${i}`] || ""} onChange={(e) => set(`faqquestion${i}`, e.target.value)} />
                </Field>
                <div style={{ height: 10 }} />
                <Field label={`Answer ${i}`}>
                  <Textarea rows={2} value={form[`faqanswer${i}`] || ""} onChange={(e) => set(`faqanswer${i}`, e.target.value)} />
                </Field>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 22, borderTop: "1px solid var(--adm-border)", paddingTop: 18 }}>
          <Button onClick={() => router.push("/admin/city_category")}>Cancel</Button>
          <Button variant="primary" onClick={handleSaveClick}>Create page</Button>
        </div>
      </section>

      {confirmOpen && (
        <ConfirmDialog
          title="Create this page?"
          message={`"${form.page_title}" → /${form.page_url}`}
          saving={saving}
          confirmLabel="Yes, create"
          onCancel={() => setConfirmOpen(false)}
          onConfirm={doCreate}
        />
      )}

      <Toast toast={toast} />
    </div>
  );
}
