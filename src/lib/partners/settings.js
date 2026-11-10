// Key/value settings for the partner system (table partner_settings).
import db from "@/lib/db";
import { HttpError } from "@/lib/partners/http";

const DEFAULTS = { lead_refund_percent: "100" };

export async function getPartnerSetting(key) {
  try {
    const [[row]] = await db.query("SELECT setting_value FROM partner_settings WHERE setting_key = ?", [key]);
    return row?.setting_value ?? DEFAULTS[key] ?? null;
  } catch (err) {
    if (err?.code === "ER_NO_SUCH_TABLE") return DEFAULTS[key] ?? null;
    throw err;
  }
}

/** Whole number 1–100, or null when the input is not one. */
export function parsePercent(v) {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 100 ? n : null;
}

/** Default % of a lead's coins returned when an admin refunds it. */
export async function getRefundPercent() {
  return parsePercent(await getPartnerSetting("lead_refund_percent")) ?? 100;
}

export async function setRefundPercent(admin, value) {
  const pct = parsePercent(value);
  if (pct === null) throw new HttpError(422, "validation_error", "Refund % must be a whole number from 1 to 100.");
  await db.query(
    `INSERT INTO partner_settings (setting_key, setting_value, updated_by) VALUES ('lead_refund_percent', ?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_by = VALUES(updated_by)`,
    [String(pct), admin.id]
  );
  return pct;
}

/** Coins returned for a lead that cost `coinCost`, rounded to 2 decimals. */
export const refundCoins = (coinCost, pct) => Math.round(Number(coinCost) * pct) / 100;
