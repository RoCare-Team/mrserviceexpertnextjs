import db from "@/lib/db";
import { ok, handle, assertSameOrigin, rateLimit, HttpError } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { EDITABLE, getApplication } from "@/lib/partners/application";
import { uploadPartnerImage, deleteObject } from "@/lib/partners/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Uploads go to S3 under partners/{partnerId}/{logo|shop}/.
const COLUMNS = { logo: "logo_key", shop: "shop_image_key" };

function kindOf(v) {
  const col = COLUMNS[v];
  if (!col) throw new HttpError(400, "bad_kind", "Unknown image type.");
  return col;
}

async function editablePartner(req) {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  // Photos are live edits: allowed while drafting and once approved.
  if (!EDITABLE.has(p.status) && !["approved", "suspended"].includes(p.status)) {
    throw new HttpError(409, "not_editable", "Images can't be changed while your application is under review.");
  }
  return p;
}

export const POST = handle(async (req) => {
  const p = await editablePartner(req);
  rateLimit(`partner-upload:${p.id}`, 20, 10 * 60_000);

  const form = await req.formData().catch(() => null);
  if (!form) throw new HttpError(400, "bad_request", "Expected a file upload.");
  const kind = String(form.get("kind") || "");
  const col = kindOf(kind);

  const key = await uploadPartnerImage(p.id, kind, form.get("file"));
  await db.query(`UPDATE partners SET ${col} = ?, version = version + 1 WHERE id = ?`, [key, p.id]);
  if (p[col] && p[col] !== key) await deleteObject(p[col]);
  return ok(await getApplication(p.id));
});

export const DELETE = handle(async (req) => {
  const p = await editablePartner(req);
  const kind = new URL(req.url).searchParams.get("kind");
  const col = kindOf(kind);
  await db.query(`UPDATE partners SET ${col} = NULL, version = version + 1 WHERE id = ?`, [p.id]);
  if (p[col]) await deleteObject(p[col]);
  return ok(await getApplication(p.id));
});
