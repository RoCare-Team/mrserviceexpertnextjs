import { ok, handle, requireAdmin, toInt } from "@/lib/partners/http";
import { listAllPayments } from "@/lib/partners/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET ?status=initiated|success|failed&search=&page= — all wallet payments with gateway details. */
export const GET = handle(async (req) => {
  await requireAdmin(req);
  const sp = new URL(req.url).searchParams;
  return ok(
    await listAllPayments({
      status: sp.get("status"),
      search: sp.get("search") || "",
      page: toInt(sp.get("page")) || 1,
      limit: Math.min(toInt(sp.get("limit")) || 25, 100),
    })
  );
});
