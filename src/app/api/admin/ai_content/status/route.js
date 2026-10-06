import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  getAiColumns,
  versionColumns,
  normalizeUrl,
  MAX_BULK_URLS,
} from "@/lib/aiContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST { urls: [...] } → { counts: { [input]: versionsAlreadyWritten } }
 *
 * Lets the generator screen mark (or drop) URLs that already have AI copy
 * before a bulk run. Only CHAR_LENGTHs are read, never the content itself.
 */
export async function POST(request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Not authenticated." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const list = (Array.isArray(body?.urls) ? body.urls : []).slice(0, MAX_BULK_URLS);

    const slugOf = new Map(); // input -> slug
    for (const u of list) {
      const parsed = normalizeUrl(u);
      if (parsed) slugOf.set(String(u), parsed.slug);
    }
    const slugs = [...new Set(slugOf.values())];

    const bySlug = new Map();
    if (slugs.length) {
      const vCols = versionColumns(await getAiColumns());
      const lenSel = vCols
        .map((c) => `CHAR_LENGTH(COALESCE(\`${c}\`, '')) AS len_${c}`)
        .join(", ");
      const [rows] = await db.query(
        `SELECT slug${lenSel ? `, ${lenSel}` : ""} FROM ai_content WHERE slug IN (?)`,
        [slugs]
      );
      for (const r of rows) {
        bySlug.set(r.slug, vCols.filter((c) => Number(r[`len_${c}`]) > 0).length);
      }
    }

    const counts = {};
    for (const [input, slug] of slugOf) counts[input] = bySlug.get(slug) ?? 0;

    return NextResponse.json({ success: true, counts });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
