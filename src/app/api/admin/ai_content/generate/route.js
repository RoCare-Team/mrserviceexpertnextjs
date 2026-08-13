import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  ensureAiContentTable,
  generateForUrl,
  normalizeUrl,
  resolveSlugContext,
  getAiColumns,
  getAiRowBySlug,
  highestVersion,
  MAX_URLS_PER_REQUEST,
} from "@/lib/aiContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Bulk runs are chunked by the client, but a chunk still takes a while.
export const maxDuration = 300;

// How many OpenAI calls run at once inside ONE request. Small on purpose:
// the DB user only allows 30 connections and the API key is shared.
const CONCURRENCY = 3;

async function requireAdmin(request) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Not authenticated." },
      { status: 401 }
    );
  }
  return null;
}

/** Run `worker` over `items` with at most `limit` in flight, preserving order. */
async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
}

/* ── PREVIEW: what does this URL resolve to? (no OpenAI call, no cost) ── */
export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const raw = (searchParams.get("url") || "").trim();
    const parsed = normalizeUrl(raw);
    if (!parsed) {
      return NextResponse.json({ success: false, message: "Invalid URL" }, { status: 400 });
    }

    const ctx = await resolveSlugContext(parsed.slug);
    if (!ctx.ok) {
      return NextResponse.json({ success: true, ...parsed, resolved: false, reason: ctx.reason });
    }

    const cols = await getAiColumns();
    const row = await getAiRowBySlug(parsed.slug);

    return NextResponse.json({
      success: true,
      ...parsed,
      resolved: true,
      pageType: ctx.type,
      cityName: ctx.cityName || null,
      categoryName: ctx.categoryName || null,
      brandName: ctx.brandName || null,
      metaTitle: ctx.metaTitle || null,
      metaDescription: ctx.metaDescription || null,
      metaKeywords: ctx.metaKeywords || null,
      existingVersions: highestVersion(row, cols),
      nextVersion: highestVersion(row, cols) + 1,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/* ── GENERATE one chunk of URLs ──────────────────────────────────────── */
export async function POST(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, message: "OPENAI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const body = await request.json();
    const list = Array.isArray(body?.urls) ? body.urls : body?.url ? [body.url] : [];

    const urls = [];
    const seen = new Set();
    for (const u of list) {
      const s = String(u ?? "").trim();
      if (!s) continue;
      // Dedupe by slug so the same page can't take two slots in one chunk.
      const parsed = normalizeUrl(s);
      const key = parsed ? parsed.slug : s.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      urls.push(s);
    }

    if (!urls.length) {
      return NextResponse.json(
        { success: false, message: "No URLs supplied" },
        { status: 400 }
      );
    }
    if (urls.length > MAX_URLS_PER_REQUEST) {
      return NextResponse.json(
        {
          success: false,
          message: `Send at most ${MAX_URLS_PER_REQUEST} URLs per request — the admin screen chunks a bulk list automatically.`,
        },
        { status: 400 }
      );
    }

    await ensureAiContentTable();
    const results = await mapLimit(urls, CONCURRENCY, (u) => generateForUrl(u));

    return NextResponse.json({
      success: true,
      results,
      generated: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
