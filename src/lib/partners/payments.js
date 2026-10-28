// Wallet payment records. Every attempt is kept with whatever the gateway
// reported (success or failure); coins are credited exactly once.

import db from "@/lib/db";
import { withTransaction } from "@/lib/partners/application";
import { applyTxn } from "@/lib/partners/wallet";
import { retrieveTransaction, verifyResponseHash } from "@/lib/partners/easebuzz";
import { notifyPartner } from "@/lib/partners/notify";

const s = (v, n) => (v === undefined || v === null || v === "" ? null : String(v).slice(0, n));
const FAIL_STATES = new Set(["failure", "failed", "usercancelled", "dropped", "bounced", "cancelled"]);

/** Gateway fields worth keeping (hash / merchant key never stored). */
function gatewayDetails(g = {}) {
  const raw = { ...g };
  delete raw.hash;
  delete raw.key;
  return {
    easebuzz_id: s(g.easepayid, 60),
    payment_mode: s(g.mode || g.card_type, 40),
    bank_ref_num: s(g.bank_ref_num || g.bank_ref_no, 80),
    card_or_vpa: s(g.upi_va || g.cardnum || g.card_num, 80),
    bank_name: s(g.issuing_bank || g.bank_name || g.bankcode, 80),
    error_message: s(g.error_Message || g.error_message || g.error, 255),
    gateway_status: s(g.status, 40),
    raw_response: JSON.stringify(raw).slice(0, 6000),
  };
}

/**
 * Settle one payment. outcome: "success" | "failed".
 * - initiated → success | failed
 * - failed → success   (a gateway-confirmed success always wins, e.g. a
 *                        late webhook after the user saw a failure)
 * - success is final. Coins are credited exactly once (row lock + unique
 *   ledger key on payment_id).
 */
export async function settlePayment(paymentId, outcome, gateway = {}) {
  const d = gatewayDetails(gateway);
  const result = await withTransaction(async (conn) => {
    const [[row]] = await conn.query("SELECT * FROM partner_payments WHERE id = ? FOR UPDATE", [paymentId]);
    if (!row || row.status === "success") return null;
    if (row.status === "failed" && outcome !== "success") return null;
    await conn.query(
      `UPDATE partner_payments SET status = ?, easebuzz_id = COALESCE(?, easebuzz_id), payment_mode = COALESCE(?, payment_mode),
              bank_ref_num = COALESCE(?, bank_ref_num), card_or_vpa = COALESCE(?, card_or_vpa), bank_name = COALESCE(?, bank_name),
              error_message = ?, gateway_status = COALESCE(?, gateway_status), gateway_msg = ?, raw_response = COALESCE(?, raw_response),
              completed_at = NOW()
        WHERE id = ?`,
      [
        outcome, d.easebuzz_id, d.payment_mode, d.bank_ref_num, d.card_or_vpa, d.bank_name,
        outcome === "failed" ? d.error_message || d.gateway_status || "Payment failed" : null,
        d.gateway_status, outcome, d.raw_response, row.id,
      ]
    );
    if (outcome === "success") {
      await applyTxn(conn, {
        partnerId: row.partner_id,
        type: "recharge",
        amount: Number(row.amount),
        paymentId: row.id,
        note: `Recharge via Easebuzz (${row.txnid})`,
        actorType: "system",
      });
    }
    return row;
  });
  if (result) {
    await notifyPartner(result.partner_id, {
      type: "payment",
      title: outcome === "success" ? `₹${Number(result.amount)} added to your wallet` : `Payment of ₹${Number(result.amount)} failed`,
      body: outcome === "success" ? `${Number(result.amount)} coins credited.` : d.error_message || "No coins were added. You can try again.",
      link: "/partner/dashboard?tab=wallet",
    });
  }
  return result;
}

/**
 * Decide from gateway fields that carry Easebuzz's hash (return URL POST,
 * webhook POST, or a Retrieve API entry). The hash is verified with our salt,
 * so the status can't be forged by the browser.
 * Returns "success" | "failed" | "pending" | "unverified".
 */
export async function applyGatewayResult(payment, fields) {
  if (!verifyResponseHash(fields, payment.mode)) return "unverified";
  if (String(fields.txnid) !== payment.txnid) return "unverified";
  const status = String(fields.status || "").toLowerCase();
  if (status === "success") {
    if (Number(fields.amount) !== Number(payment.amount)) {
      console.error("[payments] amount mismatch", payment.txnid, fields.amount, payment.amount);
      return "pending"; // never credit a different amount; admin can investigate
    }
    await settlePayment(payment.id, "success", fields);
    return "success";
  }
  if (FAIL_STATES.has(status)) {
    await settlePayment(payment.id, "failed", fields);
    return "failed";
  }
  return "pending";
}

