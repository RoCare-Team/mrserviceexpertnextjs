/**
 * Shared image pipeline used by the admin uploaders:
 *   convert to WebP -> ask our API for a presigned S3 URL -> PUT the blob to S3.
 *
 * Used by ImageUploader (featured/cover images) and by the TipTap editor's
 * image modal (in-content images), so both store real S3 URLs instead of
 * base64 data URLs.
 */

/**
 * Converts an image file to WebP format using Canvas API.
 */
export const convertToWebP = (file, quality = 0.82, maxWidth = null, maxHeight = null) => {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (maxWidth && width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (maxHeight && height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width);
      canvas.height = Math.round(height);

      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({
              blob,
              originalSize: file.size,
              convertedSize: blob.size,
              width: canvas.width,
              height: canvas.height,
            });
          } else {
            reject(new Error("Failed to convert image to WebP"));
          }
        },
        "image/webp",
        quality
      );

      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error("Failed to load image for conversion"));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Fetch an image from a URL and turn it into a File object (used for
 * migrating old JPG images to WebP + S3).
 */
export const fetchImageAsFile = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch image");
  const blob = await response.blob();
  const filename = url.split("/").pop().split("?")[0] || "image.jpg";
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
};

/**
 * Generates a unique WebP filename.
 */
export const generateWebPFilename = (originalName) => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const baseName = (originalName || "image")
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "_");
  const truncatedName = baseName.substring(0, 50);
  return `${timestamp}-${truncatedName}-${randomStr}.webp`;
};

/**
 * Ask our Next.js API for a presigned S3 PUT URL.
 */
export const getPresignedUrl = async (filename, contentType, prefix) => {
  const res = await fetch("/api/admin/s3-upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename, contentType, prefix }),
  });
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({}));
    throw new Error(error || "Failed to get upload URL");
  }
  return res.json(); // { uploadUrl, publicUrl, key }
};

/**
 * PUT a blob to S3 using XHR so we can track upload progress.
 */
export const putBlobToS3 = (uploadUrl, blob, contentType, onProgress) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`S3 upload failed (${xhr.status}): ${xhr.responseText}`));
    };
    xhr.onerror = () => reject(new Error("Network error while uploading to S3"));
    xhr.send(blob);
  });

/**
 * Full pipeline: File -> WebP -> S3. Returns the public S3 URL.
 */
export const uploadImageToS3 = async (file, { prefix = "blogs", onProgress, onConvert } = {}) => {
  let uploadBlob = file;

  if (file.type !== "image/webp") {
    onConvert?.(true);
    try {
      const { blob } = await convertToWebP(file, 0.82, 1920, null);
      uploadBlob = blob;
    } finally {
      onConvert?.(false);
    }
  }

  const fileName = generateWebPFilename(file.name);
  const { uploadUrl, publicUrl } = await getPresignedUrl(fileName, "image/webp", prefix);
  await putBlobToS3(uploadUrl, uploadBlob, "image/webp", onProgress);

  return publicUrl;
};
