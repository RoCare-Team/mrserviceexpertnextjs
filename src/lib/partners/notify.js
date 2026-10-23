// Partner notifications: stored for the dashboard's notification centre and,
// when the partner allowed it, delivered as browser push (works while the
// dashboard is closed). Never throws — a notification failure must not break
// the action that triggered it.
//
// Env: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT

import crypto from "node:crypto";
import webpush from "web-push";
import db from "@/lib/db";

let vapidReady = null;
function setupVapid() {
  if (vapidReady !== null) return vapidReady;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return (vapidReady = false);
  try {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://www.mrserviceexpert.com", pub, priv);
    vapidReady = true;
  } catch (err) {
    console.error("[push] VAPID setup failed:", err?.message);
    vapidReady = false;
  }
  return vapidReady;
}

export const vapidPublicKey = () => process.env.VAPID_PUBLIC_KEY || "";
export const endpointHash = (endpoint) => crypto.createHash("sha256").update(endpoint).digest("hex");

async function push(partnerId, payload) {
  if (!setupVapid()) return;
  const [subs] = await db.query("SELECT id, endpoint, p256dh, auth FROM partner_push_subscriptions WHERE partner_id = ?", [partnerId]);
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
          { TTL: 1800, urgency: "high" }
        );
        await db.query("UPDATE partner_push_subscriptions SET last_ok_at = NOW() WHERE id = ?", [s.id]);
      } catch (err) {
        // 404 / 410 = subscription gone (uninstalled / permission revoked).
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await db.query("DELETE FROM partner_push_subscriptions WHERE id = ?", [s.id]);
        } else console.error("[push] send failed:", err?.statusCode, err?.body || err?.message);
      }
    })
  );
}

/**
 * notifyPartner(id, { type, title, body?, link? }, { push: boolean })
 * type examples: lead_new, lead_missed, refund, review, status, change_request, payment
 */
export async function notifyPartner(partnerId, { type, title, body = "", link = null }, { push: doPush = false } = {}) {
  try {
    await db.query("INSERT INTO partner_notifications (partner_id, type, title, body, link) VALUES (?, ?, ?, ?, ?)", [
      partnerId,
      String(type).slice(0, 40),
      String(title).slice(0, 160),
      String(body).slice(0, 500),
      link ? String(link).slice(0, 255) : null,
    ]);
    if (doPush) await push(partnerId, { title, body, url: link || "/partner/dashboard", tag: type });
  } catch (err) {
    console.error("[notify]", err?.message);
  }
}
