// app/__tests__/api/auth.integration.test.ts
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { loginLimiter } from '@/app/lib/rate-limiter';
import { createSessionToken } from '@/app/lib/session';

jest.mock('@/lib/supabase-server');
jest.mock('@/app/lib/crypto-utils');
jest.mock('@/app/lib/audit');
jest.mock('@/app/lib/session');

describe('POST /api/auth/login Integration', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear rate limiter state for fresh tests
    const limiter = loginLimiter as Record<string, any>;
    limiter.store?.clear?.();
    const mockGetSupabase = getSupabaseAdmin as jest.Mock;
    mockGetSupabase.mockReturnValue(mockSupabase);
    const mockCreateToken = createSessionToken as jest.Mock;
    mockCreateToken.mockResolvedValue({
      token: 'test-session-token-123',
    });
    // Set up environment variable
    process.env.DESIGN_TOOLS_PASSWORD = 'correct-password';
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    const limiter = loginLimiter as Record<string, any>;
    limiter.store?.clear?.();
  });

  test('successful login creates session and returns 200', async () => {
    const mockRequest = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'correct-password' }),
      headers: {
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0',
      },
    });

    // Mock crypto verification
    const { verifyPassword } = require('@/app/lib/crypto-utils');
    verifyPassword.mockReturnValue(true);

    const response = await loginHandler(mockRequest);

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('sessionToken=test-session-token-123');

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.message).toBe('Logged in');
  });

  test('failed login logs audit event and returns 401', async () => {
    const mockRequest = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong-password' }),
      headers: {
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0',
      },
    });

    const { verifyPassword } = require('@/app/lib/crypto-utils');
    verifyPassword.mockReturnValue(false);

    const { auditLog } = require('@/app/lib/audit');

    const response = await loginHandler(mockRequest);

    expect(response.status).toBe(401);
    expect(auditLog).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.any(String),
      'login_failed',
      'Invalid password',
      expect.any(Object)
    );

    const body = await response.json();
    expect(body.error).toBe('Invalid password');
  });

  test('rate limit exceeded returns 429', async () => {
    const { verifyPassword } = require('@/app/lib/crypto-utils');
    verifyPassword.mockReturnValue(true);

    const { auditLog } = require('@/app/lib/audit');

    const testIp = '192.168.1.100';

    // Make 5 successful requests (at limit)
    for (let i = 0; i < 5; i++) {
      const mockRequest = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ password: 'correct-password' }),
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': testIp,
        },
      });

      const response = await loginHandler(mockRequest);
      expect(response.status).toBe(200);
    }

    // 6th request should be rate limited
    const limitedRequest = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'correct-password' }),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': testIp,
      },
    });

    const response = await loginHandler(limitedRequest);
    expect(response.status).toBe(429);

    // Check that rate limit hit was logged
    expect(auditLog).toHaveBeenCalledWith(
      '/api/auth/login',
      testIp,
      'rate_limit_hit',
      'Max login attempts exceeded',
      expect.any(Object)
    );
  });

  test('missing password returns 400', async () => {
    const mockRequest = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = await loginHandler(mockRequest);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Password required');
  });

  test('successful login creates audit trail', async () => {
    const mockRequest = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'correct-password' }),
      headers: {
        'content-type': 'application/json',
        'user-agent': 'Mozilla/5.0 Test',
      },
    });

    const { verifyPassword } = require('@/app/lib/crypto-utils');
    verifyPassword.mockReturnValue(true);

    const { auditLog } = require('@/app/lib/audit');

    const response = await loginHandler(mockRequest);

    expect(response.status).toBe(200);
    expect(auditLog).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.any(String),
      'login_success',
      undefined,
      expect.objectContaining({
        userAgent: 'Mozilla/5.0 Test',
      })
    );
  });

  test('extracts client IP from x-forwarded-for header', async () => {
    const mockRequest = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'correct-password' }),
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.42, 198.51.100.1',
      },
    });

    const { verifyPassword } = require('@/app/lib/crypto-utils');
    verifyPassword.mockReturnValue(true);

    const { auditLog } = require('@/app/lib/audit');

    await loginHandler(mockRequest as any);

    // Should extract first IP from comma-separated list
    expect(auditLog).toHaveBeenCalledWith(
      '/api/auth/login',
      '203.0.113.42',
      'login_success',
      undefined,
      expect.any(Object)
    );
  });
});
