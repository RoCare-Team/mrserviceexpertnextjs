/* Partner dashboard service worker — web push only (no caching).
   Registered with scope "/partner/" from the partner dashboard. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Mr. Service Expert", body: event.data ? event.data.text() : "" };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Mr. Service Expert", {
      body: data.body || "",
      tag: data.tag || "mse-partner",
      renotify: true,
      requireInteraction: data.tag === "lead_new",
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      data: { url: data.url || "/partner/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || "/partner/dashboard", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if (w.url.includes("/partner/") && "focus" in w) {
          w.navigate(url);
          return w.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
