import { NextResponse } from "next/server";
import { getStoresByCityUrl, getAllStores } from "@/lib/storeLocatorData";

export const runtime = "nodejs";
export const revalidate = 3600;

// GET /api/stores            -> all published stores
// GET /api/stores?city=delhi -> published stores on the "delhi" city page
export async function GET(request) {
  try {
    const city = request.nextUrl.searchParams.get("city");
    const data = city ? await getStoresByCityUrl(city) : await getAllStores();

    return NextResponse.json(
      { success: true, city: city || null, total: data.length, data },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message, data: [] },
      { status: 500 }
    );
  }
}
