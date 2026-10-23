import db from "@/lib/db";
import { ok, handle } from "@/lib/partners/http";
import { getCustomer } from "@/lib/partners/customerAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Signed-in customer + addresses they used in earlier partner bookings. */
export const GET = handle(async (req) => {
  const c = await getCustomer(req);
  if (!c) return ok({ customer: null, addresses: [] });
  const [rows] = await db.query(
    `SELECT house_no, area, landmark, address_city AS city, address_state AS state, pincode, MAX(id) AS last_id
       FROM partner_leads WHERE customer_id = ?
      GROUP BY house_no, area, landmark, address_city, address_state, pincode
      ORDER BY last_id DESC LIMIT 5`,
    [c.id]
  );
  return ok({
    customer: { name: c.name, mobile: c.mobile },
    addresses: rows.map((r) => ({ id: `lead-${r.last_id}`, house_no: r.house_no, area: r.area, landmark: r.landmark, city: r.city, state: r.state, pincode: r.pincode })),
  });
});
