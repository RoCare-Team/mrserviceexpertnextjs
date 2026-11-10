import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { runCareerMaintenance } from "@/lib/careers/stats";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * cPanel cron (hourly is enough):
 *   curl -s "https://www.mrserviceexpert.com/api/cron/careers?key=$CRON_SECRET" > /dev/null
 * Closes expired jobs, deletes resumes that were uploaded but never
 * submitted (> 24 h) and applies the optional data-retention policy.
 * Expiry is ALSO enforced on every request, so a missed run is harmless.
 */
export async function GET(req) {
  const secret = process.env.CRON_SECRET || "";
  const key = new URL(req.url).searchParams.get("key") || "";
  if (secret.length < 16 || key.length !== secret.length || !crypto.timingSafeEqual(Buffer.from(key), Buffer.from(secret))) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
  try {
    const data = await runCareerMaintenance();
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[cron] careers", err);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
