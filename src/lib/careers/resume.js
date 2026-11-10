// Resume storage in the PRIVATE `career-resumes/` prefix of the S3 bucket.
//
//   1. presignResumeUpload()  → short-lived PUT URL. Content-Type and
//      Content-Length are signed, so S3 rejects a body of any other size
//      or type than the one validated here (≤ 5 MB).
//   2. verifyUploadedResume() → HEAD + first bytes of the object: real size
//      ≤ 5 MB, matches the declared size, and the bytes really are a
//      PDF / DOC / DOCX. Anything else is deleted.
//   3. resumeDownloadUrl()    → 5-minute GET URL for authorised admins.
//
// The bucket policy must NOT grant public read on `career-resumes/*`.
// AWS credentials never leave the server.

import crypto from "node:crypto";
import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { HttpError } from "@/lib/careers/http";
import { MAX_RESUME_BYTES, RESUME_TOO_LARGE_MSG, RESUME_BAD_FORMAT_MSG } from "@/lib/careers/constants";

const REGION = process.env.AWS_S3_REGION;
const BUCKET = process.env.AWS_S3_BUCKET;
export const RESUME_PREFIX = "career-resumes/";

const s3 =
  globalThis._careerS3 ??
  new S3Client({
    region: REGION,
    // Otherwise the SDK signs a CRC32 of the (empty) presign body into the
    // URL and S3 rejects every real browser upload.
    requestChecksumCalculation: "WHEN_REQUIRED",
    responseChecksumValidation: "WHEN_REQUIRED",
    credentials: { accessKeyId: process.env.AWS_ACCESS_KEY_ID, secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY },
  });
globalThis._careerS3 = s3;

function assertConfigured() {
  if (!REGION || !BUCKET || !process.env.AWS_ACCESS_KEY_ID) {
    throw new HttpError(503, "storage_unavailable", "Resume upload is temporarily unavailable. Please try again later.");
  }
}

export function newResumeKey(ext) {
  const now = new Date();
  const ym = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  return `${RESUME_PREFIX}${ym}/${crypto.randomBytes(16).toString("hex")}.${ext}`;
}

export async function presignResumeUpload({ key, mime, size }) {
  assertConfigured();
  const url = await getSignedUrl(
    s3,
    new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: mime, ContentLength: size }),
    { expiresIn: 300, signableHeaders: new Set(["content-type", "content-length"]) }
  );
  return url;
}

// Magic bytes: PDF "%PDF-", legacy DOC = OLE2 compound file, DOCX = ZIP.
function sniff(buf) {
  if (buf.length >= 5 && buf.toString("ascii", 0, 5) === "%PDF-") return "pdf";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]))) return "doc";
  if (buf.length >= 4 && buf[0] === 0x50 && buf[1] === 0x4b && buf[2] === 0x03 && buf[3] === 0x04) return "docx";
  return null;
}

/** Throws (and deletes the object) unless it is a valid resume ≤ 5 MB. */
export async function verifyUploadedResume({ key, declaredSize }) {
  assertConfigured();
  if (!key.startsWith(RESUME_PREFIX)) throw new HttpError(400, "resume_invalid", "Please upload your resume again.");
  let head;
  try {
    head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    if (err?.$metadata?.httpStatusCode === 404 || err?.name === "NotFound") {
      throw new HttpError(400, "resume_missing", "We could not find your uploaded resume. Please upload it again.");
    }
    throw err;
  }
  const size = Number(head.ContentLength || 0);
  if (size > MAX_RESUME_BYTES) {
    await deleteResume(key);
    throw new HttpError(413, "file_too_large", RESUME_TOO_LARGE_MSG);
  }
  if (!size || (declaredSize && size !== Number(declaredSize))) {
    await deleteResume(key);
    throw new HttpError(400, "resume_invalid", "The resume upload was incomplete. Please upload it again.");
  }
  const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key, Range: "bytes=0-7" }));
  const buf = Buffer.from(await obj.Body.transformToByteArray());
  const kind = sniff(buf);
  const ext = key.split(".").pop();
  // A .doc saved as .docx (or vice versa) is still a Word file — accept both.
  const okType = kind && (kind === ext || (kind !== "pdf" && ext !== "pdf"));
  if (!okType) {
    await deleteResume(key);
    throw new HttpError(415, "file_type", RESUME_BAD_FORMAT_MSG);
  }
  return { size, mime: head.ContentType };
}

export async function resumeDownloadUrl(key, filename, { inline = false } = {}) {
  assertConfigured();
  if (!key || !key.startsWith(RESUME_PREFIX)) throw new HttpError(404, "not_found", "Resume not available.");
  const safe = String(filename || "resume").replace(/[^\w.-]+/g, "_").slice(0, 120) || "resume";
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: `${inline ? "inline" : "attachment"}; filename="${safe}"`,
      ResponseCacheControl: "private, no-store",
    }),
    { expiresIn: 300 }
  );
}

export async function deleteResume(key) {
  if (!key || !BUCKET || !key.startsWith(RESUME_PREFIX)) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    console.error("[careers] resume delete failed:", key, err?.message);
  }
}
