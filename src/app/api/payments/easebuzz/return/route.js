import { NextResponse } from "next/server";
import db from "@/lib/db";
import { withTransaction } from "@/lib/partners/application";
import { applyTxn } from "@/lib/partners/wallet";
import { verifyResponseHash, retrieveTransaction } from "@/lib/partners/easebuzz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const siteOrigin = (req) => process.env.SITE_URL?.replace(/\/$/, "") || new URL(req.url).origin;
const back = (req, result) => NextResponse.redirect(`${siteOrigin(req)}/partner/wallet?payment=${result}`, 303);

/**
 * Easebuzz surl / furl. Coins are credited only when the posted hash is
 * valid AND the Retrieve API independently confirms success for the same
 * amount. Crediting is idempotent (payment row lock + unique ledger key).
 */
export async function POST(req) {
  let p;
  try {
    p = Object.fromEntries((await req.formData()).entries());
  } catch {
    return back(req, "failed");
  }
  const txnid = String(p.txnid || "");
  const [[payment]] = await db.query("SELECT * FROM partner_payments WHERE txnid = ?", [txnid]);
  if (!payment) return back(req, "failed");

  try {
    if (!verifyResponseHash(p, payment.mode)) {
      console.error("[easebuzz] bad hash for", txnid);
      return back(req, "failed");
    }
    const postedOk = String(p.status) === "success" && Number(p.amount) === Number(payment.amount);
    const confirmed = postedOk ? await retrieveTransaction(txnid, payment.mode) : null;
    const success = !!confirmed && confirmed.status === "success" && Number(confirmed.amount) === Number(payment.amount);

    await withTransaction(async (conn) => {
      const [[row]] = await conn.query("SELECT * FROM partner_payments WHERE id = ? FOR UPDATE", [payment.id]);
      if (row.status !== "initiated") return; // already processed
      if (success) {
        await conn.query(
          "UPDATE partner_payments SET status = 'success', easebuzz_id = ?, gateway_msg = ? WHERE id = ?",
          [String(p.easepayid || confirmed.easepayid).slice(0, 60), "success", row.id]
        );
        await applyTxn(conn, {
          partnerId: row.partner_id,
          type: "recharge",
          amount: Number(row.amount),
          paymentId: row.id,
          note: `Recharge via Easebuzz (${txnid})`,
          actorType: "system",
        });
      } else {
        await conn.query(
          "UPDATE partner_payments SET status = 'failed', easebuzz_id = ?, gateway_msg = ? WHERE id = ?",
          [String(p.easepayid || "").slice(0, 60) || null, String(p.error_Message || p.status || "failed").slice(0, 255), row.id]
        );
      }
    });
    return back(req, success ? "success" : "failed");
  } catch (err) {
    console.error("[easebuzz] return error:", err?.message);
    return back(req, "pending");
  }
}
