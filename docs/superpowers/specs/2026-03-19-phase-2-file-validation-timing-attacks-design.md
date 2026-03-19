# Phase 2: File Validation + Timing Attacks — Design Specification

**Date:** 2026-03-19
**Status:** Design approved, ready for implementation
**Context:** Carrier design tool security hardening (Phase 1: tokens + CORS complete)

---

## Executive Summary

Phase 2 eliminates two critical security vulnerabilities:
1. **File upload endpoint** has no validation (accepts any file type/size, vulnerable to abuse and malware)
2. **Password comparison** uses simple `!==` operator (vulnerable to timing attacks allowing brute force)

**Solution:** Three new validation utilities + apply them to core endpoints (file uploads, password auth, API inputs).

**Dependencies:** None new. Uses Node.js built-ins (`crypto.timingSafeEqual`) and standard validation patterns.

---

## Vulnerability Details

### Vulnerability 1: Unvalidated File Uploads

**Current code** (`app/api/design/upload/route.ts`):
```typescript
const ext = file.name.split(".").pop() ?? "png";
const path = `${crypto.randomUUID()}.${ext}`;
await db.storage.from(BUCKET).upload(path, file, { contentType: file.type });
```

**Risks:**
- ❌ No file size limit → disk space exhaustion DoS
- ❌ No MIME type validation → trusts client (can upload .exe as .jpg)
- ❌ No extension whitelist → double extensions (.php.jpg) bypass filters
- ❌ No magic number verification → can rename any file as image

**Attack scenarios:**
- User uploads 1 GB file → exhausts Supabase storage quota
- Attacker uploads malware disguised as image → potential exploit if served to users
- Upload .php.jpg → if web server misconfigured, could execute as PHP

---

### Vulnerability 2: Timing Attack on Password Comparison

**Current code** (`app/api/auth/login/route.ts` line 18):
```typescript
const expected = process.env.DESIGN_TOOLS_PASSWORD;
if (!expected || password !== expected) {  // ❌ VULNERABLE
  return NextResponse.json({ error: "Invalid password" }, { status: 401 });
}
```

**Risk:**
- Simple `!==` comparison returns immediately on first mismatch
- Attacker measures response time with millisecond precision (via curl, timing attacks)
- Response time leaks password length and character-by-character information
- Example: "a" takes 0.5ms to fail, "aa" takes 1.0ms → attacker learns password starts with "a"

**Attack scenario:**
```bash
# Attacker measures response times for different inputs
curl -X POST ... -d '{"password":"a"}' -w '%{time_total}\n'      # 0.501 ms
curl -X POST ... -d '{"password":"b"}' -w '%{time_total}\n'      # 0.502 ms
curl -X POST ... -d '{"password":"c"}' -w '%{time_total}\n'      # 0.500 ms
# Pattern: "a" slightly slower → probably first character

# With enough measurements, attacker builds password: "yo", "yop", "yope", "yoper"...
```

**Cryptographic impact:**
- Reduces effective security of password from exponential to polynomial
- 10-char password should take ~10^20 guesses; timing attacks reduce to ~10^10 guesses
- Timing differences of 1-5 microseconds per character are measurable over network

---

## Solution Design

### Architecture

Three new validation utilities in `app/lib/`:

```
app/lib/
├── file-validation.ts      (80-100 lines)  — File MIME, size, extension checks
├── crypto-utils.ts         (30-40 lines)   — Timing-safe password comparison
└── input-validation.ts     (150-200 lines) — API request body schema validation
```

Applied to:
- **File uploads:** `app/api/design/upload/route.ts`
- **Password auth:** `app/api/auth/login/route.ts`
- **Core session endpoints:** Sessions, options, comments, votes (POST/PATCH bodies)

---

### Utility 1: File Validation

**Location:** `app/lib/file-validation.ts`

**Function signature:**
```typescript
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(file: File): FileValidationResult
```

**Validation rules:**

