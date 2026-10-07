import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  LEAD_TYPES,
  ensureServiceOverridesTable,
  fetchRemoteServices,
  getOverrides,
} from "@/lib/services";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

const clean = (v) => {
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" || s === "<p></p>" ? null : s;
};

/* ── LIST: every feed service of one lead_type, with its override ─────── */
export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const leadType = parseInt(searchParams.get("lead_type") || "", 10);
    if (!LEAD_TYPES.some((l) => l.id === leadType)) {
      return NextResponse.json(
        { success: false, message: "Unknown lead_type" },
        { status: 400 }
      );
    }

    const data = await fetchRemoteServices({ lead_type: leadType });
    const feed = data?.error === "false" && Array.isArray(data.service_details)
      ? data.service_details
      : [];

    await ensureServiceOverridesTable();
    const overrides = await getOverrides(feed.map((s) => s.id));

    const rows = feed.map((s) => {
      const o = overrides.get(String(s.id));
      return {
        id: String(s.id),
        price: s.price,
        mrp: s.price_without_discount,
        api: { title: s.service_name, description: s.description, image: s.image },
        override: o
          ? {
              title: o.title,
              description: o.description,
              image: o.image,
              sort_order: o.sort_order,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      title: data?.Title || "",
      rows,
      leadTypes: LEAD_TYPES,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/* ── SAVE one service's override (null fields fall back to the feed) ──── */
export async function PUT(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const serviceId = String(body?.service_id ?? "").trim();
    if (!/^\d+$/.test(serviceId)) {
      return NextResponse.json(
        { success: false, message: "Invalid service id" },
        { status: 400 }
      );
    }

    const title = clean(body.title);
    const description = clean(body.description);
    const image = clean(body.image);
    const sortRaw = body.sort_order;
    const sortOrder =
      sortRaw === null || sortRaw === undefined || String(sortRaw).trim() === ""
        ? null
        : parseInt(sortRaw, 10);
    if (sortOrder !== null && !Number.isFinite(sortOrder)) {
      return NextResponse.json(
        { success: false, message: "Sort order must be a number" },
        { status: 400 }
      );
    }
    if (title && title.length > 255) {
      return NextResponse.json(
        { success: false, message: "Title is too long (max 255)" },
        { status: 400 }
      );
    }

    await ensureServiceOverridesTable();

    // Nothing left to override → drop the row so the feed shows through.
    if (!title && !description && !image && sortOrder === null) {
      await db.query(`DELETE FROM service_overrides WHERE service_id = ?`, [serviceId]);
      return NextResponse.json({ success: true, message: "Reset to API values" });
    }

    const leadType = parseInt(body.lead_type, 10) || null;
    await db.query(
      `INSERT INTO service_overrides
         (service_id, lead_type, title, description, image, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         lead_type = VALUES(lead_type), title = VALUES(title),
         description = VALUES(description), image = VALUES(image),
         sort_order = VALUES(sort_order)`,
      [serviceId, leadType, title, description, image, sortOrder]
    );

    return NextResponse.json({ success: true, message: "Service saved" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/* ── RESET: remove the override entirely ──────────────────────────────── */
export async function DELETE(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const serviceId = (searchParams.get("service_id") || "").trim();
    if (!/^\d+$/.test(serviceId)) {
      return NextResponse.json(
        { success: false, message: "Invalid service id" },
        { status: 400 }
      );
    }
    await ensureServiceOverridesTable();
    await db.query(`DELETE FROM service_overrides WHERE service_id = ?`, [serviceId]);
    return NextResponse.json({ success: true, message: "Reset to API values" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
