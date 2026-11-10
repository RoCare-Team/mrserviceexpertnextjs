// Admin → partner document requests ("please upload your Aadhaar").
//
//   open       partner sees a banner on the dashboard with an upload button
//   submitted  partner uploaded a file (linked via document_id)
//   completed  admin verified that document
//   cancelled  admin withdrew the request
//
// Rejecting the uploaded document sends the request back to `open`, with the
// admin's note shown to the partner.

import db from "@/lib/db";
import { HttpError } from "@/lib/partners/http";
import { withTransaction, logHistory } from "@/lib/partners/application";
import { notifyPartner } from "@/lib/partners/notify";
import { DOC_TYPES } from "@/lib/partners/validation";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const clean = (v, max) => String(v ?? "").trim().slice(0, max);

/** Requests for one partner, newest first. Partners don't see cancelled ones. */
export async function listDocRequests(partnerId, { forAdmin = false } = {}) {
  try {
    const [rows] = await db.query(
      `SELECT id, doc_type, note, DATE_FORMAT(due_date, '%Y-%m-%d') AS due_date, status, document_id,
              review_note, created_at, submitted_at, closed_at
         FROM partner_document_requests
        WHERE partner_id = ? ${forAdmin ? "" : "AND status <> 'cancelled'"}
        ORDER BY FIELD(status, 'open', 'submitted', 'completed', 'cancelled'), id DESC
        LIMIT 50`,
      [partnerId]
    );
    return rows.map((r) => ({ ...r, label: DOC_TYPES[r.doc_type] || r.doc_type }));
  } catch (err) {
    // Migration 2026_11_10_009 not run yet — the dashboard must still load.
    if (err?.code === "ER_NO_SUCH_TABLE") return [];
    throw err;
  }
}

export async function createDocRequest(admin, partnerId, { doc_type, note, due_date }) {
  if (!DOC_TYPES[doc_type]) throw new HttpError(422, "validation_error", "Choose a document type.");
  const text = clean(note, 500);
  const due = due_date && DATE_RE.test(due_date) ? due_date : null;
  if (doc_type === "other" && text.length < 5) {
    throw new HttpError(422, "validation_error", "For “Other document”, describe what the partner should upload.");
  }

  const id = await withTransaction(async (conn) => {
    const [[p]] = await conn.query("SELECT id, status FROM partners WHERE id = ? AND deleted_at IS NULL FOR UPDATE", [partnerId]);
    if (!p) throw new HttpError(404, "not_found", "Partner not found.");
    if (!["approved", "suspended"].includes(p.status)) {
      throw new HttpError(409, "not_live", "Document requests are for approved partners. Use “Request more info” for applications under review.");
    }
    const [[dup]] = await conn.query(
      "SELECT id FROM partner_document_requests WHERE partner_id = ? AND doc_type = ? AND status IN ('open','submitted')",
      [partnerId, doc_type]
    );
    if (dup && doc_type !== "other") throw new HttpError(409, "duplicate", `${DOC_TYPES[doc_type]} is already requested.`);
    const [r] = await conn.query(
      "INSERT INTO partner_document_requests (partner_id, doc_type, note, due_date, requested_by) VALUES (?, ?, ?, ?, ?)",
      [partnerId, doc_type, text || null, due, admin.id]
    );
    await logHistory(conn, {
      partnerId,
      action: "document_requested",
      from: p.status,
      to: p.status,
      reason: `${DOC_TYPES[doc_type]}${text ? ` — ${text}` : ""}${due ? ` (by ${due})` : ""}`,
      actorType: "admin",
      actorId: admin.id,
    });
    return r.insertId;
  });

  await notifyPartner(
    partnerId,
    {
      type: "document_request",
      title: `Please upload: ${DOC_TYPES[doc_type]}`,
      body: [text, due ? `Upload by ${due}.` : ""].filter(Boolean).join(" "),
      link: "/partner/dashboard",
    },
    { push: true }
  );
  return id;
}

export async function cancelDocRequest(admin, partnerId, requestId) {
  await withTransaction(async (conn) => {
    const [[r]] = await conn.query(
      "SELECT * FROM partner_document_requests WHERE id = ? AND partner_id = ? FOR UPDATE",
      [requestId, partnerId]
    );
    if (!r) throw new HttpError(404, "not_found", "Request not found.");
    if (!["open", "submitted"].includes(r.status)) throw new HttpError(409, "closed", "This request is already closed.");
    await conn.query("UPDATE partner_document_requests SET status = 'cancelled', closed_at = NOW() WHERE id = ?", [requestId]);
    await logHistory(conn, {
      partnerId,
      action: "document_request_cancelled",
      reason: DOC_TYPES[r.doc_type] || r.doc_type,
      actorType: "admin",
      actorId: admin.id,
    });
  });
}

/**
 * Lock an open request of this partner for an upload (inside the upload
 * transaction). Returns the request row.
 */
export async function lockOpenRequest(conn, partnerId, requestId) {
  const [[r]] = await conn.query(
    "SELECT * FROM partner_document_requests WHERE id = ? AND partner_id = ? FOR UPDATE",
    [requestId, partnerId]
  );
  if (!r) throw new HttpError(404, "not_found", "Document request not found.");
  if (r.status !== "open") throw new HttpError(409, "closed", "This document was already uploaded.");
  return r;
}

export async function markRequestSubmitted(conn, requestId, documentId) {
  await conn.query(
    "UPDATE partner_document_requests SET status = 'submitted', document_id = ?, submitted_at = NOW(), review_note = NULL WHERE id = ?",
    [documentId, requestId]
  );
}

/**
 * Keep requests in step with an admin's review of an uploaded document.
 * verified → completed; rejected → open again (partner re-uploads).
 * Returns the affected request, if any, so the caller can notify.
 */
export async function syncRequestWithReview(conn, documentId, reviewStatus, note) {
  let r;
  try {
    [[r]] = await conn.query(
      "SELECT * FROM partner_document_requests WHERE document_id = ? AND status IN ('submitted','completed','open') ORDER BY id DESC LIMIT 1 FOR UPDATE",
      [documentId]
    );
  } catch (err) {
    if (err?.code === "ER_NO_SUCH_TABLE") return null;
    throw err;
  }
  if (!r) return null;
  if (reviewStatus === "verified") {
    await conn.query("UPDATE partner_document_requests SET status = 'completed', closed_at = NOW() WHERE id = ?", [r.id]);
  } else if (reviewStatus === "rejected") {
    await conn.query(
      "UPDATE partner_document_requests SET status = 'open', review_note = ?, closed_at = NULL WHERE id = ?",
      [note || "The uploaded file was not accepted. Please upload it again.", r.id]
    );
  } else {
    await conn.query("UPDATE partner_document_requests SET status = 'submitted', closed_at = NULL WHERE id = ?", [r.id]);
  }
  return r;
}
