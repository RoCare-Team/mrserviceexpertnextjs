"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Power, BellRing, LogOut, ShieldOff, Phone, HelpCircle } from "lucide-react";
import { partnerApi } from "../partnerApi";
import { cardCls, btnPrimary, btnGhost } from "../ui";
import { pushState, enablePush, disablePush } from "./push";

const SUPPORT_PHONE = "+91-9311587715";

export default function SettingsTab({ app, setApp, live, vapidKey }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState(null);
  const [push, setPush] = useState("off");
  const [confirmAll, setConfirmAll] = useState(false);

  useEffect(() => {
    pushState().then(setPush).catch(() => setPush("unsupported"));
  }, []);

  const toggleAvailable = async () => {
    setBusy("avail");
    setMsg(null);
    const r = await partnerApi("/api/partners/me/settings", { method: "PATCH", body: { is_available: !app.is_available } });
    setBusy("");
    if (r.ok) setApp((a) => ({ ...a, is_available: r.data.is_available }));
    else setMsg({ ok: false, text: r.error.message });
  };

  const togglePush = async () => {
    setBusy("push");
    setMsg(null);
    try {
      if (push === "on") await disablePush();
      else await enablePush(vapidKey);
      setPush(await pushState());
      setMsg({ ok: true, text: push === "on" ? "Notifications turned off on this device." : "Notifications are on for this device." });
    } catch (e) {
      setMsg({ ok: false, text: e.message });
    }
    setBusy("");
  };

  const logout = async (all) => {
    setBusy(all ? "all" : "logout");
    if (all) await partnerApi("/api/partners/me/logout-all", { method: "POST" });
    else await partnerApi("/api/partner-auth/logout", { method: "POST" });
    router.replace("/partner/login");
    router.refresh();
  };

  return (
    <div className="space-y-5">
      {msg && <p role="status" className={`rounded-xl px-3 py-2 text-sm ${msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}

      {live && (
        <section className={cardCls}>
          <div className="flex flex-wrap items-center gap-4">
            <span className={`rounded-2xl p-3 ${app.is_available ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}><Power className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-[var(--ink)]">Taking bookings: {app.is_available ? "Online" : "Offline"}</h2>
              <p className="text-sm text-[var(--muted)]">
                Going offline (holiday, busy) hides “Book now” on your card and profile. Your profile stays visible.
              </p>
            </div>
            <button
              role="switch"
              aria-checked={app.is_available}
              onClick={toggleAvailable}
              disabled={busy === "avail"}
              className={`relative h-8 w-14 rounded-full transition ${app.is_available ? "bg-emerald-500" : "bg-gray-300"}`}
            >
              <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${app.is_available ? "left-7" : "left-1"}`} />
              <span className="sr-only">Toggle availability</span>
            </button>
          </div>
        </section>
      )}

      {live && (
        <section className={cardCls}>
          <div className="flex flex-wrap items-center gap-4">
            <span className="rounded-2xl bg-purple-50 p-3 text-purple-700"><BellRing className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-[var(--ink)]">Booking alerts on this device</h2>
              <p className="text-sm text-[var(--muted)]">
                Get a notification for new bookings even when this page is closed. Turn it on separately on each phone / computer you use.
              </p>
              {push === "denied" && <p className="mt-1 text-sm text-red-600">Notifications are blocked in your browser settings for this site.</p>}
              {push === "unsupported" && <p className="mt-1 text-sm text-[var(--muted)]">This browser doesn&apos;t support notifications. On iPhone, add this site to your Home Screen first.</p>}
            </div>
            {["on", "off"].includes(push) && (
              <button className={push === "on" ? btnGhost : btnPrimary} onClick={togglePush} disabled={busy === "push"}>
                {busy === "push" && <Loader2 className="h-4 w-4 animate-spin" />} {push === "on" ? "Turn off" : "Turn on"}
              </button>
            )}
          </div>
        </section>
      )}

      <section className={cardCls}>
        <h2 className="mb-3 text-lg font-bold text-[var(--ink)]">Account</h2>
        <p className="text-sm text-[var(--body-text)]">Signed in as <b>+91 {app.mobile}</b> · {app.ref}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={btnGhost} onClick={() => logout(false)} disabled={!!busy}><LogOut className="h-4 w-4" /> Log out</button>
          {!confirmAll ? (
            <button className={btnGhost} onClick={() => setConfirmAll(true)}><ShieldOff className="h-4 w-4" /> Log out of all devices</button>
          ) : (
            <span className="flex items-center gap-2 text-sm">
              Sign out everywhere?
              <button className="font-semibold text-red-700 underline" onClick={() => logout(true)} disabled={!!busy}>Yes</button>
              <button className="underline" onClick={() => setConfirmAll(false)}>No</button>
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">Use “all devices” if you lost a phone or shared your login.</p>
      </section>

      <section className={cardCls}>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-[var(--ink)]"><HelpCircle className="h-5 w-5" /> How it works</h2>
        <ul className="space-y-2 text-sm text-[var(--body-text)]">
          <li><b>Leads:</b> customers book you from your card or profile. You have <b>15 minutes</b> to accept. If you don&apos;t, the booking opens to <b>all partners in the city for 15 minutes</b> — the first to accept gets it (you can still accept it too). If nobody does, it goes to our support team. Open leads from other partners in your city show up in your Leads tab as well.</li>
          <li><b>Coins:</b> 1 coin = ₹1. Accepting a lead costs <b>50% of the service price</b> (e.g. ₹399 service → 199.5 coins). Rejecting is free.</li>
          <li><b>Recharge:</b> minimum ₹500 via Easebuzz. Coins are added only after the payment is confirmed. Every attempt is listed under Wallet → Payment history.</li>
          <li><b>Refunds:</b> if a lead is fake or the customer can&apos;t be reached, use “Report a problem” on the lead. Our team reviews it and refunds the coins if valid.</li>
          <li><b>Profile changes:</b> description, hours, photos and service areas update instantly. Business name, type, GSTIN, categories and services are approved by our team first.</li>
          <li><b>Reviews:</b> verified customers can review you. You can reply publicly; inappropriate reviews can be removed.</li>
        </ul>
        <a href={`tel:${SUPPORT_PHONE.replace(/-/g, "")}`} className={`${btnPrimary} mt-5`}><Phone className="h-4 w-4" /> Call partner support {SUPPORT_PHONE}</a>
      </section>
    </div>
  );
}
