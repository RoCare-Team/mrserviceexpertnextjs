import { NextResponse } from "next/server";
import db from "@/lib/db";
import { verifyResponseHash, retrieveTransaction } from "@/lib/partners/easebuzz";
import { settlePayment } from "@/lib/partners/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const siteOrigin = (req) => process.env.SITE_URL?.replace(/\/$/, "") || new URL(req.url).origin;
const back = (req, result) => NextResponse.redirect(`${siteOrigin(req)}/partner/dashboard?tab=wallet&payment=${result}`, 303);

/**
 * Easebuzz surl / furl. Coins are credited only when the posted hash is valid
 * AND the Retrieve API independently confirms success for the same amount.
 * Failures are stored with the gateway's details too.
 */
export async function POST(req) {
  let p;
  try {
    p = Object.fromEntries((await req.formData()).entries());
  } catch {
    return back(req, "failed");
  }
  const [[payment]] = await db.query("SELECT * FROM partner_payments WHERE txnid = ?", [String(p.txnid || "")]);
  if (!payment) return back(req, "failed");

  try {
    if (!verifyResponseHash(p, payment.mode)) {
      // Possibly forged — don't trust the posted status; reconciliation will re-check.
      console.error("[easebuzz] bad hash for", payment.txnid);
      return back(req, "pending");
    }
    const postedOk = String(p.status) === "success" && Number(p.amount) === Number(payment.amount);
    if (postedOk) {
      const confirmed = await retrieveTransaction(payment.txnid, payment.mode);
      if (confirmed?.status === "success" && Number(confirmed.amount) === Number(payment.amount)) {
        await settlePayment(payment.id, "success", { ...p, ...confirmed.raw });
        return back(req, "success");
      }
      return back(req, "pending"); // gateway says success but not confirmed yet
    }
    await settlePayment(payment.id, "failed", p);
    return back(req, "failed");
  } catch (err) {
    console.error("[easebuzz] return error:", err?.message);
    return back(req, "pending");
  }
}
