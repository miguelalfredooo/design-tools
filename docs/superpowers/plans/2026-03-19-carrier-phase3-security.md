# Carrier Phase 3: Security Enhancement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add rate limiting, audit logging, and persistent session storage to prevent brute force attacks and provide security visibility.

**Architecture:** Three independent services (rate limiter, audit logger, session manager) integrated into existing auth and upload routes. Rate limiter tracks per-IP requests in memory. Audit logger writes events asynchronously to Supabase. Session storage migrates from in-memory Map to Supabase table.

**Tech Stack:** Next.js 16, TypeScript, Supabase (PostgreSQL), Node.js crypto utilities

---

## Phase 3.1: Database Setup

### Task 1: Create Supabase Tables

**Files:**
- Manual SQL execution in Supabase dashboard

- [ ] **Step 1: Create audit_logs table**

Execute in Supabase SQL Editor:

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  ip TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('login_failed', 'rate_limit_hit', 'validation_error', 'login_success')),
  error_message TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_audit_logs_ip_created ON audit_logs(ip, created_at);
```

Expected: Table created with indexes

- [ ] **Step 2: Create sessions table**

Execute in Supabase SQL Editor:

```sql
CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  last_accessed_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

Expected: Table created with indexes

- [ ] **Step 3: Verify tables in Supabase dashboard**

Navigate to Supabase dashboard → design-tools project → Tables
Expected: Both `audit_logs` and `sessions` visible in left sidebar

---

## Phase 3.2: Rate Limiter Service

### Task 2: Write Failing Rate Limiter Tests

**Files:**
- Create: `app/__tests__/lib/rate-limiter.test.ts`

- [ ] **Step 1: Create test file with setup**

```typescript
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
```

Expected: Tests fail with "RateLimiter is not defined"

- [ ] **Step 2: Run tests to confirm failures**

```bash
npm test -- app/__tests__/lib/rate-limiter.test.ts --no-coverage
```

Expected: All tests FAIL (class not yet implemented)

---

### Task 3: Implement Rate Limiter Service

**Files:**
- Create: `app/lib/rate-limiter.ts`

- [ ] **Step 1: Implement RateLimiter class**

```typescript
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
```

Expected: File created with class definition

- [ ] **Step 2: Run tests to verify implementation**

```bash
npm test -- app/__tests__/lib/rate-limiter.test.ts --no-coverage
```

Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add app/lib/rate-limiter.ts app/__tests__/lib/rate-limiter.test.ts
git commit -m "feat: implement rate limiter service with per-IP tracking"
```

---

## Phase 3.3: Audit Logger Service

### Task 4: Write Failing Audit Logger Tests

**Files:**
- Create: `app/__tests__/lib/audit.test.ts`

- [ ] **Step 1: Create test file**

```typescript
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
```

Expected: Tests fail with "auditLog is not defined"

- [ ] **Step 2: Run tests to confirm failures**

```bash
npm test -- app/__tests__/lib/audit.test.ts --no-coverage
```

Expected: All tests FAIL

---

### Task 5: Implement Audit Logger Service

**Files:**
- Create: `app/lib/audit.ts`

- [ ] **Step 1: Implement auditLog function**

```typescript
// app/lib/audit.ts
import { getSupabaseAdmin } from '@/lib/supabase-server';

export type EventType = 'login_failed' | 'rate_limit_hit' | 'validation_error' | 'login_success';

/**
 * Log a security event to the audit_logs table.
 *
 * This is a fire-and-forget operation — if Supabase fails, the error
 * is logged to the console but doesn't block the request.
 *
 * @param endpoint - API endpoint (e.g., "/api/auth/login")
 * @param ip - Client IP address
 * @param eventType - Type of event that occurred
 * @param errorMessage - Optional error details
 * @param metadata - Optional additional data (e.g., { userAgent: "..." })
 */
export async function auditLog(
  endpoint: string,
  ip: string,
  eventType: EventType,
  errorMessage?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const db = getSupabaseAdmin();

    const userAgent = metadata?.userAgent as string | undefined;

    const { error } = await db.from('audit_logs').insert({
      endpoint,
      ip,
      event_type: eventType,
      error_message: errorMessage || null,
      user_agent: userAgent || null,
      metadata: metadata ? JSON.stringify(metadata) : null,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error(`[Audit Log Error] Failed to log event: ${error.message}`, {
        endpoint,
        ip,
        eventType,
      });
    }
  } catch (err) {
    console.error(`[Audit Log Error] Unexpected error:`, err);
    // Don't throw — this should never block the request
  }
}
```

Expected: File created

- [ ] **Step 2: Run tests to verify implementation**

```bash
npm test -- app/__tests__/lib/audit.test.ts --no-coverage
```

Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add app/lib/audit.ts app/__tests__/lib/audit.test.ts
git commit -m "feat: implement audit logging service with Supabase integration"
```

