"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Tags,
  FolderTree,
  MapPin,
  FileText,
  Newspaper,
  Route,
  ArrowUpRight,
  Plus,
  TrendingUp,
  Clock,
} from "lucide-react";

const CARDS = [
  { key: "brands", name: "Brands", icon: Tags, href: "/admin/brand_edits", api: "/api/admin/edit_brand?page=1&limit=1" },
  { key: "categories", name: "Categories", icon: FolderTree, href: "/admin/category_edits", api: "/api/admin/edit_category?page=1&limit=1" },
  { key: "cities", name: "Cities", icon: MapPin, href: "/admin/city_edits", api: "/api/admin/edit_city?page=1&limit=1" },
  { key: "pages", name: "City Pages", icon: FileText, href: "/admin/city_category", api: "/api/admin/edit_page?page=1&limit=1" },
];

const QUICK = [
  { name: "Manage brands", desc: "Edit brand details & SEO", icon: Tags, href: "/admin/brand_edits" },
  { name: "Manage categories", desc: "Organise service categories", icon: FolderTree, href: "/admin/category_edits" },
  { name: "Manage cities", desc: "Update service locations", icon: MapPin, href: "/admin/city_edits" },
  { name: "Manage city pages", desc: "Content for city & category", icon: FileText, href: "/admin/city_category" },
  { name: "Manage blogs", desc: "Write & publish articles", icon: Newspaper, href: "/admin/blogs" },
  { name: "Manage redirects", desc: "301 & 302 URL rules", icon: Route, href: "/admin/redirects" },
];

export default function AdminDashboard() {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    Promise.all(
      CARDS.map((c) =>
        fetch(c.api)
          .then((r) => r.json())
          .then((d) => [c.key, d?.success ? d.total ?? 0 : null])
          .catch(() => [c.key, null])
      )
    ).then((pairs) => {
      if (!alive) return;
      setCounts(Object.fromEntries(pairs));
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  const fmt = (n) =>
    n === null || n === undefined ? "—" : Number(n).toLocaleString("en-IN");

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  })();

  return (
    <div>
      {/* Hero */}
      <div className="adm-pagehead">
        <div>
          <span className="eyebrow">Console</span>
          <h1>{greeting}, Admin 👋</h1>
          <p>Here&apos;s what&apos;s happening across your service catalogue today.</p>
        </div>
        <span className="adm-pill">
          <TrendingUp size={15} /> Live overview
        </span>
      </div>

      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          marginBottom: 30,
        }}
      >
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.key} href={c.href} className="adm-stat" style={{ display: "block" }}>
              <span className="spark" />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div className="ico">
                  <Icon size={22} />
                </div>
                <ArrowUpRight size={18} style={{ color: "var(--adm-muted)" }} />
              </div>
              <div style={{ marginTop: 18 }}>
                {loading ? (
                  <div className="adm-skel" style={{ height: 30, width: 90 }} />
                ) : (
                  <div className="num">{fmt(counts[c.key])}</div>
                )}
                <div className="lbl" style={{ marginTop: 6 }}>
                  Total {c.name}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two-column: quick actions + activity */}
      <div
        style={{
          display: "grid",
          gap: 20,
          gridTemplateColumns: "minmax(0, 1.5fr) minmax(0, 1fr)",
          alignItems: "start",
        }}
        className="adm-dash-cols"
      >
        {/* Quick actions */}
        <section className="adm-card" style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Quick actions</h2>
            <Plus size={18} style={{ color: "var(--adm-muted)" }} />
          </div>
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
            {QUICK.map((q) => {
              const Icon = q.icon;
              return (
                <Link key={q.name} href={q.href} className="adm-quick">
                  <div className="qico">
                    <Icon size={20} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5, color: "var(--adm-ink)" }}>{q.name}</div>
                    <div style={{ color: "var(--adm-muted)", fontSize: 12.5 }}>{q.desc}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Activity / tips */}
        <section className="adm-card" style={{ padding: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <Clock size={18} style={{ color: "var(--adm-brand)" }} />
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>Getting started</h2>
          </div>
          <ol style={{ display: "grid", gap: 14, paddingLeft: 0, listStyle: "none" }}>
            {[
              "Use the sidebar to jump between Brands, Categories, Cities and City Pages.",
              "Each section supports search, filtering, sorting and inline editing.",
              "Edit SEO meta and rich content directly in the page editor.",
              "Changes save instantly and reflect on the public site.",
            ].map((t, i) => (
              <li key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                <span
                  style={{
                    flexShrink: 0,
                    width: 26, height: 26, borderRadius: 8,
                    display: "grid", placeItems: "center",
                    fontSize: 12.5, fontWeight: 700,
                    color: "var(--adm-brand)", background: "var(--adm-brand-soft)",
                  }}
                >
                  {i + 1}
                </span>
                <span style={{ fontSize: 13.5, color: "var(--adm-ink)", lineHeight: 1.5 }}>{t}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <style>{`
        @media (max-width: 880px) {
          .adm-dash-cols { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
