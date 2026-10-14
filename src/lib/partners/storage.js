// S3 storage for partner uploads. Files are uploaded through our server (not
// presigned PUTs) so size, type and actual file bytes are checked first.
//
//   partners/{partnerId}/{logo|shop}/…     public images (profile + cards)
//   partner-docs/{partnerId}/{docType}/…   PRIVATE — read only through
//                                          short-lived presigned GET URLs
//
// The bucket policy must NOT grant public read on `partner-docs/*`.

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "node:crypto";
import { HttpError } from "@/lib/partners/http";

const REGION = process.env.AWS_S3_REGION;
const BUCKET = process.env.AWS_S3_BUCKET;

const s3 =
  globalThis._partnerS3 ??
  new S3Client({
    region: REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
globalThis._partnerS3 = s3;

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// Detect type from the file's magic bytes — the browser's MIME is ignored.
function sniff(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { mime: "image/jpeg", ext: "jpg" };
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return { mime: "image/png", ext: "png" };
  if (buf.length >= 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP")
    return { mime: "image/webp", ext: "webp" };
  if (buf.length >= 5 && buf.toString("ascii", 0, 5) === "%PDF-") return { mime: "application/pdf", ext: "pdf" };
  return null;
}

async function readFile(file, allowed) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new HttpError(400, "file_missing", "Please choose a file to upload.");
  }
  if (file.size > MAX_UPLOAD_BYTES) throw new HttpError(413, "file_too_large", "File must be 5 MB or smaller.");
  if (file.size === 0) throw new HttpError(400, "file_empty", "The file is empty.");
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniff(buf);
  if (!type || !allowed.includes(type.mime)) {
    throw new HttpError(415, "file_type", `Allowed file types: ${allowed.map((m) => m.split("/")[1].toUpperCase()).join(", ")}.`);
  }
  return { buf, ...type };
}

const stamp = () => `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

function assertConfigured() {
  if (!REGION || !BUCKET) throw new HttpError(503, "storage_unavailable", "File storage is not configured.");
}

export function publicUrl(key) {
  if (!key || !REGION || !BUCKET) return null;
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

/** kind: "logo" | "shop" → stored under partners/{id}/{kind}/ */
export async function uploadPartnerImage(partnerId, kind, file) {
  assertConfigured();
  const { buf, mime, ext } = await readFile(file, ["image/jpeg", "image/png", "image/webp"]);
  const key = `partners/${partnerId}/${kind}/${stamp()}.${ext}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buf,
      ContentType: mime,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  return key;
}

export async function uploadPartnerDocument(partnerId, docType, file) {
  assertConfigured();
  const { buf, mime, ext } = await readFile(file, ["application/pdf", "image/jpeg", "image/png"]);
  const key = `partner-docs/${partnerId}/${docType}/${stamp()}.${ext}`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buf,
      ContentType: mime,
      CacheControl: "private, no-store",
      ServerSideEncryption: "AES256",
    })
  );
  return { key, mime, size: buf.length };
}

/** 5-minute download link for a private document. */
export async function privateDocumentUrl(key, filename) {
  assertConfigured();
  if (!key.startsWith("partner-docs/")) throw new HttpError(400, "bad_key", "Invalid document.");
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ResponseContentDisposition: `inline; filename="${String(filename || "document").replace(/[^\w.-]/g, "_")}"`,
    }),
    { expiresIn: 300 }
  );
}

/** Best-effort cleanup of a replaced object; failures are only logged. */
export async function deleteObject(key) {
  if (!key || !BUCKET) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  } catch (err) {
    console.error("[partner-storage] delete failed:", key, err?.message);
  }
}
