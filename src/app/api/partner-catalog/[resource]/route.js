import { NextResponse } from "next/server";
import { handle, fail, toInt, rateLimit, clientIp } from "@/lib/partners/http";
import {
  getPartnerCategories,
  getServiceTypes,
  getBrands,
  getStates,
  searchCities,
  getLocalities,
} from "@/lib/partners/catalog";
import { idList as parseIds } from "@/lib/partners/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public, non-personal catalogue data → short shared cache.
const cached = (data) =>
  NextResponse.json(
    { success: true, data },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600" } }
  );

const idsFrom = (sp) => parseIds(String(sp.get("categoryIds") || sp.get("categoryId") || "").split(",").filter(Boolean), 20);

/**
 * GET /api/partner-catalog/categories
 * GET /api/partner-catalog/services?categoryIds=1,2
 * GET /api/partner-catalog/brands?categoryIds=1,2
 * GET /api/partner-catalog/states
 * GET /api/partner-catalog/cities?q=gur&stateId=13
 * GET /api/partner-catalog/localities?cityId=316
 */
export const GET = handle(async (req, ctx) => {
  const { resource } = await ctx.params;
  const sp = new URL(req.url).searchParams;

  switch (resource) {
    case "categories":
      return cached(await getPartnerCategories());
    case "services":
    case "brands": {
      const ids = idsFrom(sp);
      if (!ids?.length) return fail(422, "validation_error", "categoryIds is required.");
      return cached(resource === "services" ? await getServiceTypes(ids) : await getBrands(ids));
    }
    case "states":
      return cached(await getStates());
    case "cities": {
      rateLimit(`city-search:${clientIp(req)}`, 120, 60_000);
      const q = String(sp.get("q") || "").trim().slice(0, 60);
      const stateId = sp.get("stateId") ? toInt(sp.get("stateId")) : null;
      return cached(await searchCities({ q, stateId, limit: 30 }));
    }
    case "localities": {
      const cityId = toInt(sp.get("cityId"));
      if (!cityId) return fail(422, "validation_error", "cityId is required.");
      return cached(await getLocalities(cityId));
    }
    default:
      return fail(404, "not_found", "Unknown catalogue resource.");
  }
});
