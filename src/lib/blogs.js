import db from "@/lib/db";

/**
 * Public, read-only blog data — published blogs (status = '1') when a status
 * column exists. Reads from the same `blog` / `blog_category` tables the admin
 * panel writes to. Used by /api/blogs (listing) and /blogs/[slug] (detail).
 *
 * IMPORTANT: every SELECT is column-safe. We inspect the real `blog` table
 * columns first and only select the ones that exist, so an optional column
 * (e.g. blog_image_cover, blog_description) that isn't present in this DB can
 * never turn the whole query into an "Unknown column" error → empty page.
 */

// Cache of the real columns on the `blog` table.
let _blogCols = null;
async function getBlogColumns(connection) {
  if (_blogCols) return _blogCols;
  const [cols] = await connection.query(`SHOW COLUMNS FROM blog`);
  _blogCols = new Set(cols.map((c) => c.Field));
  return _blogCols;
}

const DESIRED_LIST = [
  "id", "blog_cat_id", "blog_url", "blog_title", "blog_name",
  "blog_description", "blog_image", "blog_image_cover",
  "author_name", "publishdate", "blog_date", "created_at",
];

function listSelect(cols) {
  const present = DESIRED_LIST.filter((c) => cols.has(c));
  if (!present.includes("id")) present.unshift("id");
  return present.map((c) => `b.${c}`).join(", ");
}

function orderByClause(cols) {
  const dateCols = ["publishdate", "blog_date", "created_at"]
    .filter((c) => cols.has(c))
    .map((c) => `b.${c}`);
  return dateCols.length
    ? `ORDER BY COALESCE(${dateCols.join(", ")}) DESC, b.id DESC`
    : `ORDER BY b.id DESC`;
}

// Strip HTML + collapse whitespace to build a short, safe excerpt.
function excerptFrom(html = "", max = 160) {
  const text = String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

function shapeListRow(r) {
  return {
    id: r.id,
    blog_cat_id: r.blog_cat_id ?? null,
    blog_url: r.blog_url,
    title: r.blog_title || r.blog_name || "Untitled",
    category_name: r.category_name || null,
    category_url: r.category_url || null,
    image: r.blog_image_cover || r.blog_image || null,
    author: r.author_name || "Mr. Service Expert",
    date: r.publishdate || r.blog_date || r.created_at || null,
    excerpt: excerptFrom(r.blog_description || ""),
  };
}

export async function listBlogCategories() {
  let connection;
  try {
    connection = await db.getConnection();
    const cols = await getBlogColumns(connection);
    const onlyPublished = cols.has("status")
      ? "AND (b.status = '1' OR LOWER(b.status) = 'active')"
      : "";
    const [rows] = await connection.query(
      `SELECT c.id, c.name, c.category_url,
              COUNT(b.id) AS blog_count
       FROM blog_category c
       LEFT JOIN blog b ON b.blog_cat_id = c.id ${onlyPublished}
       GROUP BY c.id, c.name, c.category_url
       ORDER BY c.name ASC`
    );
    return rows;
  } finally {
    if (connection) connection.release();
  }
}

export async function listPublishedBlogs({
  page = 1,
  limit = 9,
  category = "",
  search = "",
} = {}) {
  let connection;
  try {
    connection = await db.getConnection();
    const cols = await getBlogColumns(connection);

    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.min(48, Math.max(1, parseInt(limit, 10) || 9));
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];

    if (cols.has("status"))
      where.push("(b.status = '1' OR LOWER(b.status) = 'active')");

    if (search) {
      const fields = ["b.blog_title", "b.blog_name"];
      if (cols.has("blog_description")) fields.push("b.blog_description");
      where.push("(" + fields.map((f) => `${f} LIKE ?`).join(" OR ") + ")");
      fields.forEach(() => params.push(`%${search}%`));
    }
    if (category) {
      if (/^\d+$/.test(String(category))) {
        where.push("b.blog_cat_id = ?");
        params.push(category);
      } else {
        where.push("bc.category_url = ?");
        params.push(category);
      }
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [countRows] = await connection.query(
      `SELECT COUNT(*) AS total
       FROM blog b
       LEFT JOIN blog_category bc ON b.blog_cat_id = bc.id
       ${whereSql}`,
      params
    );
    const total = countRows[0].total;

    const [rows] = await connection.query(
      `SELECT ${listSelect(cols)}, bc.name AS category_name, bc.category_url
       FROM blog b
       LEFT JOIN blog_category bc ON b.blog_cat_id = bc.id
       ${whereSql}
       ${orderByClause(cols)}
       LIMIT ${limit} OFFSET ${offset}`,
      params
    );

    return {
      data: rows.map(shapeListRow),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  } finally {
    if (connection) connection.release();
  }
}

export async function getPublishedBlogBySlug(slug) {
  if (!slug) return null;
  let connection;
  try {
    connection = await db.getConnection();
    const cols = await getBlogColumns(connection);
    const statusClause = cols.has("status")
      ? "AND (b.status = '1' OR LOWER(b.status) = 'active')"
      : "";
    const [rows] = await connection.query(
      `SELECT b.*, bc.name AS category_name, bc.category_url
       FROM blog b
       LEFT JOIN blog_category bc ON b.blog_cat_id = bc.id
       WHERE b.blog_url = ? ${statusClause}
       LIMIT 1`,
      [String(slug).toLowerCase()]
    );
    if (!rows.length) return null;
    const b = rows[0];
    return {
      id: b.id,
      blog_url: b.blog_url,
      title: b.blog_title || b.blog_name || "Untitled",
      name: b.blog_name || "",
      category_name: b.category_name || null,
      category_url: b.category_url || null,
      author: b.author_name || "Mr. Service Expert",
      date: b.publishdate || b.blog_date || b.created_at || null,
      image: b.blog_image_cover || b.blog_image || null,
      content: b.ckeditercontant || b.blog_content_text || "",
      meta_title: b.blog_title || b.blog_name || "",
      meta_description: b.blog_description || excerptFrom(b.ckeditercontant || ""),
      meta_keywords: b.blog_keywords || "",
      canonical: b.Canonical || "",
      robots: b.Robots || "index, follow",
    };
  } finally {
    if (connection) connection.release();
  }
}

export async function recentPublishedBlogs(excludeId = 0, limit = 4) {
  let connection;
  try {
    connection = await db.getConnection();
    const cols = await getBlogColumns(connection);
    const where = ["b.id <> ?"];
    if (cols.has("status"))
      where.push("(b.status = '1' OR LOWER(b.status) = 'active')");
    const lim = Math.min(8, Math.max(1, limit));
    const [rows] = await connection.query(
      `SELECT ${listSelect(cols)}, bc.name AS category_name, bc.category_url
       FROM blog b
       LEFT JOIN blog_category bc ON b.blog_cat_id = bc.id
       WHERE ${where.join(" AND ")}
       ${orderByClause(cols)}
       LIMIT ${lim}`,
      [excludeId || 0]
    );
    return rows.map(shapeListRow);
  } finally {
    if (connection) connection.release();
  }
}
