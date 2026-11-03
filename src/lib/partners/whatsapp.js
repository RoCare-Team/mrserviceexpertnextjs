// WhatsApp template messages to partners via the limbu.ai campaigns API.
// Fire-and-forget: a failed send is logged, never thrown — the in-app /
// push notification is the primary channel, WhatsApp is the nudge.
//
// .env.local:
//   WHATSAPP_API_URL=https://whatsapp.limbu.ai/api/campaigns/send
//   WHATSAPP_API_KEY=ws_…
//   WHATSAPP_BRAND=Mr. Service Expert
//   WHATSAPP_CAMPAIGN_LEAD=partner_lead_assignment   (params: partner name, lead id)

import db from "@/lib/db";

const API_URL = () => process.env.WHATSAPP_API_URL || "https://whatsapp.limbu.ai/api/campaigns/send";
const API_KEY = () => process.env.WHATSAPP_API_KEY || "";
const BRAND = () => process.env.WHATSAPP_BRAND || "Mr. Service Expert";
const LEAD_CAMPAIGN = () => process.env.WHATSAPP_CAMPAIGN_LEAD || "partner_lead_assignment";

/** Lead id as the partner sees it on the dashboard. */
export const leadRef = (id) => `#${id}`;

/**
 * Send one campaign template. `mobile` is a 10-digit Indian number.
 * Returns { ok, status, body } and never throws.
 */
export async function sendWhatsAppTemplate({ mobile, campaign, params = [], attributes = {} }) {
  const key = API_KEY();
  const digits = String(mobile || "").replace(/\D/g, "").slice(-10);
  if (!key) return { ok: false, status: 0, body: "WHATSAPP_API_KEY not set" };
  if (!/^[6-9]\d{9}$/.test(digits)) return { ok: false, status: 0, body: "bad mobile" };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const res = await fetch(API_URL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: key,
        campaignName: campaign,
        destination: `91${digits}`,
        userName: BRAND(),
        templateParams: params.map((v) => String(v ?? "").slice(0, 120)),
        source: "api",
        media: {},
        buttons: [],
        carouselCards: [],
        location: {},
        attributes,
        paramsFallbackValue: {},
      }),
      cache: "no-store",
      signal: ctrl.signal,
    });
    const body = (await res.text()).slice(0, 300);
    if (!res.ok) console.error("[whatsapp] send failed", res.status, campaign, body);
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    console.error("[whatsapp] send error", campaign, err?.message);
    return { ok: false, status: 0, body: err?.message || "error" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * "A lead is assigned to you" nudge: template params are the partner's
 * name and the lead id shown on their dashboard. Used for the direct
 * assignment and for every partner a lead is opened to.
 */
export async function sendLeadAssignedWhatsApp(partnerIds, leadId) {
  const ids = [...new Set((Array.isArray(partnerIds) ? partnerIds : [partnerIds]).map(Number).filter(Boolean))];
  if (!ids.length || !API_KEY()) return;
  try {
    const [rows] = await db.query("SELECT id, mobile, full_name, business_name FROM partners WHERE id IN (?)", [ids]);
    await Promise.all(
      rows.map((p) =>
        sendWhatsAppTemplate({
          mobile: p.mobile,
          campaign: LEAD_CAMPAIGN(),
          params: [(p.full_name || p.business_name || "Partner").trim().split(/\s+/)[0], leadRef(leadId)],
          attributes: { lead_id: String(leadId) },
        })
      )
    );
  } catch (err) {
    console.error("[whatsapp] lead", leadId, err?.message);
  }
}