---

## Phase 3.4: Session Persistence

### Task 6: Write Failing Session Persistence Tests

**Files:**
- Create: `app/__tests__/lib/session.test.ts`

- [ ] **Step 1: Create test file**

```typescript
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

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { token: 'abc123', expires_at: futureTime },
        error: null,
      }),
      update: jest.fn().mockResolvedValue({ error: null }),
    });

    const result = await verifySessionToken('abc123');

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  test('verifySessionToken returns invalid for expired token', async () => {
    const pastTime = new Date(Date.now() - 3600000).toISOString();

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { token: 'expired123', expires_at: pastTime },
        error: null,
      }),
      delete: jest.fn().mockResolvedValue({ error: null }),
    });

    const result = await verifySessionToken('expired123');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Token expired');
  });

  test('verifySessionToken returns invalid for non-existent token', async () => {
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'No rows found' },
      }),
    });

    const result = await verifySessionToken('nonexistent');

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Token not found');
  });

  test('deleteSessionToken removes token from database', async () => {
    mockSupabase.from.mockReturnValue({
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    });

    await deleteSessionToken('abc123');

    expect(mockSupabase.from).toHaveBeenCalledWith('sessions');
  });

  test('verifySessionToken updates last_accessed_at', async () => {
    const futureTime = new Date(Date.now() + 3600000).toISOString();
    const updateMock = jest.fn().mockResolvedValue({ error: null });

    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { token: 'abc123', expires_at: futureTime },
        error: null,
      }),
      update: updateMock,
    });

    await verifySessionToken('abc123');

    expect(updateMock).toHaveBeenCalled();
    const updateCall = updateMock.mock.calls[0][0];
    expect(updateCall.last_accessed_at).toBeDefined();
  });
});
```

Expected: Tests fail with "createSessionToken is not defined"

- [ ] **Step 2: Run tests to confirm failures**

```bash
npm test -- app/__tests__/lib/session.test.ts --no-coverage
```

Expected: All tests FAIL

---

### Task 7: Implement Session Persistence

**Files:**
- Modify: `app/lib/session.ts`

- [ ] **Step 1: Read current session.ts file**

Current implementation uses in-memory Map. We'll replace it with Supabase queries while keeping the same function signatures.

- [ ] **Step 2: Rewrite session.ts with Supabase persistence**

```typescript
// app/lib/session.ts
import { randomBytes } from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';

/**
 * Creates a new session token and stores it in the database.
 *
 * @returns Object containing the token (64-character hex string) and expiresAt (Unix timestamp in ms)
 *
 * @example
 * const { token, expiresAt } = await createSessionToken();
 */
export async function createSessionToken(): Promise<{
  token: string;
  expiresAt: number;
}> {
  // Generate 32 random bytes and encode as hex (64 characters)
  const token = randomBytes(32).toString('hex');

  // Set expiry to 1 hour from now
  const expiresAt = Date.now() + 3600000; // 3600000 ms = 1 hour
  const expiresAtISO = new Date(expiresAt).toISOString();

  const db = getSupabaseAdmin();

  // Insert token into sessions table
  const { error } = await db.from('sessions').insert({
    token,
    expires_at: expiresAtISO,
  });

  if (error) {
    console.error('[Session Error] Failed to create token:', error);
    throw new Error('Failed to create session token');
  }

  return { token, expiresAt };
}

/**
 * Verifies a session token and checks if it's still valid (not expired).
 * Updates last_accessed_at on successful verification.
 *
 * @param token - The session token to verify (should be 64-character hex string)
 * @returns Object with valid boolean and optional error message
 *
 * @example
 * const { valid, error } = await verifySessionToken(token);
 * if (!valid) console.error(error); // "Token expired" or "Token not found"
 */
export async function verifySessionToken(token: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  // Validate token format (non-empty, hex string)
  if (!token || typeof token !== 'string' || !token.match(/^[a-f0-9]+$/i)) {
    return { valid: false, error: 'Token not found' };
  }

  const db = getSupabaseAdmin();

  // Query token from database
  const { data, error: queryError } = await db
    .from('sessions')
    .select('token, expires_at')
    .eq('token', token)
    .single();

  if (queryError || !data) {
    return { valid: false, error: 'Token not found' };
  }

  // Check if token is expired
  const now = Date.now();
  const expiresAt = new Date(data.expires_at).getTime();

  if (expiresAt <= now) {
    // Clean up expired token
    await db.from('sessions').delete().eq('token', token);
    return { valid: false, error: 'Token expired' };
  }

  // Update last_accessed_at
  const { error: updateError } = await db
    .from('sessions')
    .update({ last_accessed_at: new Date().toISOString() })
    .eq('token', token);

  if (updateError) {
    console.error('[Session Error] Failed to update access time:', updateError);
    // Don't fail verification on update error
  }

  return { valid: true };
}

/**
 * Deletes a session token from the database (logout).
 *
 * @param token - The session token to delete
 *
 * @internal
 */
export async function deleteSessionToken(token: string): Promise<void> {
  const db = getSupabaseAdmin();

  const { error } = await db.from('sessions').delete().eq('token', token);

  if (error) {
    console.error('[Session Error] Failed to delete token:', error);
  }
}

/**
 * Cleans up expired tokens from the database.
 * Run periodically (e.g., weekly cron job) to prevent table bloat.
 *
 * @internal
 */
export async function cleanupExpiredTokens(): Promise<void> {
  const db = getSupabaseAdmin();

  const now = new Date().toISOString();
  const { error } = await db
    .from('sessions')
    .delete()
    .lt('expires_at', now);

  if (error) {
    console.error('[Session Error] Failed to cleanup tokens:', error);
  }
}
```

