"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Tags,
  MapPin,
  FolderTree,
  FileText,
  Newspaper,
  Route,
  ShieldCheck,
  Search,
  Menu,
  ChevronLeft,
  PanelLeftClose,
  LogOut,
} from "lucide-react";

const NAV = [
  {
    label: "Overview",
    items: [{ href: "/admin", icon: LayoutDashboard, name: "Dashboard", exact: true }],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/admin/brand_edits", icon: Tags, name: "Brands" },
      { href: "/admin/category_edits", icon: FolderTree, name: "Categories" },
      { href: "/admin/city_edits", icon: MapPin, name: "Cities" },
      { href: "/admin/city_category", icon: FileText, name: "Pages" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/blogs", icon: Newspaper, name: "Blogs" },
      { href: "/admin/blog-categories", icon: Newspaper, name: "Blog Categories" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/redirects", icon: Route, name: "Redirects" },
      // Only rendered for super admins (see filter below).
      { href: "/admin/admins", icon: ShieldCheck, name: "Admins", superOnly: true },
    ],
  },
];

const TITLES = {
  "/admin": "Dashboard",
  "/admin/brand_edits": "Brands",
  "/admin/category_edits": "Categories",
  "/admin/city_edits": "Cities",
  "/admin/city_category": "Pages",
  "/admin/blogs": "Blogs",
  "/admin/blog-categories": "Blog Categories",
  "/admin/redirects": "Redirects",
  "/admin/admins": "Admins",
};

const initials = (name = "", email = "") => {
  const base = (name || email || "AD").trim();
  const parts = base.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
};

export default function AdminShell({ children }) {
  const pathname = usePathname() || "/admin";
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // The login screen renders bare (no sidebar / topbar).
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (isLogin) return;
    let alive = true;
    fetch("/api/admin/auth/me")
      .then((r) => r.json())
      .then((d) => alive && d.success && setUser(d.user))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [isLogin]);

  if (isLogin) return <>{children}</>;

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const title = TITLES[pathname] || "Admin";
  const isSuper = user?.role === "super_admin";

  const logout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch {}
    window.location.assign("/admin/login");
  };

  return (
    <div className="adm-root">
      <div className="adm-layout">
        {/* Sidebar */}
        <aside
          className={`adm-sidebar ${collapsed ? "collapsed" : ""} ${
            mobileOpen ? "mobile-open" : ""
          }`}
        >
          <div className="adm-brandbar">
            <div className="adm-brandmark">MS</div>
            {!collapsed && (
              <div className="adm-brandtext">
                <b>Mr. Service Expert</b>
                <p className="text-[12px]">Admin Console</p>
              </div>
            )}
          </div>

          <nav className="adm-nav">
            {NAV.map((group) => {
              const items = group.items.filter((it) => !it.superOnly || isSuper);
              if (!items.length) return null;
              return (
                <div key={group.label}>
                  <div className="adm-navlabel">{group.label}</div>
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`adm-navitem ${isActive(item) ? "active" : ""}`}
                        title={item.name}
                      >
                        <Icon strokeWidth={2} />
                        <span className="adm-navtxt">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>

          <div className="adm-sidefoot">
            <div className="adm-userchip">
              <div className="adm-avatar">{initials(user?.name, user?.email)}</div>
              {!collapsed && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {user?.name || "…"}
                  </b>
                  <small style={{ textTransform: "capitalize" }}>
                    {user ? (user.role === "super_admin" ? "Super admin" : "Admin") : "Loading"}
                  </small>
                </div>
              )}
              {!collapsed && (
                <button
                  className="adm-iconbtn"
                  style={{ width: 32, height: 32, color: "#c9b9ef" }}
                  title="Sign out"
                  aria-label="Sign out"
                  onClick={logout}
                  disabled={loggingOut}
                >
                  <LogOut size={17} />
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="adm-overlay" onClick={() => setMobileOpen(false)} />
        )}

        {/* Main */}
        <div className={`adm-main ${collapsed ? "collapsed" : ""}`}>
          <header className="adm-topbar">
            <button
              className="adm-iconbtn adm-menu-mobile"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <button
              className="adm-iconbtn adm-collapse-btn"
              onClick={() => setCollapsed((c) => !c)}
              aria-label="Toggle sidebar"
              title="Toggle sidebar"
            >
              {collapsed ? <PanelLeftClose size={20} /> : <ChevronLeft size={20} />}
            </button>

            <span className="adm-topbar-title">{title}</span>

            <div className="adm-search" style={{ marginLeft: "auto" }}>
              <Search size={17} />
              <input placeholder="Search the console…" aria-label="Search" />
            </div>

            <button
              className="adm-iconbtn"
              title="Sign out"
              aria-label="Sign out"
              onClick={logout}
              disabled={loggingOut}
            >
              <LogOut size={19} />
            </button>
            <div className="adm-avatar" style={{ width: 38, height: 38 }}>
              {initials(user?.name, user?.email)}
            </div>
          </header>

          <main className="adm-content">{children}</main>
        </div>
      </div>
    </div>
  );
}
