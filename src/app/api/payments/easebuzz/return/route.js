import { NextResponse } from "next/server";
import db from "@/lib/db";
import { applyGatewayResult, checkWithGateway } from "@/lib/partners/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const siteOrigin = (req) => process.env.SITE_URL?.replace(/\/$/, "") || new URL(req.url).origin;
const back = (req, result) => NextResponse.redirect(`${siteOrigin(req)}/partner/dashboard?tab=wallet&payment=${result}`, 303);

/**
 * Easebuzz surl / furl (browser POST after checkout).
 * 1. Posted fields with a valid Easebuzz hash decide the result at once
 *    (success credits coins, failure is recorded with the reason).
 * 2. If the hash doesn't verify, ask Easebuzz's Retrieve API instead.
 * 3. Anything uncertain stays "pending" and is settled by the cron / webhook.
 */
export async function POST(req) {
  let posted;
  try {
    posted = Object.fromEntries((await req.formData()).entries());
  } catch {
    return back(req, "pending");
  }
  const [[payment]] = await db.query("SELECT * FROM partner_payments WHERE txnid = ?", [String(posted.txnid || "")]);
  if (!payment) return back(req, "failed");
  if (payment.status === "success") return back(req, "success");

  try {
    let r = await applyGatewayResult(payment, posted);
    if (r === "unverified") {
      console.error("[easebuzz] return hash not verified, checking with gateway:", payment.txnid);
      r = await checkWithGateway(payment);
    }
    return back(req, r === "success" ? "success" : r === "failed" ? "failed" : "pending");
  } catch (err) {
    console.error("[easebuzz] return error:", payment.txnid, err?.message);
    return back(req, "pending");
  }
}