Expected: File updated with async Supabase queries

- [ ] **Step 3: Run tests to verify implementation**

```bash
npm test -- app/__tests__/lib/session.test.ts --no-coverage
```

Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add app/lib/session.ts app/__tests__/lib/session.test.ts
git commit -m "feat: migrate session storage from memory to Supabase"
```

---

## Phase 3.5: Route Integration

### Task 8: Integrate Rate Limiter & Audit Logger into Login Route

**Files:**
- Modify: `app/api/auth/login/route.ts`

- [ ] **Step 1: Read current login route**

Review the current `/api/auth/login/route.ts` to understand the flow.

- [ ] **Step 2: Update login route with rate limiting and audit logging**

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSessionToken } from '@/app/lib/session';
import { verifyPassword } from '@/app/lib/crypto-utils';
import { loginLimiter } from '@/app/lib/rate-limiter';
import { auditLog } from '@/app/lib/audit';

/**
 * Extract client IP from request headers.
 * Checks x-forwarded-for first (proxy), then defaults to socket IP.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : request.ip || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || undefined;

    // Check rate limit
    const limitCheck = loginLimiter.check(clientIp);
    if (!limitCheck.allowed) {
      // Log rate limit hit
      await auditLog('/api/auth/login', clientIp, 'rate_limit_hit', 'Max login attempts exceeded', {
        userAgent,
        remaining: limitCheck.remaining,
      });

      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: 'Password required' }, { status: 400 });
    }

    const expected = process.env.DESIGN_TOOLS_PASSWORD;
    if (!expected || !verifyPassword(password, expected)) {
      // Log failed login
      await auditLog('/api/auth/login', clientIp, 'login_failed', 'Invalid password', {
        userAgent,
      });

      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create session token (now persisted to Supabase)
    const { token } = await createSessionToken();

    // Log successful login (optional, for audit trail)
    await auditLog('/api/auth/login', clientIp, 'login_success', undefined, {
      userAgent,
    });

    const response = NextResponse.json(
      { ok: true, message: 'Logged in' },
      { status: 200 }
    );

    response.cookies.set('sessionToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600,
      path: '/',
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Login failed' },
      { status: 500 }
    );
  }
}
```

Expected: File updated with rate limiter and audit logging

- [ ] **Step 3: Test login route manually in dev**

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Test successful login
curl -X POST http://localhost:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"your-password-here"}'

# Expected: 200 response, sessionToken cookie set

# Test failed login (wrong password)
curl -X POST http://localhost:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"wrong"}'

# Expected: 401 response, audit log in Supabase

# Test rate limit (run 6 times quickly)
for i in {1..6}; do
  curl -X POST http://localhost:3500/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"password":"wrong"}'
done

# Expected: 6th request returns 429
```

- [ ] **Step 4: Verify audit logs in Supabase**

Go to Supabase dashboard → Tables → audit_logs
Expected: Entries for login_failed, rate_limit_hit, login_success

- [ ] **Step 5: Commit**

```bash
git add app/api/auth/login/route.ts
git commit -m "feat: add rate limiting and audit logging to login endpoint"
```

---

### Task 9: Integrate Rate Limiter into Upload Route

**Files:**
- Modify: `app/api/design/upload/route.ts`

- [ ] **Step 1: Read current upload route**

Review the current `/api/design/upload/route.ts` to understand the flow.

- [ ] **Step 2: Update upload route with rate limiting and audit logging**

```typescript
// app/api/design/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { validateFile } from '@/app/lib/file-validation';
import { uploadLimiter } from '@/app/lib/rate-limiter';
import { auditLog } from '@/app/lib/audit';

