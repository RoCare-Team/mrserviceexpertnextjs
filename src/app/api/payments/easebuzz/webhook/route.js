import { NextResponse } from "next/server";
import db from "@/lib/db";
import { applyGatewayResult, checkWithGateway } from "@/lib/partners/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Easebuzz server-to-server transaction webhook. Configure in the Easebuzz
 * dashboard → Webhook URL: https://www.mrserviceexpert.com/api/payments/easebuzz/webhook
 * Covers partners who close the browser before returning to our site.
 * Same rules as the return URL: only hash-verified data (or the Retrieve
 * API) can change a payment; it's idempotent, so repeats are harmless.
 */
export async function POST(req) {
  let fields;
  try {
    const type = req.headers.get("content-type") || "";
    fields = type.includes("application/json") ? await req.json() : Object.fromEntries((await req.formData()).entries());
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const [[payment]] = await db.query("SELECT * FROM partner_payments WHERE txnid = ?", [String(fields?.txnid || "")]);
  // Unknown txnid (e.g. another integration on the same merchant) — acknowledge.
  if (!payment) return NextResponse.json({ ok: true });
  try {
    let r = await applyGatewayResult(payment, fields);
    if (r === "unverified") r = await checkWithGateway(payment);
    return NextResponse.json({ ok: true, result: r });
  } catch (err) {
    console.error("[easebuzz] webhook error:", payment.txnid, err?.message);
    return NextResponse.json({ ok: false }, { status: 500 }); // gateway will retry
  }
}
