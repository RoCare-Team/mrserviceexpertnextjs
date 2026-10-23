import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { processDueLeads } from "@/lib/partners/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * cPanel cron (every 2–5 min):
 *   curl -s "https://www.mrserviceexpert.com/api/cron/partner-leads?key=$CRON_SECRET" > /dev/null
 * Expires leads older than 30 minutes and forwards them to the CRM.
 */
export async function GET(req) {
  const secret = process.env.CRON_SECRET || "";
  const key = new URL(req.url).searchParams.get("key") || "";
  if (secret.length < 16 || key.length !== secret.length || !crypto.timingSafeEqual(Buffer.from(key), Buffer.from(secret))) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
  try {
    const r = await processDueLeads({ force: true });
    return NextResponse.json({ success: true, data: r });
  } catch (err) {
    console.error("[cron] partner-leads", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
