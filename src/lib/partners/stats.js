// Numbers for the partner dashboard overview. All times are IST (the DB
// session runs in +05:30, see lib/db.js).

import db from "@/lib/db";

export async function getPartnerStats(partnerId) {
  const [[[l]], [[w]], [[r]], [dist], [[n]], [months]] = await Promise.all([
    db.query(
      `SELECT
         SUM(DATE(created_at) = CURDATE())                                         AS leads_today,
         SUM(status = 'new' AND expires_at > NOW())                                AS pending_now,
         SUM(status IN ('accepted','completed') AND accepted_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS accepted_month,
         SUM(status = 'completed' AND completed_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01'))              AS completed_month,
         SUM(status IN ('rejected','expired') AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01'))    AS missed_month,
         SUM(status IN ('accepted','completed') AND created_at >= NOW() - INTERVAL 30 DAY)              AS taken_30,
         SUM(status IN ('accepted','completed','rejected','expired') AND created_at >= NOW() - INTERVAL 30 DAY) AS decided_30,
         SUM(CASE WHEN status IN ('accepted','completed') AND accepted_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN service_price ELSE 0 END) AS service_value_month,
         SUM(CASE WHEN status = 'completed' AND completed_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01') THEN COALESCE(final_amount, 0) ELSE 0 END) AS earned_month
       FROM partner_leads WHERE partner_id = ?`,
      [partnerId]
    ),
    db.query(
      `SELECT
         (SELECT balance FROM partner_wallets WHERE partner_id = ?) AS balance,
         (SELECT low_balance_alert FROM partners WHERE id = ?) AS low_balance_alert,
         (SELECT -SUM(amount) FROM partner_wallet_txns
           WHERE partner_id = ? AND type IN ('lead_debit','refund') AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS coins_spent_month`,
      [partnerId, partnerId, partnerId]
    ),
    db.query(
      "SELECT COUNT(*) AS n, AVG(rating) AS avg FROM partner_reviews WHERE partner_id = ? AND status = 'published'",
      [partnerId]
    ),
    db.query(
      "SELECT rating, COUNT(*) AS n FROM partner_reviews WHERE partner_id = ? AND status = 'published' GROUP BY rating",
      [partnerId]
    ),
    db.query("SELECT COUNT(*) AS unread FROM partner_notifications WHERE partner_id = ? AND read_at IS NULL", [partnerId]),
    db.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS ym,
              COUNT(*) AS leads,
              SUM(status IN ('accepted','completed')) AS taken,
              SUM(CASE WHEN status IN ('accepted','completed') THEN coin_cost ELSE 0 END) AS coins
         FROM partner_leads
        WHERE partner_id = ? AND created_at >= DATE_FORMAT(CURDATE() - INTERVAL 5 MONTH, '%Y-%m-01')
        GROUP BY ym ORDER BY ym`,
      [partnerId]
    ),
  ]);

  const num = (v) => Number(v || 0);
  const decided = num(l.decided_30);
  return {
    leads_today: num(l.leads_today),
    pending_now: num(l.pending_now),
    accepted_month: num(l.accepted_month),
    completed_month: num(l.completed_month),
    missed_month: num(l.missed_month),
    acceptance_rate: decided ? Math.round((num(l.taken_30) / decided) * 100) : null,
    service_value_month: num(l.service_value_month),
    earned_month: num(l.earned_month),
    balance: num(w.balance),
    low_balance_alert: num(w.low_balance_alert),
    coins_spent_month: Math.max(0, num(w.coins_spent_month)),
    rating: { count: num(r.n), average: r.n ? Math.round(Number(r.avg) * 10) / 10 : null, distribution: Object.fromEntries([5, 4, 3, 2, 1].map((s) => [s, num(dist.find((d) => d.rating === s)?.n)])) },
    unread_notifications: num(n.unread),
    months: months.map((m) => ({ month: m.ym, leads: num(m.leads), taken: num(m.taken), coins: num(m.coins) })),
  };
}
