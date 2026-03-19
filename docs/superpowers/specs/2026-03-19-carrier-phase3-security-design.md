# Phase 3: Security Enhancement Design Spec

**Date:** 2026-03-19
**Project:** Carrier (design-tools)
**Phase:** 3 — Security Enhancement
**Status:** Design Approved

---

## Overview

Phase 3 adds three security features to Carrier:
1. **Rate limiting** — Prevent brute force attacks on `/api/auth/login` and `/api/design/upload`
2. **Audit logging** — Log failed authentication attempts, validation errors, and rate limit violations
3. **Session persistence** — Migrate from in-memory token storage to Supabase

These changes protect against common attacks while maintaining the tool's simplicity and single-user operation model.

---

## Goals

- Prevent brute force password guessing on login endpoint
- Prevent DoS-style repeated file uploads
- Create audit trail for security troubleshooting
- Enable multi-instance deployments in the future (via persistent sessions)
- Maintain backward compatibility (users stay logged in, seamless upgrade)

---

## Architecture

### Component Overview

```
Request Flow:
  Incoming Request
    ↓
  Rate Limiter Middleware (check IP + threshold)
    ↓ allowed
  Route Handler (auth/upload)
    ↓
  Audit Logger Service (async write to Supabase)
    ↓
  Response
```

### Three Services

#### 1. Rate Limiter (`lib/rate-limiter.ts`)

In-memory per-IP request tracking with configurable time windows.

**Interface:**
```typescript
class RateLimiter {
  constructor(key: string, limit: number, windowMs: number)
  check(ip: string): { allowed: boolean; remaining: number; resetAt: number }
}
```

**Configuration:**
- **Login endpoint:** 5 failed attempts per 15 minutes per IP
- **Upload endpoint:** 10 requests per minute per IP

**Implementation details:**
- Tracks requests in memory (fast, no database roundtrip)
- Auto-cleans expired windows on instantiation
- Returns remaining count and reset timestamp for client feedback
- IP extraction: `x-forwarded-for` header (from proxies) with fallback

**Why in-memory?** Fast (sub-millisecond checks) and state loss on restart is acceptable for a single-user tool. If scaling to multi-instance, Redis can be added later.

#### 2. Audit Logger (`lib/audit.ts`)

Asynchronous logging of security events to Supabase.

**Interface:**
```typescript
function auditLog(
  endpoint: string,
  ip: string,
  eventType: "login_failed" | "rate_limit_hit" | "validation_error" | "login_success",
  errorMessage?: string,
  metadata?: Record<string, unknown>
): Promise<void>
```

**Events logged:**
- `login_failed` — Password verification failed (invalid password)
- `rate_limit_hit` — IP exceeded threshold on endpoint
- `validation_error` — File upload validation failed (size, type, etc.)
- `login_success` — Successful authentication (optional, for audit trail)

**Supabase table schema:**
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  ip TEXT NOT NULL,
  event_type TEXT NOT NULL,
  error_message TEXT,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_audit_logs_ip_created ON audit_logs(ip, created_at);
```

**Implementation details:**
- Fire-and-forget async writes (doesn't block response)
- Failures logged to server console only
- No automatic retention policy (manual cleanup later if needed)
- User-agent captured for troubleshooting

#### 3. Session Persistence (`lib/session.ts` + database)

Migrate session token storage from in-memory Map to Supabase.

**Current behavior:**
```typescript
const tokenStore = new Map<string, { expiresAt: number }>()
```

**New behavior:**
```sql
CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  last_accessed_at TIMESTAMP DEFAULT now()
);
```

**Modified functions:**
```typescript
export function createSessionToken(): { token: string; expiresAt: number }
  // Generates token, inserts into sessions table, returns token + expiry

export function verifySessionToken(token: string): { valid: boolean; error?: string }
  // Queries sessions table, checks expiry, updates last_accessed_at if valid

export function deleteSessionToken(token: string): void
  // Deletes token from sessions table (logout)
```

**Implementation details:**
- Token format unchanged (64-char hex)
- Expiry still 1 hour (3600 seconds)
- `last_accessed_at` updated on each verification (for future refresh token logic)
- Automatic cleanup: Add database trigger or weekly cron to delete expired sessions

---

## File Changes

### New Files

**`app/lib/rate-limiter.ts`**
- RateLimiter class with per-IP tracking
- ~80 lines

**`app/lib/audit.ts`**
- auditLog function with Supabase integration
- ~50 lines

### Modified Files

**`app/lib/session.ts`**
- Replace in-memory Map with Supabase queries
- Preserve existing function signatures for backward compatibility
- ~40 lines changed

**`app/api/auth/login/route.ts`**
- Add loginLimiter instance
- Call check() before password verification
- Call auditLog() on failed attempts
- ~15 lines added

**`app/api/design/upload/route.ts`**
- Add uploadLimiter instance
- Call check() before processing file
- Call auditLog() on validation errors
- ~10 lines added

**`middleware.ts`** (no changes needed)
- Auth middleware continues to work unchanged

---

## Data Flow

### Successful Login
```
POST /api/auth/login
  ↓
Rate limiter check IP (allowed)
  ↓
Password verification (success)
  ↓
Create session token in DB
  ↓
Audit log: "login_success" (async)
  ↓
