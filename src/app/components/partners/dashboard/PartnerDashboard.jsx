"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Inbox, Wallet, UserRound, Star, Settings, Bell, Coins, Circle } from "lucide-react";
import { partnerApi } from "../partnerApi";
import OverviewTab from "./OverviewTab";
import LeadsTab from "./LeadsTab";
import WalletTab from "./WalletTab";
import ProfileTab from "./ProfileTab";
import ReviewsTab from "./ReviewsTab";
import SettingsTab from "./SettingsTab";
import NotificationsPanel from "./NotificationsPanel";
import ApplicationStatus from "./ApplicationStatus";

const TABS = [
  { key: "overview", label: "Overview", short: "Home", icon: LayoutDashboard },
  { key: "leads", label: "Leads", short: "Leads", icon: Inbox, live: true },
  { key: "wallet", label: "Wallet", short: "Wallet", icon: Wallet, live: true },
  { key: "profile", label: "Profile", short: "Profile", icon: UserRound, live: true },
  { key: "reviews", label: "Reviews", short: "Reviews", icon: Star, live: true },
  { key: "settings", label: "Settings & help", short: "More", icon: Settings },
];

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.15;
    o.start();
    o.stop(ctx.currentTime + 0.35);
  } catch {}
}

/**
 * Partner dashboard shell. Tabs are kept in ?tab= so links / push
 * notifications can open a specific section. Leads + notifications are
 * polled so new bookings alert the partner on any tab.
 */
