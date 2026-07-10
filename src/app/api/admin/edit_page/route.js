import { NextResponse } from "next/server";
import db from "@/lib/db";

// Columns allowed for ORDER BY. Both tables share these names
// (brand_id is NULL for without-brand rows, which sorts fine).
const SORTABLE = [
  "id",
  "page_title",
  "page_url",
  "status",
  "city_id",
  "category_id",
  "brand_id",
  "service_type_id",
  "created_at",
  "updated_at",
];

// 5 FAQ pairs (present in BOTH tables).
const FAQ_FIELDS = [];
for (let i = 1; i <= 5; i++) FAQ_FIELDS.push(`faqquestion${i}`, `faqanswer${i}`);

// The two page sources. _source in the payload / query picks one.
const TABLES = {
  brand: "page_master_tb",
  nobrand: "master_tb_withoutbrand",
};

// Fields shared by both tables that the PUT may write.
const COMMON_UPDATE_FIELDS = [
  "page_title",
  "page_url",
  "page_content",
  "status",
  "city_id",
  "category_id",
  "service_type_id",
  "meta_title",
  "meta_keywords",
  "meta_description",
  ...FAQ_FIELDS,
];

// Table-specific extras. These are intersected with each table's real
// columns, so a column that a table lacks is simply skipped:
//   brand_id / youtube_url -> only page_master_tb
//   robots                 -> only master_tb_withoutbrand
const EXTRA_UPDATE_FIELDS = ["brand_id", "youtube_url", "robots"];

const CANDIDATE_UPDATE_FIELDS = [...COMMON_UPDATE_FIELDS, ...EXTRA_UPDATE_FIELDS];

// Cache real columns per table so we never try to write a column a table
// doesn't have and never 500 if an optional migration wasn't run.
const _colCache = new Map();
async function getColumns(connection, table) {
  if (_colCache.has(table)) return _colCache.get(table);
  const [cols] = await connection.query(`SHOW COLUMNS FROM \`${table}\``);
  const set = new Set(cols.map((c) => c.Field));
  _colCache.set(table, set);
  return set;
}