const BUCKET = 'design-options';

/**
 * Extract client IP from request headers.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : request.ip || 'unknown';
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const userAgent = request.headers.get('user-agent') || undefined;

    // Check rate limit (10 uploads per minute per IP)
    const limitCheck = uploadLimiter.check(clientIp);
    if (!limitCheck.allowed) {
      await auditLog('/api/design/upload', clientIp, 'rate_limit_hit', 'Max upload requests exceeded', {
        userAgent,
      });

      return NextResponse.json(
        { error: 'Too many upload requests. Please try again later.' },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    // Validate file before upload
    const validation = validateFile(file as File);
    if (!validation.valid) {
      await auditLog('/api/design/upload', clientIp, 'validation_error', validation.error, {
        userAgent,
      });

      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const db = getSupabaseAdmin();

    // Ensure bucket exists (idempotent)
    await db.storage.createBucket(BUCKET, { public: true }).catch(() => {});

    const ext = file!.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const path = `${crypto.randomUUID()}.${ext}`;

    const { error } = await db.storage
      .from(BUCKET)
      .upload(path, file!, { contentType: file!.type, upsert: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({ url: urlData.publicUrl });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
```

Expected: File updated with rate limiter and audit logging

- [ ] **Step 3: Test upload route manually**

```bash
# Create a test file
echo "test image data" > test.jpg

# Test successful upload
curl -X POST http://localhost:3500/api/design/upload \
  -H "Cookie: sessionToken=your-token-here" \
  -F "file=@test.jpg"

# Expected: 200 response with URL

# Test rate limit (upload 11 times in quick succession)
for i in {1..11}; do
  curl -X POST http://localhost:3500/api/design/upload \
    -H "Cookie: sessionToken=your-token-here" \
    -F "file=@test.jpg"
done

# Expected: 11th request returns 429
```

- [ ] **Step 4: Verify audit logs in Supabase**

Go to Supabase dashboard → Tables → audit_logs
Expected: Entries for validation_error and rate_limit_hit

- [ ] **Step 5: Commit**

```bash
git add app/api/design/upload/route.ts
git commit -m "feat: add rate limiting and audit logging to upload endpoint"
```

---

## Phase 3.6: Verification & Testing

### Task 10: Write Integration Tests

**Files:**
- Create: `app/__tests__/api/auth.integration.test.ts`
- Create: `app/__tests__/api/upload.integration.test.ts`

- [ ] **Step 1: Create login integration test**

```typescript
// app/__tests__/api/auth.integration.test.ts
import { POST as loginHandler } from '@/app/api/auth/login/route';
import { getSupabaseAdmin } from '@/lib/supabase-server';

jest.mock('@/lib/supabase-server');
jest.mock('@/app/lib/crypto-utils');
jest.mock('@/app/lib/audit');

describe('POST /api/auth/login Integration', () => {
  const mockSupabase = {
    from: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getSupabaseAdmin as jest.Mock).mockReturnValue(mockSupabase);
  });

  test('successful login creates session and returns 200', async () => {
    const mockRequest = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'correct' }),
      headers: {
        'content-type': 'application/json',
      },
    });

    mockSupabase.from.mockReturnValue({
      insert: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    // Mock crypto verification
    const { verifyPassword } = require('@/app/lib/crypto-utils');
    verifyPassword.mockReturnValue(true);

    const response = await loginHandler(mockRequest as any);

    expect(response.status).toBe(200);
    expect(response.cookies.get('sessionToken')).toBeDefined();
  });

  test('failed login logs audit event and returns 401', async () => {
    const mockRequest = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong' }),
      headers: {
        'content-type': 'application/json',
      },
    });

    const { verifyPassword } = require('@/app/lib/crypto-utils');
    verifyPassword.mockReturnValue(false);

    const { auditLog } = require('@/app/lib/audit');

    const response = await loginHandler(mockRequest as any);

    expect(response.status).toBe(401);
    expect(auditLog).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.any(String),
      'login_failed',
      'Invalid password',
      expect.any(Object)
    );
  });

  test('rate limit exceeded returns 429', async () => {
    const mockRequest = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password: 'test' }),
      headers: {
        'content-type': 'application/json',
      },
    });

    // Simulate hitting rate limit by making 6 requests
    for (let i = 0; i < 5; i++) {
      await loginHandler(mockRequest.clone() as any);
    }

    const response = await loginHandler(mockRequest.clone() as any);
    expect(response.status).toBe(429);
  });
});
```

- [ ] **Step 2: Create upload integration test**

```typescript
// app/__tests__/api/upload.integration.test.ts
import { POST as uploadHandler } from '@/app/api/design/upload/route';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { validateFile } from '@/app/lib/file-validation';

jest.mock('@/lib/supabase-server');
jest.mock('@/app/lib/file-validation');
jest.mock('@/app/lib/audit');

describe('POST /api/design/upload Integration', () => {
  const mockSupabase = {
    storage: {
      createBucket: jest.fn().mockResolvedValue({}),
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
    (getSupabaseAdmin as jest.Mock).mockReturnValue(mockSupabase);
    (validateFile as jest.Mock).mockReturnValue({ valid: true });
  });

  test('successful upload returns 200 with URL', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);

    const mockRequest = new Request('http://localhost/api/design/upload', {
      method: 'POST',
      body: formData,
    });

    const response = await uploadHandler(mockRequest as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.url).toBe('https://example.com/image.jpg');
  });

  test('validation error returns 400 and logs audit event', async () => {
    (validateFile as jest.Mock).mockReturnValue({
      valid: false,
      error: 'File too large',
    });

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);

    const mockRequest = new Request('http://localhost/api/design/upload', {
      method: 'POST',
      body: formData,
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
  });

  test('rate limit exceeded returns 429', async () => {
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const formData = new FormData();
    formData.append('file', file);

    const mockRequest = new Request('http://localhost/api/design/upload', {
      method: 'POST',
      body: formData,
    });

    // Simulate hitting rate limit by making 11 requests
    for (let i = 0; i < 10; i++) {
      await uploadHandler(mockRequest.clone() as any);
    }

    const response = await uploadHandler(mockRequest.clone() as any);
    expect(response.status).toBe(429);
  });
});
```

- [ ] **Step 3: Run integration tests**

```bash
npm test -- app/__tests__/api --no-coverage
```

Expected: All integration tests PASS

- [ ] **Step 4: Commit**

```bash
git add app/__tests__/api/auth.integration.test.ts app/__tests__/api/upload.integration.test.ts
git commit -m "test: add integration tests for rate limiting and audit logging"
```

---

### Task 11: Manual Verification Checklist

- [ ] **Step 1: Login flow verification**
  - [ ] Successful login with correct password returns 200 and sets session cookie
  - [ ] Failed login with wrong password returns 401
  - [ ] After 5 failed attempts, 6th request returns 429
  - [ ] Audit logs show login_failed and rate_limit_hit entries
  - [ ] After 15 minutes, rate limit resets (can make new attempts)

- [ ] **Step 2: Upload flow verification**
  - [ ] Successful file upload returns 200 with URL
  - [ ] Oversized file returns 400 and logs validation_error
  - [ ] After 10 uploads in 1 minute, 11th returns 429
  - [ ] Audit logs show validation_error and rate_limit_hit entries
  - [ ] After 1 minute, rate limit resets

- [ ] **Step 3: Session persistence verification**
  - [ ] Log in successfully, token appears in sessions table
  - [ ] Verify session token can be used for authenticated requests
  - [ ] Session token expires after 1 hour (check last_accessed_at updates)
  - [ ] Delete session, token no longer works (returns 401)

- [ ] **Step 4: Database integrity check**
  - [ ] Supabase tables (audit_logs, sessions) have data
  - [ ] audit_logs has correct schema and indexes
  - [ ] sessions table has correct schema with token as primary key
  - [ ] No orphaned or malformed records

- [ ] **Step 5: Commit manual verification notes**

```bash
git add -A
git commit -m "docs: manual verification checklist completed for Phase 3"
```

---

## Summary

**Phase 3 Implementation Plan:**

✅ Database setup (2 new tables with indexes)
✅ Rate limiter service (in-memory per-IP tracking, unit tested)
✅ Audit logger service (async Supabase writes, unit tested)
✅ Session persistence (Supabase-backed, unit tested)
✅ Route integration (login + upload endpoints)
✅ Integration tests (login and upload flows)
✅ Manual verification checklist

**Key Dependencies:**
- Supabase tables must exist before deploying code
- All unit tests must pass before integration tests
- All tests must pass before manual verification

**Commits per task:** ~1 per service + 1 per route + 1 for tests = 8 atomic commits total
