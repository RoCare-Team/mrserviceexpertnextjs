import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Force this route to always run dynamically on the server (never cached/prerendered)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REGION = process.env.AWS_S3_REGION;   // e.g. "ap-south-1"
const BUCKET = process.env.AWS_S3_BUCKET;   // e.g. "waterpurifiercareindia"

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Only these content types are allowed to be uploaded.
// We force WebP because the client converts everything to WebP before asking for a URL.
const ALLOWED_CONTENT_TYPES = new Set(["image/webp"]);

// Only these prefixes are allowed, so a malicious client can't write anywhere in the bucket.
const ALLOWED_PREFIXES = new Set(["blogs"]);

function sanitizeFilename(name) {
  // Strip any path components and keep a safe charset.
  const base = String(name || "").split(/[\\/]/).pop();
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export async function POST(request) {
  try {
    if (!REGION || !BUCKET) {
      return NextResponse.json(
        { error: "Server is missing AWS_S3_REGION or AWS_S3_BUCKET env vars." },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { filename, contentType, prefix = "blogs" } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: "filename and contentType are required." },
        { status: 400 }
      );
    }

    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: `contentType must be one of: ${[...ALLOWED_CONTENT_TYPES].join(", ")}` },
        { status: 400 }
      );
    }

    if (!ALLOWED_PREFIXES.has(prefix)) {
      return NextResponse.json(
        { error: `prefix must be one of: ${[...ALLOWED_PREFIXES].join(", ")}` },
        { status: 400 }
      );
    }

    const safeName = sanitizeFilename(filename);
    const key = `${prefix}/${safeName}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: contentType,
      // 1 year immutable cache — safe because filenames include a timestamp + random hash
      CacheControl: "public, max-age=31536000, immutable",
    });

    // URL is valid for 60 seconds — enough time to start the PUT.
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 60 });

    // Virtual-hosted-style public URL (works once the object is public via bucket policy
    // or via CloudFront). If you front the bucket with CloudFront, swap this for your
    // CloudFront domain.
    const publicUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch (err) {
    console.error("[s3-upload-url] Failed to presign:", err);
    return NextResponse.json(
      { error: "Failed to create upload URL." },
      { status: 500 }
    );
  }
}