export async function GET(request) {
  let connection;
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    connection = await db.getConnection();

    // ---- lookup endpoints for the relation pickers ----
    if (type === "cities") {
      const q = (searchParams.get("q") || "").trim();
      const [rows] = await connection.query(
        `SELECT id, city_name, city_url FROM city_tb
         WHERE city_name LIKE ? OR city_url LIKE ?
         ORDER BY city_name ASC
         LIMIT 20`,
        [`%${q}%`, `%${q}%`]
      );
      return NextResponse.json({ success: true, cities: rows });
    }
    if (type === "categories") {
      const [rows] = await connection.query(
        `SELECT id, category_name FROM category_tb WHERE status='1' ORDER BY category_name ASC`
      );
      return NextResponse.json({ success: true, categories: rows });
    }
    if (type === "brands") {
      const [rows] = await connection.query(
        `SELECT id, brand_name FROM brand_tb WHERE status='1' ORDER BY brand_name ASC`
      );
      return NextResponse.json({ success: true, brands: rows });
    }
    if (type === "service_types") {
      try {
        const [rows] = await connection.query(
          `SELECT * FROM service_type_tb ORDER BY id ASC`
        );
        return NextResponse.json({ success: true, service_types: rows });
      } catch {
        return NextResponse.json({ success: true, service_types: [] });
      }
    }

    // ---- full single-row detail (used when opening the edit modal) ----
    // Returns EVERY column (page_content, SEO, FAQs, …) for one row so the
    // modal edits the real data instead of the trimmed list row. This is the
    // fix for empty fields / accidental content wipes on save.
    if (type === "detail") {
      const id = (searchParams.get("id") || "").trim();
      let src = (searchParams.get("source") || "brand").trim();
      if (!TABLES[src]) src = "brand";
      if (!id) {
        return NextResponse.json(
          { success: false, message: "Missing id" },
          { status: 400 }
        );
      }

      if (src === "brand") {
        const [rows] = await connection.query(
          `SELECT p.*, c.city_name, cat.category_name, b.brand_name
           FROM page_master_tb p
           LEFT JOIN city_tb c       ON p.city_id = c.id
           LEFT JOIN category_tb cat ON p.category_id = cat.id
           LEFT JOIN brand_tb b      ON p.brand_id = b.id
           WHERE p.id = ? LIMIT 1`,
          [id]
        );
        if (!rows.length) {
          return NextResponse.json(
            { success: false, message: "Not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          page: { ...rows[0], _source: "brand" },
        });
      }

      // without-brand
      const [rows] = await connection.query(
        `SELECT w.*, c.city_name, cat.category_name
         FROM master_tb_withoutbrand w
         LEFT JOIN city_tb c       ON w.city_id = c.id
         LEFT JOIN category_tb cat ON w.category_id = cat.id
         WHERE w.id = ? LIMIT 1`,
        [id]
      );
      if (!rows.length) {
        return NextResponse.json(
          { success: false, message: "Not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        page: { ...rows[0], _source: "nobrand", brand_name: null },
      });
    }

    // ---- paginated list (UNION of both page tables) ----
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") || "25", 10))
    );
    const offset = (page - 1) * limit;

    const search = (searchParams.get("search") || "").trim();
    const status = (searchParams.get("status") || "").trim();
    const cityId = (searchParams.get("city_id") || "").trim();
    const categoryId = (searchParams.get("category_id") || "").trim();
    const brandId = (searchParams.get("brand_id") || "").trim();
    const serviceTypeId = (searchParams.get("service_type_id") || "").trim();

    // "" = both, "brand" = only page_master_tb, "nobrand" = only without-brand
    let source = (searchParams.get("source") || "").trim();
    if (!["", "brand", "nobrand"].includes(source)) source = "";

    let sortBy = searchParams.get("sortBy") || "id";
    if (!SORTABLE.includes(sortBy)) sortBy = "id";
    let sortDir = (searchParams.get("sortDir") || "DESC").toUpperCase();
    if (!["ASC", "DESC"].includes(sortDir)) sortDir = "DESC";

    // Build WHERE for one half. `alias` qualifies the base table so the
    // joined lookup tables never make a column ambiguous.
    const halfWhere = (alias, isBrand) => {
      const w = [];
      const p = [];
      if (search) {
        w.push(`(${alias}.page_title LIKE ? OR ${alias}.page_url LIKE ?)`);
        p.push(`%${search}%`, `%${search}%`);
      }
      if (status === "0" || status === "1") {
        w.push(`${alias}.status = ?`);
        p.push(status);
      }
      if (cityId) {
        w.push(`${alias}.city_id = ?`);
        p.push(cityId);
      }
      if (categoryId) {
        w.push(`${alias}.category_id = ?`);
        p.push(categoryId);
      }
      if (serviceTypeId) {
        w.push(`${alias}.service_type_id = ?`);
        p.push(serviceTypeId);
      }
      if (isBrand && brandId) {
        w.push(`${alias}.brand_id = ?`);
        p.push(brandId);
      }
      return { sql: w.length ? `WHERE ${w.join(" AND ")}` : "", params: p };
    };

    // A brand filter excludes the without-brand rows entirely.
    const includeBrand = source !== "nobrand";
    const includeNoBrand = source !== "brand" && !brandId;

    // ---- total (two cheap counts summed) ----
    let total = 0;
    if (includeBrand) {
      const bw = halfWhere("p", true);
      const [cr] = await connection.query(
        `SELECT COUNT(*) AS total FROM page_master_tb p ${bw.sql}`,
        bw.params
      );
      total += cr[0].total;
    }
    if (includeNoBrand) {
      const nw = halfWhere("w", false);
      const [cr] = await connection.query(
        `SELECT COUNT(*) AS total FROM master_tb_withoutbrand w ${nw.sql}`,
        nw.params
      );
      total += cr[0].total;
    }

    // ---- rows (lean columns; full data is loaded via ?type=detail) ----
    const pieces = [];
    const unionParams = [];

    if (includeBrand) {
      const bw = halfWhere("p", true);
      pieces.push(`
        SELECT p.id, 'brand' AS _source, p.page_title, p.page_url, p.status,
               p.city_id, p.category_id, p.brand_id, p.service_type_id,
               p.created_at, p.updated_at,
               c.city_name, cat.category_name, b.brand_name
        FROM page_master_tb p
        LEFT JOIN city_tb c       ON p.city_id = c.id
        LEFT JOIN category_tb cat ON p.category_id = cat.id
        LEFT JOIN brand_tb b      ON p.brand_id = b.id
        ${bw.sql}
      `);
      unionParams.push(...bw.params);
    }

    if (includeNoBrand) {
      const nw = halfWhere("w", false);
      pieces.push(`
        SELECT w.id, 'nobrand' AS _source, w.page_title, w.page_url, w.status,
               w.city_id, w.category_id, NULL AS brand_id, w.service_type_id,
               w.created_at, w.updated_at,
               c.city_name, cat.category_name, NULL AS brand_name
        FROM master_tb_withoutbrand w
        LEFT JOIN city_tb c       ON w.city_id = c.id
        LEFT JOIN category_tb cat ON w.category_id = cat.id
        ${nw.sql}
      `);
      unionParams.push(...nw.params);
    }

    let rows = [];
    if (pieces.length > 0) {
      const unionSql = pieces.join(" UNION ALL ");
      // sortBy is whitelisted; sortDir/limit/offset are validated -> safe to inline.
      const [r] = await connection.query(
        `SELECT * FROM ( ${unionSql} ) u
         ORDER BY u.${sortBy} ${sortDir}
         LIMIT ${limit} OFFSET ${offset}`,
        unionParams
      );
      rows = r;
    }

    return NextResponse.json({
      success: true,
      data: rows,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}

export async function PUT(request) {
  let connection;
  try {
    const body = await request.json();
    const { id, _source } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing page id" },
        { status: 400 }
      );
    }

    // Route to the correct table. Default to the branded table for
    // backward compatibility with any caller that omits _source.
    const table = TABLES[_source] || TABLES.brand;

    connection = await db.getConnection();

    // Only write columns that actually exist on the chosen table.
    const existing = await getColumns(connection, table);
    const fields = CANDIDATE_UPDATE_FIELDS.filter((f) => existing.has(f));
    const setSql = fields.map((f) => `\`${f}\`=?`).join(", ");
    const setVals = fields.map((f) => (body[f] === undefined ? null : body[f]));

    const updatedClause = existing.has("updated_at") ? ", updated_at=NOW()" : "";

    await connection.query(
      `UPDATE \`${table}\` SET ${setSql}${updatedClause} WHERE id=?`,
      [...setVals, id]
    );

    return NextResponse.json({
      success: true,
      message: "Page Updated Successfully",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}