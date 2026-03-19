// app/__tests__/lib/session.test.ts
import {
  createSessionToken,
  verifySessionToken,
  deleteSessionToken,
} from '@/app/lib/session';
import { getSupabaseAdmin } from '@/lib/supabase-server';

jest.mock('@/lib/supabase-server');

describe('Session Management', () => {
  const mockSupabase = {
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getSupabaseAdmin as jest.Mock).mockReturnValue(mockSupabase);
  });

  test('createSessionToken generates and stores token', async () => {
    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    const result = await createSessionToken();

    expect(result.token).toBeDefined();
    expect(result.token.length).toBe(64); // 32 bytes → 64 hex chars
    expect(result.expiresAt).toBeGreaterThan(Date.now());
    expect(mockSupabase.from).toHaveBeenCalledWith('sessions');
  });

  test('verifySessionToken returns valid for existing unexpired token', async () => {
    const futureTime = new Date(Date.now() + 3600000).toISOString();
    const validToken = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { token: validToken, expires_at: futureTime },
        error: null,
      }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });

    const result = await verifySessionToken(validToken);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('verifySessionToken returns invalid for expired token', async () => {
    const pastTime = new Date(Date.now() - 3600000).toISOString();
    const expiredToken = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';

    // First call to from() is for the select query
    // Second call to from() is for the delete query
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'sessions') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { token: expiredToken, expires_at: pastTime },
            error: null,
          }),
          delete: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
    });

    const result = await verifySessionToken(expiredToken);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Token expired');
  });

  test('verifySessionToken returns invalid for non-existent token', async () => {
    const nonexistentToken = 'cafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe';

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'No rows found' },
      }),
    });

    const result = await verifySessionToken(nonexistentToken);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Token not found');
  });

  test('deleteSessionToken removes token from database', async () => {
    const validToken = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';

    mockSupabase.from.mockReturnValue({
      delete: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    });

    await deleteSessionToken(validToken);

    expect(mockSupabase.from).toHaveBeenCalledWith('sessions');
  });

  test('verifySessionToken updates last_accessed_at', async () => {
    const futureTime = new Date(Date.now() + 3600000).toISOString();
    const validToken = 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const updateMock = jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { token: validToken, expires_at: futureTime },
        error: null,
      }),
      update: updateMock,
    });

    await verifySessionToken(validToken);

    expect(updateMock).toHaveBeenCalled();
    const updateCall = updateMock.mock.calls[0][0];
    expect(updateCall.last_accessed_at).toBeDefined();
  });
});