| Check | Rule | Rationale |
|-------|------|-----------|
| **Exists** | File object present | Prevent null/undefined uploads |
| **MIME type** | Must be `image/jpeg`, `image/png`, or `image/webp` | Only web-standard image formats |
| **File size** | ≤ 15 MB | Prevent storage exhaustion (middle of 10-20 MB range) |
| **Extension** | Must match MIME type (no .exe renamed as .jpg) | Prevent disguised malware |
| **Safe filename** | No double extensions (.php.jpg), no nulls | Prevent server exploits |

**Error responses:**
```typescript
// File missing
{ valid: false, error: "No file provided" }

// MIME type wrong
{ valid: false, error: "Invalid file type. Accepted: JPEG, PNG, WebP" }

// Too large
{ valid: false, error: "File exceeds 15 MB limit" }

// Extension mismatch
{ valid: false, error: "File extension does not match file type" }

// Suspicious filename
{ valid: false, error: "Invalid filename" }
```

**Usage in endpoint:**
```typescript
const validation = validateFile(file);
if (!validation.valid) {
  return NextResponse.json(
    { error: validation.error },
    { status: 400 }
  );
}
// File is now safe to upload
```

---

### Utility 2: Timing-Safe Password Comparison

**Location:** `app/lib/crypto-utils.ts`

**Function signature:**
```typescript
import { timingSafeEqual } from "crypto";

export function verifyPassword(
  input: string,
  expected: string
): boolean
```

**Implementation:**
```typescript
export function verifyPassword(input: string, expected: string): boolean {
  // Early return for empty strings (prevents timing leaks on null checks)
  if (!input || !expected) return false;

  // Length mismatch → still compare (constant time)
  // timingSafeEqual requires same-length buffers, so we handle mismatch first
  if (input.length !== expected.length) {
    // Compare against a dummy value to maintain constant time
    try {
      timingSafeEqual(
        Buffer.alloc(expected.length),
        Buffer.alloc(expected.length)
      );
    } catch {}
    return false;
  }

  // Compare in constant time
  try {
    return timingSafeEqual(
      Buffer.from(input, "utf-8"),
      Buffer.from(expected, "utf-8")
    );
  } catch {
    return false;
  }
}
```

**Cryptographic guarantees:**
- ✅ Takes same time whether password is completely wrong or almost right
- ✅ Timing differences < 1 microsecond (unmeasurable over network)
- ✅ Prevents character-by-character timing leaks

**Usage in endpoint:**
```typescript
// Before (vulnerable)
if (!expected || password !== expected) { ... }

// After (secure)
const isValid = verifyPassword(password, expected);
if (!isValid) { ... }
```

---

### Utility 3: Input Validation

**Location:** `app/lib/input-validation.ts`

**Validated endpoints and rules:**

#### POST `/api/design/sessions` (Create session)
```typescript
interface CreateSessionInput {
  title: string;                    // 1-200 chars
  description?: string;              // 0-2000 chars
  participantCount: number;          // 1-10000
  previewUrl?: string;               // Valid URL or null
  problem?: string;                  // 0-2000 chars
  goal?: string;                     // 0-2000 chars
  audience?: string;                 // 0-500 chars
  constraints?: string;              // 0-500 chars
  options: Array<{
    title: string;                   // 1-200 chars
    description?: string;            // 0-2000 chars
    mediaType?: "image" | "video" | "prototype";
    mediaUrl?: string;               // Valid URL or null
    rationale?: string;              // 0-1000 chars
  }>;
}
```

#### PATCH `/api/design/sessions/[id]`
```typescript
interface UpdateSessionInput {
  phase?: "discovery" | "voting" | "complete";
  participantCount?: number;         // 1-10000 if provided
}
```

#### POST/PATCH `/api/design/sessions/[id]/options`
```typescript
interface OptionInput {
  title: string;                    // 1-200 chars
  description?: string;             // 0-2000 chars
  mediaType?: "image" | "video" | "prototype";
  mediaUrl?: string;                // Valid URL or null
  rationale?: string;               // 0-1000 chars
}
```

