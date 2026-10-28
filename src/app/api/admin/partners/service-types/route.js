import db from "@/lib/db";
import { ok, handle, requireAdmin, readJson, toInt, HttpError } from "@/lib/partners/http";
import { slugify } from "@/lib/partners/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Partner service catalogue (partner_service_types), per category.
 * GET                         → all rows with category name + partner usage
 * POST { category_id, name, sort_order? }
 * PUT  { id, name?, sort_order?, status? }
 * Rows are deactivated, never deleted, so existing selections stay valid.
 */
export const GET = handle(async (req) => {
  await requireAdmin(req);
  const [rows] = await db.query(
    `SELECT t.id, t.category_id, c.category_name, t.name, t.slug, t.sort_order, t.status,
            (SELECT COUNT(*) FROM partner_services ps WHERE ps.service_type_id = t.id) AS partner_count
       FROM partner_service_types t JOIN category_tb c ON c.id = t.category_id
      ORDER BY c.id, t.sort_order, t.name`
  );
  const [categories] = await db.query(
    "SELECT id, category_name FROM category_tb WHERE status = '1' ORDER BY id"
  );
  return ok({ rows, categories });
});

function cleanName(v) {
  const name = String(v ?? "").replace(/\s+/g, " ").trim();
  if (name.length < 2 || name.length > 120) throw new HttpError(422, "validation_error", "Name must be 2–120 characters.");
  return name;
}

export const POST = handle(async (req) => {
  await requireAdmin(req);
  const body = await readJson(req);
  const categoryId = toInt(body.category_id);
  const name = cleanName(body.name);
  const [[cat]] = await db.query("SELECT id FROM category_tb WHERE id = ?", [categoryId]);
  if (!cat) throw new HttpError(422, "validation_error", "Choose a category.");
  const slug = slugify(name);
  try {
    await db.query(
      "INSERT INTO partner_service_types (category_id, name, slug, sort_order) VALUES (?, ?, ?, ?)",
      [categoryId, name, slug, Number.isInteger(Number(body.sort_order)) ? Number(body.sort_order) : 0]
    );
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") throw new HttpError(409, "duplicate", "This service already exists in that category.");
    throw err;
  }
  return ok(null);
});

export const PUT = handle(async (req) => {
  await requireAdmin(req);
  const body = await readJson(req);
  const id = toInt(body.id);
  if (!id) throw new HttpError(422, "validation_error", "id is required.");
  const sets = [];
  const vals = [];
  if (body.name !== undefined) {
    sets.push("name = ?");
    vals.push(cleanName(body.name));
  }
  if (body.sort_order !== undefined) {
    sets.push("sort_order = ?");
    vals.push(Number(body.sort_order) || 0);
  }
  if (body.status !== undefined) {
    sets.push("status = ?");
    vals.push(body.status ? 1 : 0);
  }
  if (!sets.length) throw new HttpError(422, "validation_error", "Nothing to update.");
  const [r] = await db.query(`UPDATE partner_service_types SET ${sets.join(", ")} WHERE id = ?`, [...vals, id]);
  if (!r.affectedRows) throw new HttpError(404, "not_found", "Service not found.");
  return ok(null);
});