/** Ask Easebuzz directly. Network / API errors leave the payment pending. */
export async function checkWithGateway(payment) {
  let t;
  try {
    t = await retrieveTransaction(payment.txnid, payment.mode);
  } catch (err) {
    console.error("[payments] retrieve failed", payment.txnid, err?.message);
    return "pending";
  }
  if (!t.found) return "not_found";
  return applyGatewayResult(payment, t.raw);
}

const ABANDON_AFTER_MIN = 120;

/**
 * Re-check payments still pending (tab closed, return URL missed, gateway
 * slow). Runs from the cron (every few minutes) and when wallets are opened.
 * Only marks "failed (abandoned)" when Easebuzz explicitly says the
 * transaction doesn't exist and 2 hours have passed — never on an error.
 */
export async function reconcileStalePayments({ partnerId = null, limit = 10 } = {}) {
  const params = [];
  let where = "status = 'initiated' AND created_at < NOW() - INTERVAL 2 MINUTE";
  if (partnerId) {
    where += " AND partner_id = ?";
    params.push(partnerId);
  }
  const [rows] = await db.query(
    `SELECT *, TIMESTAMPDIFF(MINUTE, created_at, NOW()) AS age FROM partner_payments WHERE ${where} ORDER BY id LIMIT ${Number(limit) || 10}`,
    params
  );
  for (const p of rows) {
    try {
      const r = await checkWithGateway(p);
      if (r === "not_found" && p.age >= ABANDON_AFTER_MIN) {
        await settlePayment(p.id, "failed", { error_Message: "Payment not completed (abandoned)" });
      }
    } catch (err) {
      console.error("[payments] reconcile", p.txnid, err?.message);
    }
  }
}

const PUBLIC_COLS = `id, txnid, amount, email, mode, status, easebuzz_id, payment_mode, bank_ref_num, card_or_vpa,
  bank_name, error_message, gateway_status, created_at, completed_at`;

export async function listPartnerPayments(partnerId, { limit = 50 } = {}) {
  await reconcileStalePayments({ partnerId, limit: 5 });
  const [rows] = await db.query(
    `SELECT ${PUBLIC_COLS} FROM partner_payments WHERE partner_id = ? ORDER BY id DESC LIMIT ${Math.min(Number(limit) || 50, 200)}`,
    [partnerId]
  );
  return rows;
}

export async function getPartnerPayment(partnerId, paymentId) {
  const [[row]] = await db.query(`SELECT ${PUBLIC_COLS} FROM partner_payments WHERE id = ? AND partner_id = ?`, [paymentId, partnerId]);
  return row || null;
}

/** Admin: all payments with partner info + filters. */
export async function listAllPayments({ status = null, search = "", page = 1, limit = 25 } = {}) {
  await reconcileStalePayments({ limit: 10 });
  const where = ["1=1"];
  const params = [];
  if (["initiated", "success", "failed"].includes(status)) (where.push("pp.status = ?"), params.push(status));
  const q = String(search || "").trim().slice(0, 60);
  if (q) {
    const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
    where.push("(pp.txnid LIKE ? OR pp.easebuzz_id LIKE ? OR p.business_name LIKE ? OR p.mobile LIKE ?)");
    params.push(like, like, like, like);
  }
  const w = where.join(" AND ");
  const offset = (Math.max(1, page) - 1) * limit;
  const [[[{ total }]], [rows], [[sum]]] = await Promise.all([
    db.query(`SELECT COUNT(*) AS total FROM partner_payments pp JOIN partners p ON p.id = pp.partner_id WHERE ${w}`, params),
    db.query(
      `SELECT pp.*, p.business_name, p.full_name, p.mobile AS partner_mobile
         FROM partner_payments pp JOIN partners p ON p.id = pp.partner_id
        WHERE ${w} ORDER BY pp.id DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    ),
    db.query(
      `SELECT SUM(status = 'success') AS ok_n, SUM(CASE WHEN status = 'success' THEN amount ELSE 0 END) AS ok_amt,
              SUM(status = 'failed') AS fail_n, SUM(status = 'initiated') AS pending_n
         FROM partner_payments`
    ),
  ]);
  return {
    rows,
    total: Number(total),
    totalPages: Math.max(1, Math.ceil(Number(total) / limit)),
    summary: {
      success: Number(sum.ok_n || 0),
      success_amount: Number(sum.ok_amt || 0),
      failed: Number(sum.fail_n || 0),
      pending: Number(sum.pending_n || 0),
    },
  };
}
