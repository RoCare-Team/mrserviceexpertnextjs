"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Inbox, Coins, Star, BadgeCheck, CircleAlert, Bell, X } from "lucide-react";
import { partnerApi } from "../partnerApi";

const ICON = { lead_new: Inbox, lead_missed: CircleAlert, refund: Coins, payment: Coins, review: Star, status: BadgeCheck, change_request: BadgeCheck };

function ago(d) {
  const s = Math.max(1, Math.round((Date.now() - new Date(d).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Bell dropdown: latest 50 notifications; opening marks them read. */
export default function NotificationsPanel({ onClose, onRead }) {
  const [items, setItems] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    partnerApi("/api/partners/me/notifications").then((r) => {
      setItems(r.ok ? r.data.items : []);
      if (r.ok && r.data.unread) partnerApi("/api/partners/me/notifications", { method: "POST", body: {} }).then(onRead);
    });
    const onDoc = (e) => ref.current && !ref.current.contains(e.target) && onClose();
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={ref} role="dialog" aria-label="Notifications" className="absolute right-0 z-50 mt-2 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-xl">
      <div className="flex items-center border-b border-[var(--line)] px-4 py-3">
        <b className="flex-1 text-[var(--ink)]">Notifications</b>
        <button onClick={onClose} aria-label="Close" className="rounded-full p-1 hover:bg-gray-100"><X className="h-4 w-4" /></button>
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        {items === null && <p className="flex items-center gap-2 p-4 text-sm text-[var(--muted)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>}
        {items?.length === 0 && <p className="p-6 text-center text-sm text-[var(--muted)]">No notifications yet.</p>}
        <ul>
          {items?.map((n) => {
            const Icon = ICON[n.type] || Bell;
            const body = (
              <>
                <span className="mt-0.5 rounded-full bg-purple-50 p-1.5 text-purple-700"><Icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[var(--ink)]">{n.title}</span>
                  {n.body && <span className="block text-xs text-[var(--body-text)]">{n.body}</span>}
                  <span className="block text-[11px] text-[var(--muted)]">{ago(n.created_at)}</span>
                </span>
                {!n.read_at && <span className="mt-2 h-2 w-2 rounded-full bg-purple-600" aria-label="Unread" />}
              </>
            );
            return (
              <li key={n.id} className="border-b border-[var(--line)] last:border-0">
                {n.link ? (
                  <a href={n.link} className="flex gap-3 px-4 py-3 hover:bg-purple-50/50">{body}</a>
                ) : (
                  <div className="flex gap-3 px-4 py-3">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
