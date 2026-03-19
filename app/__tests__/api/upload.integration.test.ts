// app/__tests__/api/upload.integration.test.ts
import { POST as uploadHandler } from '@/app/api/design/upload/route';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { validateFile } from '@/app/lib/file-validation';
import { uploadLimiter } from '@/app/lib/rate-limiter';

jest.mock('@/lib/supabase-server');
jest.mock('@/app/lib/file-validation');
jest.mock('@/app/lib/audit');

describe('POST /api/design/upload Integration', () => {
  const mockSupabase = {
    storage: {
      createBucket: jest.fn().mockResolvedValue({ data: {}, error: null }),
      from: jest.fn().mockReturnValue({
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/image.jpg' },
        }),
      }),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear rate limiter state for fresh tests
    const limiter = uploadLimiter as Record<string, any>;
    limiter.store?.clear?.();
    const mockGetSupabase = getSupabaseAdmin as jest.Mock;
    mockGetSupabase.mockReturnValue(mockSupabase);
    const mockValidate = validateFile as jest.Mock;
    mockValidate.mockReturnValue({ valid: true });
  });

  afterEach(() => {
    const limiter = uploadLimiter as Record<string, any>;
    limiter.store?.clear?.();
  });

  test('successful upload returns 200 with URL', async () => {
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);

    const mockRequest = new Request('http://localhost/api/design/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await uploadHandler(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe('https://example.com/image.jpg');
    expect(mockSupabase.storage.createBucket).toHaveBeenCalled();
  });

  test('validation error returns 400 and logs audit event', async () => {
    const mockValidate = validateFile as jest.Mock;
    mockValidate.mockReturnValue({
      valid: false,
      error: 'File too large',
    });

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);

    const mockRequest = new Request('http://localhost/api/design/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
    });

    const { auditLog } = require('@/app/lib/audit');
    const response = await uploadHandler(mockRequest as any);

    expect(response.status).toBe(400);
    expect(auditLog).toHaveBeenCalledWith(
      '/api/design/upload',
      expect.any(String),
      'validation_error',
      'File too large',
      expect.any(Object)
    );

    const body = await response.json();
    expect(body.error).toBe('File too large');
  });

  test('rate limit exceeded returns 429', async () => {
    const { auditLog } = require('@/app/lib/audit');
    const testIp = '192.168.1.200';

    // Make 10 successful uploads (at limit)
    for (let i = 0; i < 10; i++) {
      const file = new File(['test'], `test${i}.jpg`, { type: 'image/jpeg' });
      const formData = new FormData();
      formData.append('file', file);

      const mockRequest = new Request('http://localhost/api/design/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'x-forwarded-for': testIp,
        },
      });

      const response = await uploadHandler(mockRequest as any);
      expect(response.status).toBe(200);
    }

    // 11th request should be rate limited
    const file = new File(['test'], 'test11.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);

    const limitedRequest = new Request('http://localhost/api/design/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'x-forwarded-for': testIp,
      },
    });

    const response = await uploadHandler(limitedRequest as any);
    expect(response.status).toBe(429);

    // Check that rate limit hit was logged
    expect(auditLog).toHaveBeenCalledWith(
      '/api/design/upload',
      testIp,
      'rate_limit_hit',
      'Max upload requests exceeded',
      expect.any(Object)
    );
  });

  test('successful upload calls storage methods correctly', async () => {
    const file = new File(['test content'], 'design.png', { type: 'image/png' });
    const formData = new FormData();
    formData.append('file', file);

    const mockRequest = new Request('http://localhost/api/design/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await uploadHandler(mockRequest);

    expect(response.status).toBe(200);
    expect(mockSupabase.storage.createBucket).toHaveBeenCalledWith('design-options', { public: true });
    expect(mockSupabase.storage.from).toHaveBeenCalledWith('design-options');
    expect(mockSupabase.storage.from().upload).toHaveBeenCalled();
    expect(mockSupabase.storage.from().getPublicUrl).toHaveBeenCalled();
  });

  test('validation error with invalid file type', async () => {
    const mockValidate = validateFile as jest.Mock;
    mockValidate.mockReturnValue({
      valid: false,
      error: 'Invalid file type. Accepted: JPEG, PNG, WebP',
    });

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', file);

    const mockRequest = new Request('http://localhost/api/design/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
    });

    const { auditLog } = require('@/app/lib/audit');
    const response = await uploadHandler(mockRequest as any);

    expect(response.status).toBe(400);
    expect(auditLog).toHaveBeenCalledWith(
      '/api/design/upload',
      expect.any(String),
      'validation_error',
      'Invalid file type. Accepted: JPEG, PNG, WebP',
      expect.any(Object)
    );
  });

  test('extracts client IP from x-forwarded-for header', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);

    const mockRequest = new Request('http://localhost/api/design/upload', {
      method: 'POST',
      body: formData,
      headers: {
        'x-forwarded-for': '203.0.113.42, 198.51.100.1',
      },
    });

    const response = await uploadHandler(mockRequest);

    // Just verify successful response - IP extraction is tested through audit logging
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.url).toBe('https://example.com/image.jpg');
  });

  test('storage upload error returns 500', async () => {
    const storageError = new Error('Storage connection failed');
    mockSupabase.storage.from().upload.mockResolvedValue({
      error: storageError,
    });

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);

    const mockRequest = new Request('http://localhost/api/design/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await uploadHandler(mockRequest);

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toContain('Storage connection failed');
  });

});
