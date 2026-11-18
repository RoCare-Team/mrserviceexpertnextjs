// Background hook: after a partner becomes / stays publicly listed with new
// areas, categories or brands, create the service pages that don't exist yet
// (see src/lib/partnerPages.js). Fire-and-forget like queuePartnerSeo — it
// never blocks or fails the request that triggered it.

import db from "@/lib/db";
import { ensurePartnerPages } from "@/lib/partnerPages";

export function queuePartnerPages(partnerId) {
  setTimeout(async () => {
    let conn;
    try {
      conn = await db.getConnection();
      const r = await ensurePartnerPages(conn, partnerId);
      if (r.created?.length) {
        console.log(`[partner-pages] partner ${partnerId}: created ${r.created.length} page(s)${r.capped ? " (capped)" : ""}`);
      }
    } catch (err) {
      console.error(`[partner-pages] partner ${partnerId}: ${err.message}`);
    } finally {
      if (conn) conn.release();
    }
  }, 0);
}
