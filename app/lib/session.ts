import { randomBytes } from "crypto";

/**
 * In-memory token store mapping token string to expiry timestamp.
 * In production, this would be replaced with a database or Redis.
 */
const tokenStore = new Map<string, { expiresAt: number }>();

/**
 * Creates a new session token with a 1-hour expiry.
 *
 * @returns Object containing the token (64-character hex string) and expiresAt (Unix timestamp in ms)
 *
 * @example
 * const { token, expiresAt } = createSessionToken();
 * // token: "a3f9b2c1e5d8f4a7b2c1e5d8f4a7b2c1e5d8f4a7b2c1e5d8f4a7b2c1e5d8f4"
 * // expiresAt: 1710866400000
 */
export function createSessionToken(): { token: string; expiresAt: number } {
  // Generate 32 random bytes and encode as hex (64 characters)
  const token = randomBytes(32).toString("hex");

  // Set expiry to 1 hour from now
  const expiresAt = Date.now() + 3600000; // 3600000 ms = 1 hour

  // Store token in memory
  tokenStore.set(token, { expiresAt });

  return { token, expiresAt };
}

/**
 * Verifies a session token and checks if it's still valid (not expired).
 *
 * @param token - The session token to verify (should be 64-character hex string)
 * @returns Object with valid boolean and optional error message
 *
 * @example
 * const { valid, error } = verifySessionToken(token);
 * if (!valid) console.error(error); // "Token expired" or "Token not found"
 */
export function verifySessionToken(token: string): {
  valid: boolean;
  error?: string;
} {
  // Validate token format (non-empty, hex string)
  if (!token || typeof token !== "string" || !token.match(/^[a-f0-9]+$/i)) {
    return { valid: false, error: "Token not found" };
  }

  // Check if token exists in store
  const stored = tokenStore.get(token);
  if (!stored) {
    return { valid: false, error: "Token not found" };
  }

  // Check if token is expired
  const now = Date.now();
  if (stored.expiresAt <= now) {
    // Clean up expired token
    tokenStore.delete(token);
    return { valid: false, error: "Token expired" };
  }

  return { valid: true };
}

/**
 * Cleans up expired tokens from the store.
 * Called periodically to prevent memory leaks.
 *
 * @internal
 */
export function cleanupExpiredTokens(): void {
  const now = Date.now();
  for (const [token, { expiresAt }] of tokenStore.entries()) {
    if (expiresAt <= now) {
      tokenStore.delete(token);
    }
  }
}

/**
 * Internal function to delete a token from the store.
 * Used during logout.
 *
 * @internal
 */
export function deleteSessionToken(token: string): void {
  tokenStore.delete(token);
}
