"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { PageHead, Field, Input, Button, Badge, Dash, FormCard, SectionTitle, Toast, Select } from "@/app/(admin)/admin/components/AdminUI";

async function call(url, method = "GET", body) {
  const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json().catch(() => null);
  if (!json?.success) throw new Error(json?.error?.message || json?.message || "Request failed.");
  return json.data;
}

/** Search box over every city_tb row. */
function CityPick({ label, value, onChange, placeholder }) {
  const [q, setQ] = useState("");
  const [opts, setOpts] = useState([]);
  const t = useRef(null);
  useEffect(() => {
    clearTimeout(t.current);
    if (q.trim().length < 2) return setOpts([]);
    t.current = setTimeout(() => call(`/api/admin/partners/locations?search=${encodeURIComponent(q.trim())}`).then(setOpts).catch(() => setOpts([])), 300);
  }, [q]);
  return (
    <Field label={label}>
      {value ? (
        <Button onClick={() => onChange(null)}>
          {value.city_name}
          {value.parent_name ? ` (in ${value.parent_name})` : ""} ✕
        </Button>
      ) : (
        <div style={{ position: "relative" }}>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} />
          {opts.length > 0 && (
            <ul className="adm-card" style={{ position: "absolute", zIndex: 30, width: "100%", maxHeight: 260, overflow: "auto", padding: 4 }}>
              {opts.map((c) => (
                <li key={c.id}>
                  <button className="adm-btn adm-btn-ghost adm-btn-sm" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => (onChange(c), setQ(""), setOpts([]))}>
                    {c.city_name} <span className="col-muted">· /{c.city_url}{c.parent_name ? ` · locality of ${c.parent_name}` : c.child_count ? ` · ${c.child_count} localities` : ""}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Field>
  );
}

export default function PartnerLocationsPage() {
  const [parent, setParent] = useState(null);
  const [child, setChild] = useState(null);
  const [localities, setLocalities] = useState([]);
  const [requests, setRequests] = useState([]);
  const [mapTo, setMapTo] = useState({});
  const [reqLocs, setReqLocs] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadRequests = useCallback(async () => {
    try {
      const reqs = await call("/api/admin/partners/locations");
      setRequests(reqs);
      const cityIds = [...new Set(reqs.map((r) => r.city_id))];
      const entries = await Promise.all(cityIds.map(async (cid) => [cid, await call(`/api/admin/partners/locations?parentId=${cid}`)]));
      setReqLocs(Object.fromEntries(entries));
    } catch (e) {
      showToast(e.message, "error");
    }
  }, []);

  const loadLocalities = useCallback(async () => {
    if (!parent) return setLocalities([]);
    try {
      setLocalities(await call(`/api/admin/partners/locations?parentId=${parent.id}`));
    } catch (e) {
      showToast(e.message, "error");
    }
  }, [parent]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);
  useEffect(() => {
    loadLocalities();
  }, [loadLocalities]);

  const act = async (fn, msg) => {
    setSaving(true);
    try {
      await fn();
      showToast(msg);
      await Promise.all([loadLocalities(), loadRequests()]);
      return true;
    } catch (e) {
      showToast(e.message, "error");
      return false;
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Link href="/admin/partners" className="adm-btn adm-btn-ghost adm-btn-sm" style={{ marginBottom: 12 }}>
        <ArrowLeft size={14} /> All partners
      </Link>
      <PageHead
        eyebrow="Partners"
        title="Localities"
        subtitle="A locality is an existing city page (city_tb) placed under a parent city. Partners pick localities under their city; locality-level partners are listed on that locality's pages."
      />

      <FormCard className="mb-4">
        <SectionTitle>Localities of a city</SectionTitle>
        <div className="adm-formgrid">
          <CityPick label="Parent city" value={parent} onChange={setParent} placeholder="e.g. Gurgaon" />
          {parent && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <CityPick label="Add an existing city page as locality" value={child} onChange={setChild} placeholder="e.g. Sohna" />
              </div>
              <Button
                variant="primary"
                disabled={!child || saving}
                onClick={async () => {
                  if (await act(() => call("/api/admin/partners/locations", "POST", { city_id: child.id, parent_city_id: parent.id }), "Locality added.")) setChild(null);
                }}
              >
                Add
              </Button>
            </div>
          )}
        </div>
        {parent && (
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
            {localities.length === 0 && <span className="col-muted">No localities under {parent.city_name} yet.</span>}
            {localities.map((l) => (
              <span key={l.id} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Badge tone="info">{l.city_name} · {l.partner_count} partner(s)</Badge>
                <button
                  className="adm-iconbtn"
                  style={{ width: 28, height: 28 }}
                  aria-label={`Remove ${l.city_name}`}
                  disabled={saving}
                  onClick={() => act(() => call(`/api/admin/partners/locations?cityId=${l.id}`, "DELETE"), "Locality removed.")}
                >
                  <Trash2 size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
        <p className="col-muted" style={{ marginTop: 10, fontSize: 13 }}>
          Missing locality page? Create it first under Catalogue → Cities (Add city), then add it here. Nothing is created automatically.
        </p>
      </FormCard>

      <FormCard>
        <SectionTitle>Partner locality requests</SectionTitle>
        {requests.length === 0 && <p className="col-muted">No pending requests.</p>}
        {requests.map((r) => (
          <div key={r.id} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #eee" }}>
            <b>{r.requested_name}</b> <span className="col-muted">in {r.city_name}</span>
            <Link href={`/admin/partners/${r.partner_id}`} className="col-muted">— {r.business_name || r.full_name || <Dash />}</Link>
            <span style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <Select value={mapTo[r.id] || ""} onChange={(e) => setMapTo((m) => ({ ...m, [r.id]: e.target.value }))}>
                <option value="">Map to locality…</option>
                {(reqLocs[r.city_id] || []).map((l) => <option key={l.id} value={l.id}>{l.city_name}</option>)}
              </Select>
              <Button
                size="sm"
                variant="primary"
                disabled={!mapTo[r.id] || saving}
                onClick={() => act(() => call("/api/admin/partners/locations", "PATCH", { request_id: r.id, action: "map", locality_id: Number(mapTo[r.id]) }), "Mapped and added to partner coverage.")}
              >
                Map
              </Button>
              <Button size="sm" variant="danger" disabled={saving} onClick={() => act(() => call("/api/admin/partners/locations", "PATCH", { request_id: r.id, action: "reject" }), "Request rejected.")}>
                Reject
              </Button>
            </span>
          </div>
        ))}
      </FormCard>
      <Toast toast={toast} />
    </div>
  );
}
