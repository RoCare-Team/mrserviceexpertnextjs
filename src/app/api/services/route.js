import { NextResponse } from "next/server";
import { getServicesForSite } from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST { cid, lead_type } → the all_services.php response, with the admin's
 * title / description / image / order overrides applied (prices untouched).
 * Drop-in replacement for calling the remote feed from the browser.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const lead_type = body?.lead_type ?? null;
    const cid = body?.cid ?? null;

    const data = await getServicesForSite({ cid, lead_type });
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "true", msg: error.message || "Services unavailable" },
      { status: 502 }
    );
  }
}
