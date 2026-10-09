import { NextResponse } from "next/server";
import { getOverrides } from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const filled = (v) => typeof v === "string" && v.trim() !== "";

/**
 * GET ?ids=1,518,2 → { success, overrides: { [id]: { title?, description?, image? } } }
 *
 * The admin's title / description / image for services shown outside the
 * all_services.php listing (cart, checkout, booking popup), whose data comes
 * from other backend APIs. Only filled fields are returned, so callers keep
 * the backend value for everything else. Prices are never part of this.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const ids = (searchParams.get("ids") || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^\d+$/.test(s))
      .slice(0, 200);

    const overrides = {};
    if (ids.length) {
      const rows = await getOverrides(ids);
      for (const [id, o] of rows) {
        const entry = {};
        if (filled(o.title)) entry.title = o.title.trim();
        if (filled(o.description)) entry.description = o.description;
        if (filled(o.image)) entry.image = o.image.trim();
        if (Object.keys(entry).length) overrides[id] = entry;
      }
    }

    return NextResponse.json({ success: true, overrides });
  } catch (error) {
    // No table yet (nothing customised) is a normal state, not an error.
    if (error?.code === "ER_NO_SUCH_TABLE") {
      return NextResponse.json({ success: true, overrides: {} });
    }
    return NextResponse.json(
      { success: false, overrides: {}, message: error.message },
      { status: 500 }
    );
  }
}
