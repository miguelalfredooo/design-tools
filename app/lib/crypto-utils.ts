/**
 * Cryptographic utilities for secure password comparison.
 * Prevents timing attacks that leak password information via response time.
 */

import { timingSafeEqual } from "crypto";

/**
 * Compares two strings in constant time using Node.js crypto.timingSafeEqual.
 * Prevents timing attacks: comparison takes same time regardless of mismatch position.
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

  // Length mismatch: still compare to maintain constant time
  // timingSafeEqual requires same-length buffers, so we check length first
  // but then perform a dummy comparison to avoid timing leaks on length
  if (input.length !== expected.length) {
    // Compare two dummy buffers of expected length (constant time)
    try {
      timingSafeEqual(
        Buffer.alloc(expected.length),
        Buffer.alloc(expected.length)
      );
    } catch {
      // timingSafeEqual throws if buffers don't match (which they don't)
      // We catch and ignore to maintain constant time
    }
    return false;
  }

  // Both strings are non-empty and same length: compare in constant time
  try {
    return timingSafeEqual(
      Buffer.from(input, "utf-8"),
      Buffer.from(expected, "utf-8")
    );
  } catch {
    // Should not happen if lengths are equal, but handle gracefully
    return false;
  }
}
