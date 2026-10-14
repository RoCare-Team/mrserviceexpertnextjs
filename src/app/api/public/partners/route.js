import { NextResponse } from "next/server";
import { handle, fail, toInt, rateLimit, clientIp } from "@/lib/partners/http";
import { getListingPage } from "@/lib/partners/listing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * "Load more" for the partner section on city / locality service pages.
 * GET /api/public/partners?cityId=316&categoryId=1[&brandId=4]&page=2
 */
export const GET = handle(async (req) => {
  rateLimit(`public-partners:${clientIp(req)}`, 120, 60_000);
  const sp = new URL(req.url).searchParams;
  const cityId = toInt(sp.get("cityId"));
  const categoryId = toInt(sp.get("categoryId"));
  const brandId = sp.get("brandId") ? toInt(sp.get("brandId")) : null;
  const page = toInt(sp.get("page")) || 1;
  if (!cityId || !categoryId || page > 200) return fail(422, "validation_error", "Invalid listing parameters.");

  const data = await getListingPage({ cityId, categoryId, brandId, page });
  return NextResponse.json(
    { success: true, data },
    { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } }
  );
});
