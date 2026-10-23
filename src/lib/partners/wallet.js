// Coin wallet (1 coin = ₹1). Every change goes through applyTxn inside a
// transaction with the wallet row locked, and the ledger's unique keys make
// each recharge / lead debit / refund happen at most once.

import db from "@/lib/db";
import { HttpError } from "@/lib/partners/http";

// Override with PARTNER_MIN_RECHARGE (e.g. 1 for a live ₹1 test); default ₹500.
const envMin = Number(process.env.PARTNER_MIN_RECHARGE);
export const MIN_RECHARGE = Number.isInteger(envMin) && envMin >= 1 ? envMin : 500;
export const MAX_RECHARGE = 100000;

const round2 = (n) => Math.round(Number(n) * 100) / 100;

async function lockWallet(conn, partnerId) {
  await conn.query("INSERT IGNORE INTO partner_wallets (partner_id, balance) VALUES (?, 0)", [partnerId]);
  const [[w]] = await conn.query("SELECT balance FROM partner_wallets WHERE partner_id = ? FOR UPDATE", [partnerId]);
  return Number(w.balance);
}

/**
 * Apply a signed amount inside an open transaction. Throws 402 when a debit
 * would make the balance negative; returns the new balance.
 */
export async function applyTxn(conn, { partnerId, type, amount, leadId = null, paymentId = null, note = null, actorType, actorId = null }) {
  const balance = await lockWallet(conn, partnerId);
  const next = round2(balance + Number(amount));
  if (next < 0) {
    throw new HttpError(402, "insufficient_coins", `Not enough coins. You need ${round2(-amount)} coins but have ${balance}. Please recharge your wallet.`);
  }
  await conn.query("UPDATE partner_wallets SET balance = ? WHERE partner_id = ?", [next, partnerId]);
  await conn.query(
    `INSERT INTO partner_wallet_txns (partner_id, type, amount, balance_after, lead_id, payment_id, note, actor_type, actor_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [partnerId, type, round2(amount), next, leadId, paymentId, note, actorType, actorId]
  );
  return next;
}

export async function getWallet(partnerId, { limit = 50 } = {}) {
  const [[w]] = await db.query("SELECT balance FROM partner_wallets WHERE partner_id = ?", [partnerId]);
  const [txns] = await db.query(
    `SELECT id, type, amount, balance_after, lead_id, note, created_at
       FROM partner_wallet_txns WHERE partner_id = ? ORDER BY id DESC LIMIT ${Math.min(Number(limit) || 50, 200)}`,
    [partnerId]
  );
  return { balance: w ? Number(w.balance) : 0, txns };
}
