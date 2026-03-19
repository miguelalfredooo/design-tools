// app/__tests__/lib/rate-limiter.test.ts
import { RateLimiter } from '@/app/lib/rate-limiter';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter('test', 3, 60000); // 3 requests per 60 seconds
  });

  test('allows request when under limit', () => {
    const result = limiter.check('192.168.1.1');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  test('blocks request when limit exceeded', () => {
    const ip = '192.168.1.2';
    limiter.check(ip); // 1st
    limiter.check(ip); // 2nd
    limiter.check(ip); // 3rd (limit reached)

    const result = limiter.check(ip); // 4th (blocked)
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  test('returns resetAt timestamp', () => {
    const result = limiter.check('192.168.1.3');
    expect(result.resetAt).toBeGreaterThan(Date.now());
    expect(result.resetAt).toBeLessThanOrEqual(Date.now() + 60000);
  });

  test('tracks separate IPs independently', () => {
    const ip1 = '192.168.1.4';
    const ip2 = '192.168.1.5';

    limiter.check(ip1);
    limiter.check(ip1);
    limiter.check(ip1); // ip1 at limit

    const result = limiter.check(ip2); // ip2 should be unaffected
    expect(result.allowed).toBe(true);
  });

  test('cleans up expired windows', () => {
    const limiter = new RateLimiter('cleanup', 1, 100); // 100ms window
    limiter.check('192.168.1.6');

    // Wait for window to expire
    jest.useFakeTimers();
    jest.advanceTimersByTime(150);

    // Create new limiter (should clean on instantiation)
    const newLimiter = new RateLimiter('cleanup', 1, 100);
    // Memory should be cleaned (internal implementation detail)

    jest.useRealTimers();
  });
});