Return token in HTTP-only cookie
```

### Failed Login (Wrong Password)
```
POST /api/auth/login
  ↓
Rate limiter check IP (allowed)
  ↓
Password verification (fail)
  ↓
Audit log: "login_failed" (async)
  ↓
Return 401 Unauthorized
```

### Rate Limit Exceeded
```
POST /api/auth/login (6th attempt in 15 min)
  ↓
Rate limiter check IP (blocked)
  ↓
Audit log: "rate_limit_hit" (async)
  ↓
Return 429 Too Many Requests
```

### File Upload
```
POST /api/design/upload
  ↓
Rate limiter check IP (allowed)
  ↓
File validation (fail: size > 10MB)
  ↓
Audit log: "validation_error" (async)
  ↓
Return 400 Bad Request
```

---

## Error Handling

**Rate Limiter failures:**
- Missing IP: Fallback to generic limit (tolerate, no crash)
- Clock skew: Natural variance accepted (no strict validation)
- Memory growth: Expired windows auto-cleaned

**Audit Logging failures:**
- Supabase timeout: Log to console, don't block response
- Network failure: Same as above (async, fire-and-forget)
- Constraint violation: Very unlikely (token/IP combination unique)

**Session persistence failures:**
- Database connection lost: verifySessionToken returns valid: false (user sees 401)
- Token query timeout: Same as above
- Graceful degradation: Tool remains usable, just stricter auth

---

## Testing Strategy

### Unit Tests

**`lib/rate-limiter.test.ts`**
- Check allowance logic (5th request passes, 6th fails)
- Verify remaining count decreases
- Test window expiry (wait 15 min, counter resets)
- Test multiple IPs independently

**`lib/audit.test.ts`**
- Mock Supabase client
- Verify log structure matches schema
- Test async fire-and-forget behavior
- Verify error handling (no throw on Supabase failure)

**`lib/session.test.ts`**
- Mock Supabase client
- Verify token creation/insertion
- Verify token validation against DB
- Test expiry check
- Test last_accessed_at update

### Integration Tests

**Login flow:**
- POST `/api/auth/login` with correct password → 200, token set
- POST `/api/auth/login` with wrong password → 401, audit log created
- POST `/api/auth/login` 6 times → 6th request returns 429
- Verify audit_logs table has entries

**Upload flow:**
- POST `/api/design/upload` with valid file → 200, URL returned
- POST `/api/design/upload` with oversized file → 400, audit log created
- POST `/api/design/upload` 11 times in 1 min → 11th returns 429

**Session persistence:**
- Create token, query DB, verify it exists
- Wait for expiry, verify returns invalid
- Update last_accessed_at on each check

### Manual Verification

1. **Rate limiting:**
   - Open browser, POST to `/api/auth/login` 5 times (wrong password each time)
   - On 6th attempt, receive 429
   - Wait 15 minutes (or adjust window for testing)
   - 7th attempt succeeds

2. **Audit logging:**
   - Check `audit_logs` table in Supabase dashboard
   - Verify entries for each failed attempt with correct IP and timestamp

3. **Session persistence:**
   - Log in successfully
   - Check `sessions` table: token should exist with `expires_at` = now + 1 hour
   - Logout, verify token deleted
   - Verify old in-memory sessions don't work after deploy

---

## Backward Compatibility

**Session loss on deploy:**
- Current: Users with active sessions lose them (restart = session loss anyway)
- After: Same behavior, but sessions now come from Supabase
- Impact: Minimal (user re-logs in, nothing breaks)

**Rate limiter restart:**
- In-memory counters reset on server restart
- Acceptable (brief window where limits reset, unlikely attack window)

**Audit logging:**
- Only new events logged (no backfill of old behavior)
- No impact on existing functionality

---

## Future Enhancements (Phase 4+)

- **Refresh tokens:** Separate short-lived (1 hour) and long-lived (7 days) tokens
- **Multi-factor authentication:** 2FA for enhanced security
- **Session revocation:** Admin endpoint to invalidate specific sessions
- **Redis:** Replace in-memory rate limiter with Redis for multi-instance deployments
- **Audit retention policy:** Auto-delete logs older than 90 days
- **Rate limit tuning:** Adjust thresholds based on actual usage patterns

---

## Success Criteria

✅ Rate limiting prevents >5 login attempts per IP per 15 minutes
✅ Rate limiting prevents >10 uploads per IP per minute
✅ Audit logs created for failed auths and validation errors
✅ Sessions persist across server restarts
✅ Login flow remains unchanged (users don't notice)
✅ No performance regression (rate limiter <1ms overhead)
✅ All tests pass (unit + integration + manual)

---

## Deployment Notes

1. **Create Supabase tables** before deploying code
2. **No data migration needed** (sessions table starts empty)
3. **Environment variables unchanged** (DESIGN_TOOLS_PASSWORD stays as-is)
4. **Monitor audit_logs table** for unusual activity post-launch
5. **Set up weekly cleanup** job for expired sessions (optional, can add later)

---

## Summary

Phase 3 adds production-grade security to Carrier with minimal complexity:
- Simple per-IP rate limiting prevents brute force
- Async audit logging provides visibility without performance impact
- Persistent sessions enable future scaling

All three components are independent and can be tested/deployed separately if needed.
