"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Eye, BadgeCheck, MapPin, Wrench } from "lucide-react";
import {
  PageHead,
  Field,
  SearchInput,
  Select,
  Input,
  Button,
  SortHeader,
  Badge,
  Dash,
  TableState,
  Pagination,
} from "@/app/(admin)/admin/components/AdminUI";
import { STATUS_META } from "./statusMeta";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : null);

export default function AdminPartnersPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [counts, setCounts] = useState({});
  const [categories, setCategories] = useState([]);
  const [alerts, setAlerts] = useState(null);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("pending");
  const [categoryId, setCategoryId] = useState("");
  const [city, setCity] = useState(null);
  const [cityQ, setCityQ] = useState("");
  const [cityOpts, setCityOpts] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState("submitted_at");
  const [sortDir, setSortDir] = useState("DESC");
  const timer = useRef(null);
  const cityTimer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
  }, [searchInput]);

  useEffect(() => {
    fetch("/api/admin/partners/notifications")
      .then((r) => r.json())
      .then((d) => d.success && setAlerts(d.data))
      .catch(() => {});
  }, [rows]);

  useEffect(() => {
    fetch("/api/admin/partners/service-types")
      .then((r) => r.json())
      .then((d) => d.success && setCategories(d.data.categories))
      .catch(() => {});
  }, []);

  useEffect(() => {
    clearTimeout(cityTimer.current);
    if (cityQ.trim().length < 2) return setCityOpts([]);
    cityTimer.current = setTimeout(async () => {
      const r = await fetch(`/api/admin/partners/locations?search=${encodeURIComponent(cityQ.trim())}`).then((x) => x.json()).catch(() => null);
      setCityOpts(r?.success ? r.data : []);
    }, 300);
  }, [cityQ]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ page, limit, search, status, sortBy, sortDir });
      if (categoryId) qs.set("categoryId", categoryId);
      if (city) qs.set("cityId", city.id);
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      const res = await fetch(`/api/admin/partners?${qs}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || json.message || "Failed to load.");
      setRows(json.data.rows);
      setTotal(json.data.total);
      setTotalPages(json.data.totalPages);
      setCounts(json.data.counts);
    } catch (e) {
      setError(e.message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, status, categoryId, city, from, to, sortBy, sortDir]);

  useEffect(() => {
    load();
  }, [load]);

  const onSort = (col) => {
    if (sortBy === col) setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    else {
      setSortBy(col);
      setSortDir("DESC");
    }
    setPage(1);
  };
  const reset = () => {
    setSearchInput("");
    setSearch("");
    setStatus("");
    setCategoryId("");
    setCity(null);
    setFrom("");
    setTo("");
    setPage(1);
  };

  const allCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const sortProps = { sortBy, sortDir, onSort };
  const fromN = total === 0 ? 0 : (page - 1) * limit + 1;

  return (
    <div>
      <PageHead
        eyebrow="Partners"
        title="Partner applications"
        subtitle="Review, approve and manage service partners."
        count={counts.pending || 0}
        countLabel="awaiting review"
      />

      {alerts && (alerts.locality_requests > 0 || alerts.lead_issues > 0 || alerts.crm_failed > 0) && (
        <div className="adm-card" style={{ padding: 12, marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 16, fontSize: 14 }}>
          <b>Also waiting:</b>
          {alerts.locality_requests > 0 && <Link href="/admin/partners/locations">{alerts.locality_requests} locality request(s) from partners →</Link>}
          {alerts.lead_issues > 0 && <Link href="/admin/partners/leads?issues=1">{alerts.lead_issues} lead problem report(s) →</Link>}
          {alerts.crm_failed > 0 && <Link href="/admin/partners/leads">{alerts.crm_failed} failed CRM forward(s) →</Link>}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {[["", "All", allCount], ...Object.entries(STATUS_META).map(([k, m]) => [k, m.label, counts[k] || 0])].map(([k, label, n]) => (
          <button
            key={k || "all"}
            onClick={() => {
              setStatus(k);
              setPage(1);
            }}
            className={`adm-btn adm-btn-sm ${status === k ? "adm-btn-primary" : ""}`}
          >
            {label} <b style={{ marginLeft: 4 }}>{n}</b>
          </button>
        ))}
        <span style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <Link href="/admin/partners/services" className="adm-btn adm-btn-sm"><Wrench size={14} /> Service catalogue</Link>
          <Link href="/admin/partners/locations" className="adm-btn adm-btn-sm"><MapPin size={14} /> Localities</Link>
        </span>
      </div>

      <div className="adm-toolbar">
        <Field label="Search (name, business, mobile, ref)" grow>
          <SearchInput value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="e.g. Sharma RO or 98…" />
        </Field>
        <Field label="Category">
          <Select value={categoryId} onChange={(e) => (setCategoryId(e.target.value), setPage(1))}>
            <option value="">All</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.category_name}</option>)}
          </Select>
        </Field>
        <Field label="City / locality">
          {city ? (
            <Button onClick={() => (setCity(null), setPage(1))}>{city.city_name} ✕</Button>
          ) : (
            <div style={{ position: "relative" }}>
              <Input value={cityQ} onChange={(e) => setCityQ(e.target.value)} placeholder="Type 2+ letters" />
              {cityOpts.length > 0 && (
                <ul className="adm-card" style={{ position: "absolute", zIndex: 30, width: "100%", maxHeight: 240, overflow: "auto", padding: 4 }}>
                  {cityOpts.map((c) => (
                    <li key={c.id}>
                      <button
                        className="adm-btn adm-btn-ghost adm-btn-sm"
                        style={{ width: "100%", justifyContent: "flex-start" }}
                        onClick={() => (setCity(c), setCityQ(""), setCityOpts([]), setPage(1))}
                      >
                        {c.city_name}
                        {c.parent_name ? ` (${c.parent_name})` : ""}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </Field>
        <Field label="Registered from">
          <Input type="date" value={from} onChange={(e) => (setFrom(e.target.value), setPage(1))} />
        </Field>
        <Field label="to">
          <Input type="date" value={to} onChange={(e) => (setTo(e.target.value), setPage(1))} />
        </Field>
        <Field label="Per page">
          <Select value={limit} onChange={(e) => (setLimit(Number(e.target.value)), setPage(1))}>
            {[10, 25, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
          </Select>
        </Field>
        <Button onClick={reset}>Clear</Button>
      </div>

      {error && (
        <div className="adm-card" style={{ padding: 14, marginBottom: 12, color: "#b42318" }}>
          {error} <Button size="sm" onClick={load}>Retry</Button>
        </div>
      )}

      <div className="adm-tablecard">
        <div className="adm-tablescroll">
          <table className="adm-table">
            <thead>
              <tr>
                <SortHeader label="Ref" col="id" {...sortProps} />
                <SortHeader label="Partner" col="business_name" {...sortProps} />
                <SortHeader label="Mobile" sortable={false} />
                <SortHeader label="Categories" sortable={false} />
                <SortHeader label="Coverage" sortable={false} />
                <SortHeader label="Submitted" col="submitted_at" {...sortProps} />
                <SortHeader label="Status" col="status" {...sortProps} />
                <SortHeader label="Last review" col="reviewed_at" {...sortProps} />
                <SortHeader label="" sortable={false} />
              </tr>
            </thead>
            <tbody>
              {loading || rows.length === 0 ? (
                <TableState colSpan={9} loading={loading} emptyTitle="No partners found" emptyHint="Try another status or clear the filters." />
              ) : (
                rows.map((r) => (
                  <tr key={r.id}>
                    <td className="col-id">{r.ref}</td>
                    <td>
                      <b style={{ display: "block" }}>{r.business_name || <Dash />}</b>
                      <span className="col-muted">{r.full_name}</span>
                    </td>
                    <td style={{ whiteSpace: "nowrap" }}>
                      {r.mobile}{" "}
                      {r.mobile_verified && <BadgeCheck size={14} style={{ color: "#16a34a", verticalAlign: "-2px" }} aria-label="Verified" />}
                    </td>
                    <td className="col-muted"><span className="adm-truncate" style={{ display: "block", maxWidth: 200 }}>{r.categories || <Dash />}</span></td>
                    <td className="col-muted"><span className="adm-truncate" style={{ display: "block", maxWidth: 220 }}>{r.coverage || <Dash />}</span></td>
                    <td className="col-muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(r.submitted_at) || <Dash />}</td>
                    <td>
                      <Badge tone={STATUS_META[r.status]?.tone}>{STATUS_META[r.status]?.label}</Badge>
                      {r.status === "approved" && !r.is_listed && <span className="col-muted" style={{ display: "block", fontSize: 12 }}>Hidden</span>}
                    </td>
                    <td className="col-muted" style={{ whiteSpace: "nowrap" }}>{fmtDate(r.reviewed_at) || <Dash />}</td>
                    <td>
                      <Link href={`/admin/partners/${r.id}`} className="adm-btn adm-btn-ghost adm-btn-sm"><Eye size={14} /> Review</Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} totalPages={totalPages} from={fromN} to={Math.min(page * limit, total)} total={total} onPage={setPage} />
    </div>
  );
}
