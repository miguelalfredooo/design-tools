/**
 * File validation utilities for design preview images.
 * Prevents malicious uploads: oversized files, wrong MIME types, suspicious extensions.
 */

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a file before upload.
 * Checks: MIME type, file size, extension safety, filename safety.
 */
export function validateFile(file: File): FileValidationResult {
  // Check file exists
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  // Check MIME type
  if (!ALLOWED_MIMES.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Accepted: JPEG, PNG, WebP",
    };
  }

  // Check file size (15 MB max)
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File exceeds 15 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
    };
  }

  // Extract extension and validate it matches MIME type
  const ext = file.name.split(".").pop()?.toLowerCase();
  const mimeToExt: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
  };

  const validExts = mimeToExt[file.type] || [];
  if (!ext) {
    return {
      valid: false,
      error: "File must have an extension (e.g., .jpg, .png, .webp)",
    };
  }
  if (!validExts.includes(ext)) {
    return {
      valid: false,
      error: `File extension .${ext} does not match file type ${file.type}`,
    };
  }

  // Check for suspicious patterns (double extensions like .php.jpg, .exe.jpg, etc.)
  // Only flag if the base filename (before last extension) ends with a known dangerous extension
  const baseName = file.name.slice(0, -(ext?.length || 0) - 1);

  // Reject if basename is empty (file named only ".ext")
  if (!baseName || baseName.length === 0) {
    return { valid: false, error: "Invalid filename" };
  }

  // Check for suspicious nested extensions
  const suspiciousExtensions = ["php", "exe", "sh", "bat", "cmd", "scr", "vbs"];
  if (baseName.includes(".")) {
    const innerExt = baseName.split(".").pop()?.toLowerCase();
    if (innerExt && suspiciousExtensions.includes(innerExt)) {
      return { valid: false, error: "File contains suspicious extension pattern (e.g., .php.jpg)" };
    }
  }

  // Reject null bytes in filename
  if (file.name.includes("\0")) {
    return { valid: false, error: "Invalid filename: contains null bytes" };
  }

  return { valid: true };
}
