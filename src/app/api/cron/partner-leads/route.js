import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { processDueLeads } from "@/lib/partners/leads";
import { reconcileStalePayments } from "@/lib/partners/payments";
import { sendBadgeReminders, applyBadgeLimits } from "@/lib/partners/badge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * cPanel cron (every 2–5 min):
 *   curl -s "https://www.mrserviceexpert.com/api/cron/partner-leads?key=$CRON_SECRET" > /dev/null
 * Moves leads along (15 min direct → 15 min open to the city → CRM) and
 * re-checks pending wallet / badge payments with Easebuzz, and reminds
 * partners whose Featured badge ends within 3 days.
 */
export async function GET(req) {
  const secret = process.env.CRON_SECRET || "";
  const key = new URL(req.url).searchParams.get("key") || "";
  if (secret.length < 16 || key.length !== secret.length || !crypto.timingSafeEqual(Buffer.from(key), Buffer.from(secret))) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
  try {
    const r = await processDueLeads({ force: true });
    await reconcileStalePayments({ limit: 20 });
    await sendBadgeReminders().catch((err) => console.error("[cron] badge reminders", err?.message));
    // Badge ended / never bought → hide cities, categories and brands above the free plan.
    await applyBadgeLimits().catch((err) => console.error("[cron] badge limits", err?.message));
    return NextResponse.json({ success: true, data: r });
  } catch (err) {
    console.error("[cron] partner-leads", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