#### POST `/api/design/sessions/[id]/comments`
```typescript
interface CommentInput {
  text: string;                     // 1-5000 chars
}
```

#### POST `/api/design/sessions/[id]/votes`
```typescript
interface VoteInput {
  voterId: string;                  // Valid UUID
  optionId: string;                 // Valid UUID
}
```

**Validation function pattern:**
```typescript
interface ValidationResult {
  valid: boolean;
  errors?: Record<string, string>;  // Field-specific errors
}

export function validateSessionCreate(body: unknown): ValidationResult {
  // Type guard + rule checks
  // Returns { valid: true } or { valid: false, errors: { field: "message" } }
}
```

**Error response format:**
```json
{
  "error": "Validation failed",
  "details": {
    "title": "Title must be 1-200 characters",
    "participantCount": "Participant count must be 1-10000"
  }
}
```

**Usage pattern in endpoints:**
```typescript
const validation = validateSessionCreate(await request.json());
if (!validation.valid) {
  return NextResponse.json(
    { error: "Validation failed", details: validation.errors },
    { status: 400 }
  );
}
```

---

## Implementation Plan: 3 Waves

### Wave 1: Create Validation Utilities
- Create `app/lib/file-validation.ts` with MIME/size/extension checks
- Create `app/lib/crypto-utils.ts` with timing-safe password comparison
- Create `app/lib/input-validation.ts` with schema validators for all endpoints
- Add unit tests for each utility

### Wave 2: Secure File Uploads
- Update `app/api/design/upload/route.ts` to call `validateFile()`
- Test: reject oversized files, wrong MIME types, suspicious extensions
- Test: accept valid JPEG, PNG, WebP files under 15 MB

### Wave 3: Secure Core Endpoints
- Update `app/api/auth/login/route.ts` to use `verifyPassword()`
- Update `app/api/design/sessions/route.ts` to validate POST body
- Update `app/api/design/sessions/[id]/route.ts` to validate PATCH body
- Update `app/api/design/sessions/[id]/options/route.ts` to validate POST/PATCH bodies
- Update `app/api/design/sessions/[id]/comments/route.ts` to validate POST body
- Update `app/api/design/sessions/[id]/votes/route.ts` to validate POST body
- Test: each endpoint rejects invalid data with 400 + field errors

---

## Testing & Verification

### Automated Tests

**File validation:**
```bash
✓ validateFile(file_15MB.jpg) → { valid: true }
✓ validateFile(file_20MB.jpg) → { valid: false, error: "exceeds 15 MB" }
✓ validateFile(malware.exe) → { valid: false, error: "Invalid file type" }
✓ validateFile(file.php.jpg) → { valid: false, error: "Invalid filename" }
✓ validateFile(image.png) → { valid: true }
```

**Crypto utilities:**
```bash
✓ verifyPassword("correct", "correct") → true
✓ verifyPassword("wrong", "correct") → false
✓ verifyPassword("short", "longer") → false
✓ verifyPassword("", "correct") → false
✓ All comparisons take 1-2 ms (constant time ✓)
```

**Input validation:**
```bash
✓ validateSessionCreate({ title: "Valid", options: [...] }) → { valid: true }
✓ validateSessionCreate({ title: "" }) → { valid: false, errors: { title: "required" } }
✓ validateSessionCreate({ participantCount: 999999 }) → { valid: false, errors: { participantCount: "max 10000" } }
✓ validateSessionCreate({ phase: "invalid" }) → { valid: false, errors: { phase: "must be..." } }
```

### Manual Verification

**File upload:**
```bash
# Test oversized file
curl -X POST http://localhost:3500/api/design/upload \
  -F "file=@large_30mb_image.jpg"
# Expected: 400 { error: "File exceeds 15 MB limit" }

# Test invalid file type
curl -X POST http://localhost:3500/api/design/upload \
  -F "file=@document.pdf"
# Expected: 400 { error: "Invalid file type..." }

# Test valid file
curl -X POST http://localhost:3500/api/design/upload \
  -F "file=@design.jpg"
# Expected: 200 { url: "https://..." }
```

