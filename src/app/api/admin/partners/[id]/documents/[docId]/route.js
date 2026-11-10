import db from "@/lib/db";
import { ok, handle, requireAdmin, readJson, toInt, HttpError } from "@/lib/partners/http";
import { getApplication, withTransaction, logHistory } from "@/lib/partners/application";
import { privateDocumentUrl } from "@/lib/partners/storage";
import { syncRequestWithReview } from "@/lib/partners/docRequests";
import { notifyPartner } from "@/lib/partners/notify";
import { DOC_TYPES } from "@/lib/partners/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function loadDoc(ctx) {
  const params = await ctx.params;
  const id = toInt(params.id);
  const docId = toInt(params.docId);
  if (!id || !docId) throw new HttpError(404, "not_found", "Document not found.");
  const [[doc]] = await db.query(
    "SELECT * FROM partner_documents WHERE id = ? AND partner_id = ? AND deleted_at IS NULL",
    [docId, id]
  );
  if (!doc) throw new HttpError(404, "not_found", "Document not found.");
  return doc;
}

/** 5-minute signed link for an admin to view a private document. */
export const GET = handle(async (req, ctx) => {
  await requireAdmin(req);
  const doc = await loadDoc(ctx);
  return ok({ url: await privateDocumentUrl(doc.s3_key, doc.original_name) });
});

/** { review_status: verified|rejected|pending, note? } */
export const PATCH = handle(async (req, ctx) => {
  const admin = await requireAdmin(req);
  const doc = await loadDoc(ctx);
  const body = await readJson(req);
  if (!["verified", "rejected", "pending"].includes(body.review_status)) {
    throw new HttpError(422, "validation_error", "Invalid review status.");
  }
  const note = String(body.note ?? "").trim().slice(0, 500) || null;
  const request = await withTransaction(async (conn) => {
    await conn.query(
      "UPDATE partner_documents SET review_status = ?, review_note = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?",
      [body.review_status, note, admin.id, doc.id]
    );
    await logHistory(conn, {
      partnerId: doc.partner_id,
      action: `document_${body.review_status}`,
      reason: `${doc.doc_type} #${doc.id}${note ? ` — ${note}` : ""}`,
      actorType: "admin",
      actorId: admin.id,
    });
    return syncRequestWithReview(conn, doc.id, body.review_status, note);
  });
  // A requested document was rejected → the partner has to upload it again.
  if (request && body.review_status === "rejected") {
    await notifyPartner(
      doc.partner_id,
      {
        type: "document_request",
        title: `Please upload again: ${DOC_TYPES[doc.doc_type] || doc.doc_type}`,
        body: note || "The uploaded file was not accepted.",
        link: "/partner/dashboard",
      },
      { push: true }
    );
  }
  return ok(await getApplication(doc.partner_id, { forAdmin: true }));
});
