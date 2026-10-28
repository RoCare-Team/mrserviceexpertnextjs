import db from "@/lib/db";
import { ok, handle, assertSameOrigin, rateLimit, HttpError } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { EDITABLE, getApplication } from "@/lib/partners/application";
import { uploadPartnerDocument } from "@/lib/partners/storage";
import { DOC_TYPES } from "@/lib/partners/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_DOCS = 10;

/** Private document upload → S3 partner-docs/{partnerId}/{type}/. */
export const POST = handle(async (req) => {
  assertSameOrigin(req);
  const p = await requirePartner(req);
  if (!EDITABLE.has(p.status) && !["approved", "suspended"].includes(p.status)) {
    throw new HttpError(409, "not_editable", "Documents can't be added while your application is under review.");
  }
  rateLimit(`partner-upload:${p.id}`, 20, 10 * 60_000);

  const form = await req.formData().catch(() => null);
  if (!form) throw new HttpError(400, "bad_request", "Expected a file upload.");
  const docType = String(form.get("doc_type") || "");
  if (!DOC_TYPES[docType]) throw new HttpError(422, "validation_error", "Choose a document type.");

  const [[{ n }]] = await db.query(
    "SELECT COUNT(*) AS n FROM partner_documents WHERE partner_id = ? AND deleted_at IS NULL",
    [p.id]
  );
  if (n >= MAX_DOCS) throw new HttpError(409, "too_many", `You can upload up to ${MAX_DOCS} documents.`);

  const file = form.get("file");
  const { key, mime, size } = await uploadPartnerDocument(p.id, docType, file);
  const originalName = String(file?.name || "").replace(/[^\w .()-]/g, "_").slice(0, 160);
  await db.query(
    `INSERT INTO partner_documents (partner_id, doc_type, s3_key, mime_type, size_bytes, original_name)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [p.id, docType, key, mime, size, originalName]
  );
  return ok(await getApplication(p.id));
});