**Timing-safe password:**
```bash
# Measure response times (should be constant)
time curl -X POST http://localhost:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"wrong1"}'
# Expected: ~2-3 ms

time curl -X POST http://localhost:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"wrong_much_longer_password"}'
# Expected: ~2-3 ms (same as above, not longer)
```

**Input validation:**
```bash
# Test invalid title (too long)
curl -X POST http://localhost:3500/api/design/sessions \
  -H "Content-Type: application/json" \
  -d '{"title":"'$(printf 'a%.0s' {1..250})'", "options": []}'
# Expected: 400 { error: "Validation failed", details: { title: "..." } }

# Test invalid participant count
curl -X POST http://localhost:3500/api/design/sessions \
  -H "Content-Type: application/json" \
  -d '{"title":"Valid", "participantCount": 999999, "options": []}'
# Expected: 400 { error: "Validation failed", details: { participantCount: "..." } }
```

---

## Success Criteria

- [ ] All 3 validation utilities created and tested
- [ ] File upload endpoint validates before uploading to Supabase
- [ ] Password comparison uses timing-safe algorithm (timingSafeEqual)
- [ ] Core session endpoints validate all input fields
- [ ] Invalid files rejected (oversized, wrong MIME, suspicious extensions)
- [ ] Invalid inputs rejected with 400 + field-specific error messages
- [ ] Timing test shows constant-time password comparison (2-3 ms regardless of input)
- [ ] Build succeeds (`npm run build`)
- [ ] Dev server starts without errors
- [ ] Manual smoke tests pass (upload file, login, create session with validation)

---

## Risk Assessment

### Low Risk
- Validation utilities use standard Node.js APIs (crypto.timingSafeEqual is battle-tested)
- No database changes required
- Validation is additive (existing endpoints gain protection, don't change behavior for valid requests)
- No new dependencies

### Potential Issues & Mitigation
| Issue | Likelihood | Mitigation |
|-------|------------|-----------|
| MIME type spoofing | Low | Validate magic bytes (file content), not just extension |
| File size bypass | Low | Check size before upload, reject at Supabase if limit changes |
| Unicode normalization in passwords | Low | Use UTF-8 encoding consistently (timingSafeEqual handles this) |
| Performance impact of validation | Low | Validation is fast (<5ms); upload bottleneck is Supabase, not validation |

### Rollback Strategy
1. Revert validation utility imports from endpoints
2. Routes return to unvalidated behavior
3. System functions as before (insecure, but no data loss)

---

## Files & Deliverables

### New Files (3)
- `app/lib/file-validation.ts` — File validation logic
- `app/lib/crypto-utils.ts` — Timing-safe password comparison
- `app/lib/input-validation.ts` — Schema validators for endpoints

### Modified Files (6)
- `app/api/design/upload/route.ts` — Add file validation
- `app/api/auth/login/route.ts` — Use timing-safe password
- `app/api/design/sessions/route.ts` — Validate POST body
- `app/api/design/sessions/[id]/route.ts` — Validate PATCH body
- `app/api/design/sessions/[id]/options/route.ts` — Validate POST/PATCH
- `app/api/design/sessions/[id]/comments/route.ts` — Validate POST body
- `app/api/design/sessions/[id]/votes/route.ts` — Validate POST body

### Tests
- Unit tests for each validation utility
- Integration tests for each modified endpoint

---

## Next Phase (Phase 3)

**Rate Limiting + Input Sanitization:**
- Rate limiting on login endpoint (prevent brute force)
- Rate limiting on file upload endpoint
- String sanitization (remove HTML/SQL injection attempts from user inputs)
- Audit logging (track auth failures, validation errors for security analysis)

---

## References

- OWASP File Upload Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
- Timing Attacks on HMAC-SHA-1: https://codahale.com/a-lesson-in-timing-attacks/
- Node.js crypto.timingSafeEqual: https://nodejs.org/api/crypto.html#crypto_crypto_timingsafeequal_a_b
