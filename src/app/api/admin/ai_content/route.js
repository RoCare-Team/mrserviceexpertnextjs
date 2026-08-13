import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/session";
import {
  ensureAiContentTable,
  getAiColumns,
  versionColumns,
  rowVersions,
  wordCount,
} from "@/lib/aiContent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SORTABLE = ["id", "url", "slug", "date", "updated_at"];

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

/* ── LIST + DETAIL ───────────────────────────────────────────────────── */
export async function GET(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    await ensureAiContentTable();
    const cols = await getAiColumns();
    const vCols = versionColumns(cols);

    // ---- one full row (edit modal) ----
    const detailId = (searchParams.get("id") || "").trim();
    if (detailId) {
      const [rows] = await db.query(`SELECT * FROM ai_content WHERE id = ? LIMIT 1`, [
        detailId,
      ]);
      if (!rows.length) {
        return NextResponse.json(
          { success: false, message: "Not found" },
          { status: 404 }
        );
      }
      const row = rows[0];
      return NextResponse.json({
        success: true,
        row: {
          id: row.id,
          url: row.url,
          slug: row.slug,
          date: row.date,
          updated_at: row.updated_at,
        },
        versions: rowVersions(row, cols),
        // Next slot a "Generate again" would fill.
        nextVersion: rowVersions(row, cols).reduce((m, v) => Math.max(m, v.version), 0) + 1,
      });
    }

    // ---- paginated list ----
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "25", 10))
    );
    const offset = (page - 1) * limit;
    const search = (searchParams.get("search") || "").trim();

    let sortBy = searchParams.get("sortBy") || "updated_at";
    if (!SORTABLE.includes(sortBy)) sortBy = "updated_at";
    let sortDir = (searchParams.get("sortDir") || "DESC").toUpperCase();
    if (!["ASC", "DESC"].includes(sortDir)) sortDir = "DESC";

    const where = search ? `WHERE url LIKE ? OR slug LIKE ?` : "";
    const params = search ? [`%${search}%`, `%${search}%`] : [];

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM ai_content ${where}`,
      params
    );

    // Never SELECT the LONGTEXT bodies for a list — only their lengths, so we
    // can show how many versions a URL has without shipping megabytes.
    const lenSel = vCols
      .map((c) => `CHAR_LENGTH(COALESCE(\`${c}\`, '')) AS len_${c}`)
      .join(", ");

    const [rows] = await db.query(
      `SELECT id, url, slug, \`date\`, updated_at${lenSel ? `, ${lenSel}` : ""}
         FROM ai_content ${where}
        ORDER BY \`${sortBy}\` ${sortDir}
        LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    const data = rows.map((r) => {
      const filled = vCols
        .filter((c) => Number(r[`len_${c}`]) > 0)
        .map((c) => Number(c.slice(7)))
        .sort((a, b) => a - b);
      const out = {
        id: r.id,
        url: r.url,
        slug: r.slug,
        date: r.date,
        updated_at: r.updated_at,
        versions: filled,
        versionCount: filled.length,
        latestVersion: filled.length ? filled[filled.length - 1] : null,
      };
      return out;
    });

    return NextResponse.json({
      success: true,
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      versionColumns: vCols,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/* ── EDIT ONE VERSION ────────────────────────────────────────────────── */
export async function PUT(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const { id, version, html } = await request.json();
    if (!id || !version) {
      return NextResponse.json(
        { success: false, message: "Missing id or version" },
        { status: 400 }
      );
    }

    const cols = await getAiColumns();
    const column = `content${parseInt(version, 10)}`;
    if (!/^content\d+$/.test(column) || !cols.has(column)) {
      return NextResponse.json(
        { success: false, message: `Unknown version ${version}` },
        { status: 400 }
      );
    }

    const [res] = await db.query(
      `UPDATE ai_content SET \`${column}\` = ? WHERE id = ?`,
      [html ?? "", id]
    );
    if (!res.affectedRows) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Version ${version} saved`,
      words: wordCount(html || ""),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

/* ── DELETE A VERSION, OR THE WHOLE ROW ──────────────────────────────── */
export async function DELETE(request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const id = (searchParams.get("id") || "").trim();
    const version = (searchParams.get("version") || "").trim();
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing id" },
        { status: 400 }
      );
    }

    if (version) {
      const cols = await getAiColumns();
      const column = `content${parseInt(version, 10)}`;
      if (!/^content\d+$/.test(column) || !cols.has(column)) {
        return NextResponse.json(
          { success: false, message: `Unknown version ${version}` },
          { status: 400 }
        );
      }
      await db.query(`UPDATE ai_content SET \`${column}\` = NULL WHERE id = ?`, [id]);
      return NextResponse.json({ success: true, message: `Version ${version} deleted` });
    }

    await db.query(`DELETE FROM ai_content WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, message: "Record deleted" });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
