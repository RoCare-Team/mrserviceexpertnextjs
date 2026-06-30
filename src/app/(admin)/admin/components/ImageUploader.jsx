"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  Link,
  X,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

/**
 * Converts an image file to WebP format using Canvas API.
 */
const convertToWebP = (file, quality = 0.82, maxWidth = null, maxHeight = null) => {
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
const fetchImageAsFile = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Failed to fetch image");
  const blob = await response.blob();
  const filename = url.split("/").pop().split("?")[0] || "image.jpg";
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
};

/**
 * Generates a unique WebP filename.
 */
const generateWebPFilename = (originalName) => {
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
const getPresignedUrl = async (filename, contentType, prefix) => {
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
const putBlobToS3 = (uploadUrl, blob, contentType, onProgress) =>
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

const ImageUploader = ({ value, onChange, storagePath = "blogs" }) => {
  const [mode, setMode] = useState("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [urlInput, setUrlInput] = useState("");
  const [error, setError] = useState("");
  const [compressionInfo, setCompressionInfo] = useState(null);
  const [isOldFormat, setIsOldFormat] = useState(false);
  const [convertingOldImage, setConvertingOldImage] = useState(false);
  const fileInputRef = useRef(null);

  // Detect legacy JPGs (either the old /uploads/blog_image path or any external .jpg)
  useEffect(() => {
    if (value) {
      const isJpg = value.includes("blog_image/blog_") && value.endsWith(".jpg");
      const isExternalJpg =
        value.startsWith("http") && (value.endsWith(".jpg") || value.endsWith(".jpeg"));
      setIsOldFormat(isJpg || isExternalJpg);
    } else {
      setIsOldFormat(false);
    }
  }, [value]);

  const isValidImageUrl = (url) => {
    if (!url) return false;
    try {
      new URL(url);
      return (
        /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(url) ||
        url.includes("amazonaws.com") ||
        url.includes("cloudfront.net") ||
        url.includes("imgur.com") ||
        url.includes("unsplash.com")
      );
    } catch {
      return false;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const convertOldImageToWebP = async () => {
    if (!value || !isOldFormat) return;
    setConvertingOldImage(true);
    setError("");
    try {
      const imageUrl = value.startsWith("http")
        ? value
        : `https://www.mrserviceexpert.com${value}`;
      const imageFile = await fetchImageAsFile(imageUrl);
      await uploadFile(imageFile, true);
      setConvertingOldImage(false);
    } catch (err) {
      console.error("Error converting old image:", err);
      setError("Failed to convert image. The old image may not be accessible.");
      setConvertingOldImage(false);
    }
  };

  /**
   * Main upload pipeline:
   *   1. Validate file
   *   2. Convert to WebP (unless it already is)
   *   3. Ask our API for a presigned S3 URL
   *   4. PUT the WebP blob straight to S3
   *   5. Pass the public S3 URL to the parent via onChange
   */
  const uploadFile = async (file, isMigration = false) => {
    if (!file) return;

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
    ];
    if (!validTypes.includes(file.type)) {
      setError("Please upload an image file (PNG, JPG, GIF, WebP, BMP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size should be less than 10MB");
      return;
    }

    setError("");
    if (!isMigration) setCompressionInfo(null);

    try {
      let uploadBlob;
      let conversionResult = null;

      // 1 + 2. Convert to WebP if needed
      if (file.type !== "image/webp") {
        setIsConverting(true);
        conversionResult = await convertToWebP(file, 0.82, 1920, null);
        uploadBlob = conversionResult.blob;

        setCompressionInfo({
          originalSize: conversionResult.originalSize,
          convertedSize: conversionResult.convertedSize,
          savings: Math.round(
            (1 - conversionResult.convertedSize / conversionResult.originalSize) * 100
          ),
        });
        setIsConverting(false);
      } else {
        uploadBlob = file;
        if (!isMigration) {
          setCompressionInfo({
            originalSize: file.size,
            convertedSize: file.size,
            savings: 0,
          });
        }
      }

      const fileName = generateWebPFilename(file.name);

      setIsUploading(true);
      setUploadProgress(0);

      // 3. Presign
      const { uploadUrl, publicUrl } = await getPresignedUrl(
        fileName,
        "image/webp",
        storagePath // e.g. "blogs"
      );

      // 4. Upload directly to S3
      await putBlobToS3(uploadUrl, uploadBlob, "image/webp", (pct) =>
        setUploadProgress(pct)
      );

      // 5. Done — hand the public URL back
      onChange(publicUrl);
      setIsUploading(false);
      setUploadProgress(100);
      if (isMigration) setConvertingOldImage(false);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message || "Failed to process image. Please try again.");
      setIsUploading(false);
      setIsConverting(false);
      if (isMigration) setConvertingOldImage(false);
    }
  };

  // Drag handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) uploadFile(files[0]);
  }, []);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      setError("Please enter an image URL");
      return;
    }
    if (!isValidImageUrl(urlInput)) {
      setError("Please enter a valid image URL");
      return;
    }
    setError("");
    setCompressionInfo(null);
    onChange(urlInput.trim());
    setUrlInput("");
  };

  const handleClear = () => {
    onChange("");
    setUrlInput("");
    setError("");
    setUploadProgress(0);
    setCompressionInfo(null);
    setIsOldFormat(false);
  };

  const isProcessing = isConverting || isUploading || convertingOldImage;

  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === "upload"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Upload size={16} />
          Upload
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === "url"
              ? "bg-blue-600 text-white shadow-md"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <Link size={16} />
          URL
        </button>
      </div>

      {/* Current Image Preview */}
      {value && (
        <div
          className={`relative rounded-xl overflow-hidden border-2 ${
            isOldFormat ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"
          }`}
        >
          <div className="flex items-center gap-3 p-3">
            <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <img
                src={
                  value.startsWith("http")
                    ? value
                    : `https://www.mrserviceexpert.com${value}`
                }
                alt="Featured image preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src =
                    'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="%23f3f4f6" width="80" height="80"/><text x="50%" y="50%" font-family="sans-serif" font-size="10" fill="%239ca3af" text-anchor="middle" dy=".3em">Error</text></svg>';
                }}
              />
              {isOldFormat && (
                <div className="absolute top-1 right-1 bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                  OLD JPG
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className={`flex items-center gap-2 mb-1 ${
                  isOldFormat ? "text-amber-700" : "text-green-700"
                }`}
              >
                {isOldFormat ? (
                  <>
                    <AlertTriangle size={16} />
                    <span className="text-sm font-medium">Old Format Detected (JPG)</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span className="text-sm font-medium">Image Selected (WebP)</span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-500 truncate" title={value}>
                {value}
              </p>
              {compressionInfo && compressionInfo.savings > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Compressed: {formatFileSize(compressionInfo.originalSize)} →{" "}
                  {formatFileSize(compressionInfo.convertedSize)}
                  <span className="font-semibold ml-1">
                    ({compressionInfo.savings}% saved)
                  </span>
                </p>
              )}
              {isOldFormat && (
                <button
                  type="button"
                  onClick={convertOldImageToWebP}
                  disabled={convertingOldImage}
                  className="mt-2 text-xs px-3 py-1.5 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {convertingOldImage ? (
                    <>
                      <Loader2 size={12} className="animate-spin" />
                      Converting to WebP...
                    </>
                  ) : (
                    "🔄 Convert to WebP"
                  )}
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
              title="Remove image"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Upload Mode */}
      {mode === "upload" && !value && (
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => !isProcessing && fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          } ${isProcessing ? "pointer-events-none" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
            onChange={handleFileSelect}
            className="hidden"
          />

          {isConverting ? (
            <div className="space-y-3">
              <Loader2 className="w-10 h-10 text-purple-500 mx-auto animate-spin" />
              <p className="text-sm text-gray-600 font-medium">Converting to WebP...</p>
              <p className="text-xs text-gray-400">Optimizing image for web</p>
            </div>
          ) : isUploading ? (
            <div className="space-y-3">
              <Loader2 className="w-10 h-10 text-blue-500 mx-auto animate-spin" />
              <div className="w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">Uploading to S3... {uploadProgress}%</p>
              {compressionInfo && compressionInfo.savings > 0 && (
                <p className="text-xs text-green-600">
                  Saved {compressionInfo.savings}% with WebP conversion
                </p>
              )}
            </div>
          ) : (
            <>
              <div
                className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  isDragging ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                <ImageIcon
                  className={`w-7 h-7 ${isDragging ? "text-blue-500" : "text-gray-400"}`}
                />
              </div>
              <p className="text-gray-700 font-medium mb-1">
                {isDragging ? "Drop your image here" : "Drag & drop an image here"}
              </p>
              <p className="text-sm text-gray-500 mb-3">or click to browse</p>
              <p className="text-xs text-gray-400">PNG, JPG, GIF, BMP up to 10MB</p>
              <p className="text-xs text-green-600 mt-1">
                ✓ Auto-converts to WebP &amp; uploads to S3 /{storagePath}/
              </p>
            </>
          )}
        </div>
      )}

      {/* URL Mode */}
      {mode === "url" && !value && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Link size={18} />
              </div>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleUrlSubmit();
                  }
                }}
                placeholder="https://example.com/image.jpg"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              type="button"
              onClick={handleUrlSubmit}
              className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-amber-600">
            ⚠️ External URLs won't be converted to WebP. For best performance, use the
            upload option.
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <X size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;