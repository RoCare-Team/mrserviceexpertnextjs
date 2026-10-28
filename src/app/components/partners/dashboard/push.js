"use client";

import { partnerApi } from "../partnerApi";

const SW_URL = "/partner-sw.js";
const SCOPE = "/partner/";

export const pushSupported = () =>
  typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

function urlBase64ToUint8Array(base64) {
  const pad = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration(SCOPE)) || navigator.serviceWorker.register(SW_URL, { scope: SCOPE });
}

/** Current state: "unsupported" | "denied" | "on" | "off". */
export async function pushState() {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  const reg = await navigator.serviceWorker.getRegistration(SCOPE);
  const sub = reg && (await reg.pushManager.getSubscription());
  return sub && Notification.permission === "granted" ? "on" : "off";
}

/** Ask permission, subscribe this browser and save it on the server. */
export async function enablePush(vapidPublicKey) {
  if (!pushSupported()) throw new Error("This browser doesn't support notifications.");
  if (!vapidPublicKey) throw new Error("Notifications are not configured on the server.");
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Notifications were blocked. Allow them in your browser settings.");
  const reg = await registration();
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) });
  }
  const r = await partnerApi("/api/partners/me/push", { method: "POST", body: { subscription: sub.toJSON() } });
  if (!r.ok) throw new Error(r.error.message);
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration(SCOPE);
  const sub = reg && (await reg.pushManager.getSubscription());
  if (!sub) return;
  await partnerApi("/api/partners/me/push", { method: "DELETE", body: { subscription: sub.toJSON() } });
  await sub.unsubscribe();
}
