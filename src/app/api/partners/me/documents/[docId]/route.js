import db from "@/lib/db";
import { ok, handle, assertSameOrigin, toInt, HttpError } from "@/lib/partners/http";
import { requirePartner } from "@/lib/partners/auth";
import { EDITABLE, getApplication } from "@/lib/partners/application";
import { privateDocumentUrl } from "@/lib/partners/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Ownership is enforced in SQL: a partner can only touch rows with their id.
async function ownDoc(req, ctx) {
  const p = await requirePartner(req);
  const docId = toInt((await ctx.params).docId);
  if (!docId) throw new HttpError(404, "not_found", "Document not found.");
  const [[doc]] = await db.query(
    "SELECT * FROM partner_documents WHERE id = ? AND partner_id = ? AND deleted_at IS NULL",
    [docId, p.id]
  );
  if (!doc) throw new HttpError(404, "not_found", "Document not found.");
  return { p, doc };
}

/** Short-lived link to view one's own document. */
export const GET = handle(async (req, ctx) => {
  const { doc } = await ownDoc(req, ctx);
  return ok({ url: await privateDocumentUrl(doc.s3_key, doc.original_name) });
});

export const DELETE = handle(async (req, ctx) => {
  assertSameOrigin(req);
  const { p, doc } = await ownDoc(req, ctx);
  if (!EDITABLE.has(p.status)) {
    throw new HttpError(409, "not_editable", "Click “Edit profile” on your dashboard before removing documents.");
  }
  // Soft delete: the file stays for the audit trail but is no longer shown.
  await db.query("UPDATE partner_documents SET deleted_at = NOW() WHERE id = ?", [doc.id]);
  return ok(await getApplication(p.id));
});