export default function PartnerDashboard({ initialApp, initialTab, paymentResult }) {
  const [app, setApp] = useState(initialApp);
  // "live" = approved at least once → leads, wallet, profile tools are available.
  const live = !!app.approved_at || app.status === "approved";
  const tabs = TABS.filter((t) => live || !t.live);
  const [tab, setTab] = useState(tabs.some((t) => t.key === initialTab) ? initialTab : "overview");
  const [balance, setBalance] = useState(null);
  const [newLeads, setNewLeads] = useState(0);
  const [unread, setUnread] = useState(0);
  const [bellOpen, setBellOpen] = useState(false);
  const [vapidKey, setVapidKey] = useState("");
  const known = useRef(null);

  const go = (key) => {
    setTab(key);
    setBellOpen(false);
    window.history.replaceState(null, "", `/partner/dashboard?tab=${key}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const poll = useCallback(async () => {
    if (!live) return;
    const [leads, notes] = await Promise.all([partnerApi("/api/partners/me/leads?group=new"), partnerApi("/api/partners/me/notifications")]);
    if (leads.ok) {
      const ids = leads.data.leads.filter((l) => l.seconds_left > 0).map((l) => l.id);
      if (known.current && ids.some((id) => !known.current.has(id))) {
        beep();
        document.title = "🔔 New booking – Mr. Service Expert";
      }
      known.current = new Set(ids);
      setNewLeads(ids.length);
      setBalance(leads.data.balance);
    } else if (leads.status === 401) window.location.assign("/partner/login");
    if (notes.ok) {
      setUnread(notes.data.unread);
      setVapidKey(notes.data.vapidPublicKey);
    }
  }, [live]);

  useEffect(() => {
    poll();
    const t = setInterval(poll, 30_000);
    const onVis = () => document.visibilityState === "visible" && (poll(), (document.title = "Partner Dashboard | Mr. Service Expert"));
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [poll]);

  const lowBalance = live && balance !== null && balance < (app.low_balance_alert ?? 200);
  const shared = { app, setApp, go, balance, setBalance, refresh: poll, vapidKey };

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-24 lg:pb-10">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 pt-6 lg:pt-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block" aria-label="Dashboard sections">
          <div className="sticky top-24 rounded-2xl border border-[var(--line)] bg-white p-3 shadow-sm">
            <div className="px-3 pb-3 pt-1">
              <p className="truncate font-bold text-[var(--ink)]">{app.business.business_name || app.full_name}</p>
              <p className="text-xs text-[var(--muted)]">{app.ref}</p>
            </div>
            <nav className="space-y-1">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => go(t.key)}
                  aria-current={tab === t.key ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    tab === t.key ? "bg-purple-600 text-white" : "text-[var(--ink-soft)] hover:bg-purple-50"
                  }`}
                >
                  <t.icon className="h-5 w-5" /> {t.label}
                  {t.key === "leads" && newLeads > 0 && (
                    <span className={`ml-auto rounded-full px-2 text-xs font-bold ${tab === t.key ? "bg-white text-purple-700" : "bg-red-500 text-white"}`}>{newLeads}</span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          {/* Header */}
          <header className="mb-5 flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-2xl font-bold text-[var(--ink)]">{TABS.find((t) => t.key === tab)?.label}</h1>
              <p className="text-sm text-[var(--muted)]">Hi, {app.full_name || "Partner"}</p>
            </div>
            {live && (
              <>
                <span
                  className={`hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold sm:inline-flex ${app.is_available ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}
                >
                  <Circle className={`h-2.5 w-2.5 ${app.is_available ? "fill-emerald-500 text-emerald-500" : "fill-gray-400 text-gray-400"}`} />
                  {app.is_available ? "Online" : "Offline"}
                </span>
                <button onClick={() => go("wallet")} className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-800">
                  <Coins className="h-4 w-4" /> {balance === null ? "…" : balance.toLocaleString("en-IN")}
                </button>
              </>
            )}
            <div className="relative">
              <button
                onClick={() => setBellOpen((o) => !o)}
                className="relative rounded-full border border-[var(--line)] bg-white p-2.5 hover:bg-purple-50"
                aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
                aria-expanded={bellOpen}
              >
                <Bell className="h-5 w-5 text-[var(--ink-soft)]" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1 text-center text-[11px] font-bold leading-5 text-white">{unread > 99 ? "99+" : unread}</span>
                )}
              </button>
              {bellOpen && <NotificationsPanel onClose={() => setBellOpen(false)} onRead={() => setUnread(0)} />}
            </div>
          </header>

          {lowBalance && tab !== "wallet" && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <Coins className="h-5 w-5" /> Low balance: {balance} coins. You may not be able to accept the next lead.
              <button onClick={() => go("wallet")} className="ml-auto font-semibold underline">Recharge</button>
            </div>
          )}
          {live && !app.is_available && tab !== "settings" && (
            <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--line)] bg-white p-3 text-sm text-[var(--ink-soft)]">
              You&apos;re offline — customers can&apos;t book you right now.
              <button onClick={() => go("settings")} className="ml-auto font-semibold text-purple-700 underline">Go online</button>
            </div>
          )}

          {tab === "overview" && (live ? <OverviewTab {...shared} newLeads={newLeads} /> : <ApplicationStatus app={app} />)}
          {tab === "leads" && <LeadsTab {...shared} />}
          {tab === "wallet" && <WalletTab {...shared} paymentResult={paymentResult} />}
          {tab === "profile" && <ProfileTab {...shared} />}
          {tab === "reviews" && <ReviewsTab {...shared} />}
          {tab === "settings" && <SettingsTab {...shared} live={live} />}

          {!live && (
            <p className="mt-6 text-center text-xs text-[var(--muted)]">
              Leads, wallet and profile tools unlock once your profile is approved. <Link href="/join-as-partner" className="underline">Open application</Link>
            </p>
          )}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--line)] bg-white/95 backdrop-blur lg:hidden" aria-label="Dashboard sections">
        <ul className="mx-auto flex max-w-lg">
          {tabs.map((t) => (
            <li key={t.key} className="flex-1">
              <button
                onClick={() => go(t.key)}
                aria-current={tab === t.key ? "page" : undefined}
                className={`relative flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${tab === t.key ? "text-purple-700" : "text-[var(--muted)]"}`}
              >
                <t.icon className="h-5 w-5" />
                {t.short}
                {t.key === "leads" && newLeads > 0 && (
                  <span className="absolute right-[calc(50%-18px)] top-1 min-w-4 rounded-full bg-red-500 px-1 text-[10px] font-bold leading-4 text-white">{newLeads}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
