// app/lib/rate-limiter.ts

/**
 * In-memory per-IP rate limiter with configurable time windows.
 *
 * Tracks request counts per IP address and enforces limits within time windows.
 * Expired windows are automatically cleaned up.
 */
export class RateLimiter {
  private key: string;
  private limit: number;
  private windowMs: number;
  private store: Map<string, { count: number; resetAt: number }>;

  /**
   * Create a new rate limiter.
   *
   * @param key - Identifier for this limiter (e.g., "login", "upload")
   * @param limit - Max requests allowed per window
   * @param windowMs - Time window in milliseconds
   */
  constructor(key: string, limit: number, windowMs: number) {
    this.key = key;
    this.limit = limit;
    this.windowMs = windowMs;
    this.store = new Map();
    this.cleanup();
  }

  /**
   * Check if an IP is allowed to make a request.
   *
   * @param ip - IP address to check
   * @returns Object with allowed status, remaining requests, and reset time
   */
  check(ip: string): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  } {
    const now = Date.now();
    const entry = this.store.get(ip);

    // If no entry or window expired, start fresh
    if (!entry || now >= entry.resetAt) {
      this.store.set(ip, { count: 1, resetAt: now + this.windowMs });
      return {
        allowed: true,
        remaining: this.limit - 1,
        resetAt: now + this.windowMs,
      };
    }

    // Increment count for existing window
    entry.count += 1;
    const allowed = entry.count <= this.limit;
    const remaining = Math.max(0, this.limit - entry.count);

    return {
      allowed,
      remaining,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Clean up expired windows to prevent memory leaks.
   * Called automatically on instantiation.
   *
   * @internal
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [ip, entry] of this.store.entries()) {
      if (now >= entry.resetAt) {
        this.store.delete(ip);
      }
    }
  }
}

/**
 * Singleton instances for login and upload limiting.
 */
export const loginLimiter = new RateLimiter('login', 5, 900000); // 5 attempts per 15 min
export const uploadLimiter = new RateLimiter('upload', 10, 60000); // 10 requests per min
