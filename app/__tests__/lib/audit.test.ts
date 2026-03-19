// app/__tests__/lib/audit.test.ts
import { auditLog } from '@/app/lib/audit';
import { getSupabaseAdmin } from '@/lib/supabase-server';

jest.mock('@/lib/supabase-server');

describe('Audit Logger', () => {
  const mockSupabase = {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockResolvedValue({ error: null }),
    }),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getSupabaseAdmin as jest.Mock).mockReturnValue(mockSupabase);
  });

  test('logs failed login attempt', async () => {
    await auditLog(
      '/api/auth/login',
      '192.168.1.1',
      'login_failed',
      'Invalid password'
    );

    expect(mockSupabase.from).toHaveBeenCalledWith('audit_logs');
    expect(mockSupabase.from().insert).toHaveBeenCalled();

    const insertCall = mockSupabase.from().insert.mock.calls[0][0];
    expect(insertCall.endpoint).toBe('/api/auth/login');
    expect(insertCall.ip).toBe('192.168.1.1');
    expect(insertCall.event_type).toBe('login_failed');
    expect(insertCall.error_message).toBe('Invalid password');
  });

  test('logs rate limit hit', async () => {
    await auditLog(
      '/api/auth/login',
      '192.168.1.2',
      'rate_limit_hit',
      '5 attempts exceeded'
    );

    const insertCall = mockSupabase.from().insert.mock.calls[0][0];
    expect(insertCall.event_type).toBe('rate_limit_hit');
  });

  test('logs validation error', async () => {
    await auditLog(
      '/api/design/upload',
      '192.168.1.3',
      'validation_error',
      'File size exceeds 10MB'
    );

    const insertCall = mockSupabase.from().insert.mock.calls[0][0];
    expect(insertCall.endpoint).toBe('/api/design/upload');
    expect(insertCall.event_type).toBe('validation_error');
  });

  test('includes user agent in log', async () => {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

    await auditLog(
      '/api/auth/login',
      '192.168.1.4',
      'login_success',
      undefined,
      { userAgent }
    );

    const insertCall = mockSupabase.from().insert.mock.calls[0][0];
    expect(insertCall.user_agent).toBe(userAgent);
  });

  test('handles Supabase errors gracefully', async () => {
    mockSupabase.from().insert.mockResolvedValueOnce({
      error: { message: 'Connection timeout' },
    });

    // Should not throw
    await expect(
      auditLog('/api/auth/login', '192.168.1.5', 'login_failed', 'Error')
    ).resolves.not.toThrow();
  });

  test('includes timestamp in log', async () => {
    const beforeTime = Date.now();
    await auditLog('/api/auth/login', '192.168.1.6', 'login_success');
    const afterTime = Date.now();

    const insertCall = mockSupabase.from().insert.mock.calls[0][0];
    const logTime = new Date(insertCall.created_at).getTime();

    expect(logTime).toBeGreaterThanOrEqual(beforeTime);
    expect(logTime).toBeLessThanOrEqual(afterTime);
  });
});
