/**
 * Cryptographic utilities for secure password comparison.
 * Prevents timing attacks that leak password information via response time.
 */

import { timingSafeEqual, createHmac } from "crypto";

/**
 * Compares two strings in constant time using Node.js crypto.timingSafeEqual.
 * Prevents timing attacks: comparison takes same time regardless of mismatch position.
 *
 * Uses HMAC-SHA256 to create same-length buffers (32 bytes) before comparison,
 * ensuring constant-time protection for both content and length differences.
 *
 * @param input - User-provided password
 * @param expected - Expected password (from env or database)
 * @returns true if passwords match, false otherwise
 *
 * @example
 * const isValid = verifyPassword(userPassword, process.env.PASSWORD);
 * if (!isValid) return 401;
 */
export function verifyPassword(input: string, expected: string): boolean {
  // Early return for empty strings (both must be non-empty)
  if (!input || !expected) return false;

  // Use HMAC to create same-length hashes for constant-time comparison
  // This prevents timing attacks on both content and length differences
  // We use a fixed key since we're just comparing, not authenticating
  const hmacKey = "timing-safe-compare";

  try {
    const inputHash = createHmac("sha256", hmacKey)
      .update(input, "utf-8")
      .digest();

    const expectedHash = createHmac("sha256", hmacKey)
      .update(expected, "utf-8")
      .digest();

    // Both hashes are 32 bytes (256 bits), so timingSafeEqual
    // takes constant time regardless of input length
    return timingSafeEqual(inputHash, expectedHash);
  } catch {
    // Should not happen, but handle gracefully
    return false;
  }
}
