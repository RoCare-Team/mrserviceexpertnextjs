"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Tags,
  MapPin,
  FolderTree,
  FileText,
  Newspaper,
  Route,
  Search,
  Bell,
  Settings,
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
      { href: "/admin/city_category", icon: FileText, name: "City Pages" },
    ],
  },
  {
    label: "Content",
    items: [{ href: "/admin/blogs", icon: Newspaper, name: "Blogs" }],
  },
  {
    label: "System",
    items: [{ href: "/admin/redirects", icon: Route, name: "Redirects" }],
  },
];

const TITLES = {
  "/admin": "Dashboard",
  "/admin/brand_edits": "Brands",
  "/admin/category_edits": "Categories",
  "/admin/city_edits": "Cities",
  "/admin/city_category": "City Pages",
  "/admin/blogs": "Blogs",
  "/admin/redirects": "Redirects",
};

export default function AdminShell({ children }) {
  const pathname = usePathname() || "/admin";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  const title = TITLES[pathname] || "Admin";

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
                <span>Admin Console</span>
              </div>
            )}
          </div>

          <nav className="adm-nav">
            {NAV.map((group) => (
              <div key={group.label}>
                <div className="adm-navlabel">{group.label}</div>
                {group.items.map((item) => {
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
            ))}
          </nav>

          <div className="adm-sidefoot">
            <div className="adm-userchip">
              <div className="adm-avatar">AD</div>
              {!collapsed && (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>Admin</b>
                  <small>Signed in</small>
                </div>
              )}
              {!collapsed && (
                <button
                  className="adm-iconbtn"
                  style={{ width: 32, height: 32, color: "#c9b9ef" }}
                  title="Sign out"
                  aria-label="Sign out"
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

            {/* <button className="adm-iconbtn" style={{ position: "relative" }} aria-label="Notifications">
              <Bell size={19} />
              <span className="adm-bell-dot" />
            </button>
            <button className="adm-iconbtn" aria-label="Settings">
              <Settings size={19} />
            </button> */}
            <div className="adm-avatar" style={{ width: 38, height: 38 }}>AD</div>
          </header>

          <main className="adm-content">{children}</main>
        </div>
      </div>
    </div>
  );
}
