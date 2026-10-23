import db from "@/lib/db";
import { ok, handle, assertSameOrigin, rateLimit, HttpError } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { getApplication } from "@/lib/partners/application";
import { uploadPartnerImage } from "@/lib/partners/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PHOTOS = 8;

/** Gallery photo → S3 partners/{partnerId}/gallery/ (public, live). */
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  if (p.status === "pending") throw new HttpError(409, "not_editable", "Photos can't be changed while your application is under review.");
  rateLimit(`partner-upload:${p.id}`, 20, 10 * 60_000);

  const [[{ n }]] = await db.query("SELECT COUNT(*) AS n FROM partner_photos WHERE partner_id = ?", [p.id]);
  if (n >= MAX_PHOTOS) throw new HttpError(409, "too_many", `You can add up to ${MAX_PHOTOS} photos.`);

  const form = await req.formData().catch(() => null);
  if (!form) throw new HttpError(400, "bad_request", "Expected a file upload.");
  const key = await uploadPartnerImage(p.id, "gallery", form.get("file"));
  await db.query("INSERT INTO partner_photos (partner_id, s3_key, sort_order) VALUES (?, ?, ?)", [p.id, key, n]);
  return ok(await getApplication(p.id));
});
