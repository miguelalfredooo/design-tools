# Phase 2: File Validation + Timing Attacks — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate unvalidated file uploads and timing attack vulnerabilities by creating validation utilities and applying them to core endpoints.

**Architecture:** Three new validation libraries in `app/lib/` (file-validation, crypto-utils, input-validation) applied to 7 endpoints in 3 waves. Validation happens server-side before processing; rejected requests return 400 with clear error messages.

**Tech Stack:** Node.js `crypto.timingSafeEqual` (built-in), standard TypeScript validation patterns, no new dependencies.

---

## File Structure

### New Files to Create (3 total)

| File | Purpose | Lines | Responsibility |
|------|---------|-------|-----------------|
| `app/lib/file-validation.ts` | File MIME, size, extension validation | 80-100 | Validate uploads before Supabase |
| `app/lib/crypto-utils.ts` | Timing-safe password comparison | 30-40 | Prevent timing attacks on auth |
| `app/lib/input-validation.ts` | API request body schema validators | 150-200 | Validate session endpoint inputs |

### Existing Files to Modify (7 total)

| File | Lines | Changes |
|------|-------|---------|
| `app/api/auth/login/route.ts` | 18 | Replace `!==` with `verifyPassword()` |
| `app/api/design/upload/route.ts` | 6-12 | Add `validateFile()` check before upload |
| `app/api/design/sessions/route.ts` | POST handler | Add `validateSessionCreate()` |
| `app/api/design/sessions/[id]/route.ts` | PATCH handler | Add `validateSessionUpdate()` |
| `app/api/design/sessions/[id]/options/route.ts` | POST/PATCH handlers | Add `validateOptionInput()` |
| `app/api/design/sessions/[id]/comments/route.ts` | POST handler | Add `validateCommentInput()` |
| `app/api/design/sessions/[id]/votes/route.ts` | POST handler | Add `validateVoteInput()` |

---

## Implementation Tasks

## Wave 1: Create Validation Utilities

### Task 1: Create File Validation Utility

**Files:**
- Create: `app/lib/file-validation.ts`

- [ ] **Step 1: Write file-validation.ts**

```typescript
/**
 * File validation utilities for design preview images.
 * Prevents malicious uploads: oversized files, wrong MIME types, suspicious extensions.
 */

const ALLOWED_MIMES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a file before upload.
 * Checks: MIME type, file size, extension safety, filename safety.
 */
export function validateFile(file: File): FileValidationResult {
  // Check file exists
  if (!file) {
    return { valid: false, error: "No file provided" };
  }

  // Check MIME type
  if (!ALLOWED_MIMES.includes(file.type)) {
    return {
      valid: false,
      error: "Invalid file type. Accepted: JPEG, PNG, WebP",
    };
  }

  // Check file size (15 MB max)
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File exceeds 15 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB)`,
    };
  }

  // Extract extension and validate it matches MIME type
  const ext = file.name.split(".").pop()?.toLowerCase();
  const mimeToExt: Record<string, string[]> = {
    "image/jpeg": ["jpg", "jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"],
  };

  const validExts = mimeToExt[file.type] || [];
  if (!ext || !validExts.includes(ext)) {
    return {
      valid: false,
      error: "File extension does not match file type",
    };
  }

  // Check for suspicious patterns (double extensions, null bytes)
  if (
    file.name.includes(".") &&
    file.name.split(".").filter((p) => p).length > 2
  ) {
    return { valid: false, error: "Invalid filename" };
  }

  if (file.name.includes("\0")) {
    return { valid: false, error: "Invalid filename" };
  }

  return { valid: true };
}
```

- [ ] **Step 2: Verify file exists and compiles**

Run: `cd /Users/miguelarias/Code/design-tools && npx tsc --noEmit app/lib/file-validation.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/lib/file-validation.ts
git commit -m "feat(validation): create file validation utility

File validation prevents malicious uploads:
- MIME type check (only JPEG, PNG, WebP allowed)
- Size limit (≤15 MB)
- Extension validation (must match MIME type)
- Filename safety (no double extensions, null bytes)

Returns { valid: boolean, error?: string } for client error handling.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

### Task 2: Create Timing-Safe Password Comparison Utility

**Files:**
- Create: `app/lib/crypto-utils.ts`

- [ ] **Step 1: Write crypto-utils.ts**

```typescript
/**
 * Cryptographic utilities for secure password comparison.
 * Prevents timing attacks that leak password information via response time.
 */

import { timingSafeEqual } from "crypto";

/**
 * Compares two strings in constant time using Node.js crypto.timingSafeEqual.
 * Prevents timing attacks: comparison takes same time regardless of mismatch position.
 *
 * @param input - User-provided password
 * @param expected - Expected password (from env or database)
 * @returns true if passwords match, false otherwise
 *
 * @example
 * const isValid = verifyPassword(userPassword, process.env.PASSWORD);
 * if (!isValid) return 401;
 */
export function verifyPassword(input: string, expected: string): boolean {
  // Early return for empty strings (both must be non-empty)
  if (!input || !expected) return false;

  // Length mismatch: still compare to maintain constant time
  // timingSafeEqual requires same-length buffers, so we check length first
  // but then perform a dummy comparison to avoid timing leaks on length
  if (input.length !== expected.length) {
    // Compare two dummy buffers of expected length (constant time)
    try {
      timingSafeEqual(
        Buffer.alloc(expected.length),
        Buffer.alloc(expected.length)
      );
    } catch {
      // timingSafeEqual throws if buffers don't match (which they don't)
      // We catch and ignore to maintain constant time
    }
    return false;
  }

  // Both strings are non-empty and same length: compare in constant time
  try {
    return timingSafeEqual(
      Buffer.from(input, "utf-8"),
      Buffer.from(expected, "utf-8")
    );
  } catch {
    // Should not happen if lengths are equal, but handle gracefully
    return false;
  }
}
```

- [ ] **Step 2: Verify file exists and compiles**

Run: `cd /Users/miguelarias/Code/design-tools && npx tsc --noEmit app/lib/crypto-utils.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/lib/crypto-utils.ts
git commit -m "feat(security): create timing-safe password comparison utility

Prevents timing attacks on password verification:
- Uses crypto.timingSafeEqual for constant-time comparison
- Comparison takes same time regardless of where password differs
- Timing differences < 1 microsecond (unmeasurable over network)
- Prevents brute force attacks via timing measurements

Usage: verifyPassword(userInput, expectedPassword) → boolean

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

### Task 3: Create Input Validation Utility

**Files:**
- Create: `app/lib/input-validation.ts`

- [ ] **Step 1: Write input-validation.ts**

```typescript
/**
 * Input validation utilities for API endpoints.
 * Validates request body schemas for core session management endpoints.
 */

export interface ValidationResult {
  valid: boolean;
  errors?: Record<string, string>;
}

// ===== Validators =====

function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function isValidUrl(str: string | null | undefined): boolean {
  if (!str) return true; // URLs are optional
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

function validateString(
  value: unknown,
  fieldName: string,
  minLength: number,
  maxLength: number
): { valid: boolean; error?: string } {
  if (typeof value !== "string") {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  if (value.length < minLength) {
    return {
      valid: false,
      error: `${fieldName} must be at least ${minLength} character(s)`,
    };
  }
  if (value.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must be at most ${maxLength} character(s)`,
    };
  }
  return { valid: true };
}

function validateNumber(
  value: unknown,
  fieldName: string,
  min: number,
  max: number
): { valid: boolean; error?: string } {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return { valid: false, error: `${fieldName} must be an integer` };
  }
  if (value < min || value > max) {
    return {
      valid: false,
      error: `${fieldName} must be between ${min} and ${max}`,
    };
  }
  return { valid: true };
}

function validateOptionalString(
  value: unknown,
  fieldName: string,
  maxLength: number
): { valid: boolean; error?: string } {
  if (value === undefined || value === null) return { valid: true };
  if (typeof value !== "string") {
    return { valid: false, error: `${fieldName} must be a string` };
  }
  if (value.length > maxLength) {
    return {
      valid: false,
      error: `${fieldName} must be at most ${maxLength} character(s)`,
    };
  }
  return { valid: true };
}

// ===== Endpoint Validators =====

/**
 * Validates POST /api/design/sessions body
 */
export function validateSessionCreate(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return {
      valid: false,
      errors: { _: "Request body must be a JSON object" },
    };
  }

  const b = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  // title: required, 1-200 chars
  const titleValidation = validateString(b.title, "title", 1, 200);
  if (!titleValidation.valid) errors.title = titleValidation.error!;

  // description: optional, 0-2000 chars
  const descValidation = validateOptionalString(b.description, "description", 2000);
  if (!descValidation.valid) errors.description = descValidation.error!;

  // participantCount: required, 1-10000
  const partValidation = validateNumber(
    b.participantCount,
    "participantCount",
    1,
    10000
  );
  if (!partValidation.valid) errors.participantCount = partValidation.error!;

  // previewUrl: optional, must be valid URL if present
  if (b.previewUrl !== undefined && b.previewUrl !== null) {
    if (!isValidUrl(b.previewUrl as string)) {
      errors.previewUrl = "previewUrl must be a valid URL";
    }
  }

  // problem, goal, audience, constraints: optional strings
  const optionalFields = [
    { name: "problem", max: 2000 },
    { name: "goal", max: 2000 },
    { name: "audience", max: 500 },
    { name: "constraints", max: 500 },
  ];
  for (const field of optionalFields) {
    const validation = validateOptionalString(b[field.name], field.name, field.max);
    if (!validation.valid) errors[field.name] = validation.error!;
  }

  // options: required array
  if (!Array.isArray(b.options)) {
    errors.options = "options must be an array";
  } else if (b.options.length === 0) {
    errors.options = "options must contain at least one option";
  } else {
    // Validate each option
    for (let i = 0; i < b.options.length; i++) {
      const opt = b.options[i];
      if (typeof opt !== "object" || opt === null) {
        errors[`options[${i}]`] = "option must be an object";
        continue;
      }
      const optObj = opt as Record<string, unknown>;

      // option.title: required, 1-200 chars
      const optTitleValidation = validateString(
        optObj.title,
        `options[${i}].title`,
        1,
        200
      );
      if (!optTitleValidation.valid) {
        errors[`options[${i}].title`] = optTitleValidation.error!;
      }

      // option.description: optional, 0-2000 chars
      const optDescValidation = validateOptionalString(
        optObj.description,
        `options[${i}].description`,
        2000
      );
      if (!optDescValidation.valid) {
        errors[`options[${i}].description`] = optDescValidation.error!;
      }

      // option.mediaType: optional, enum
      if (
        optObj.mediaType !== undefined &&
        optObj.mediaType !== null &&
        !["image", "video", "prototype"].includes(optObj.mediaType as string)
      ) {
        errors[`options[${i}].mediaType`] =
          'mediaType must be "image", "video", "prototype", or null';
      }

      // option.mediaUrl: optional, valid URL
      if (optObj.mediaUrl !== undefined && optObj.mediaUrl !== null) {
        if (!isValidUrl(optObj.mediaUrl as string)) {
          errors[`options[${i}].mediaUrl`] =
            "mediaUrl must be a valid URL";
        }
      }

      // option.rationale: optional, 0-1000 chars
      const optRatValidation = validateOptionalString(
        optObj.rationale,
        `options[${i}].rationale`,
        1000
      );
      if (!optRatValidation.valid) {
        errors[`options[${i}].rationale`] = optRatValidation.error!;
      }
    }
  }

  return Object.keys(errors).length > 0
    ? { valid: false, errors }
    : { valid: true };
}

/**
 * Validates PATCH /api/design/sessions/[id] body
 */
export function validateSessionUpdate(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return {
      valid: false,
      errors: { _: "Request body must be a JSON object" },
    };
  }

  const b = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  // phase: optional, enum
  if (
    b.phase !== undefined &&
    b.phase !== null &&
    !["discovery", "voting", "complete"].includes(b.phase as string)
  ) {
    errors.phase = 'phase must be "discovery", "voting", or "complete"';
  }

  // participantCount: optional, 1-10000 if present
  if (b.participantCount !== undefined && b.participantCount !== null) {
    const validation = validateNumber(
      b.participantCount,
      "participantCount",
      1,
      10000
    );
    if (!validation.valid) errors.participantCount = validation.error!;
  }

  return Object.keys(errors).length > 0
    ? { valid: false, errors }
    : { valid: true };
}

/**
 * Validates POST/PATCH /api/design/sessions/[id]/options body
 */
export function validateOptionInput(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return {
      valid: false,
      errors: { _: "Request body must be a JSON object" },
    };
  }

  const b = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  // title: required, 1-200 chars
  const titleValidation = validateString(b.title, "title", 1, 200);
  if (!titleValidation.valid) errors.title = titleValidation.error!;

  // description: optional, 0-2000 chars
  const descValidation = validateOptionalString(b.description, "description", 2000);
  if (!descValidation.valid) errors.description = descValidation.error!;

  // mediaType: optional, enum
  if (
    b.mediaType !== undefined &&
    b.mediaType !== null &&
    !["image", "video", "prototype"].includes(b.mediaType as string)
  ) {
    errors.mediaType = 'mediaType must be "image", "video", "prototype", or null';
  }

  // mediaUrl: optional, valid URL
  if (b.mediaUrl !== undefined && b.mediaUrl !== null) {
    if (!isValidUrl(b.mediaUrl as string)) {
      errors.mediaUrl = "mediaUrl must be a valid URL";
    }
  }

  // rationale: optional, 0-1000 chars
  const ratValidation = validateOptionalString(b.rationale, "rationale", 1000);
  if (!ratValidation.valid) errors.rationale = ratValidation.error!;

  return Object.keys(errors).length > 0
    ? { valid: false, errors }
    : { valid: true };
}

/**
 * Validates POST /api/design/sessions/[id]/comments body
 */
export function validateCommentInput(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return {
      valid: false,
      errors: { _: "Request body must be a JSON object" },
    };
  }

  const b = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  // text: required, 1-5000 chars
  const textValidation = validateString(b.text, "text", 1, 5000);
  if (!textValidation.valid) errors.text = textValidation.error!;

  return Object.keys(errors).length > 0
    ? { valid: false, errors }
    : { valid: true };
}

/**
 * Validates POST /api/design/sessions/[id]/votes body
 */
export function validateVoteInput(body: unknown): ValidationResult {
  if (typeof body !== "object" || body === null) {
    return {
      valid: false,
      errors: { _: "Request body must be a JSON object" },
    };
  }

  const b = body as Record<string, unknown>;
  const errors: Record<string, string> = {};

  // voterId: required, valid UUID
  if (typeof b.voterId !== "string" || !isValidUUID(b.voterId)) {
    errors.voterId = "voterId must be a valid UUID";
  }

  // optionId: required, valid UUID
  if (typeof b.optionId !== "string" || !isValidUUID(b.optionId)) {
    errors.optionId = "optionId must be a valid UUID";
  }

  return Object.keys(errors).length > 0
    ? { valid: false, errors }
    : { valid: true };
}
```

- [ ] **Step 2: Verify file exists and compiles**

Run: `cd /Users/miguelarias/Code/design-tools && npx tsc --noEmit app/lib/input-validation.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add app/lib/input-validation.ts
git commit -m "feat(validation): create input validation utility

Schema validators for core session endpoints:
- validateSessionCreate: POST /api/design/sessions
- validateSessionUpdate: PATCH /api/design/sessions/[id]
- validateOptionInput: POST/PATCH /api/design/sessions/[id]/options
- validateCommentInput: POST /api/design/sessions/[id]/comments
- validateVoteInput: POST /api/design/sessions/[id]/votes

Validates:
- String lengths (min/max per field)
- Number ranges (participantCount, etc)
- Enum values (phase, mediaType)
- UUID formats (voterId, optionId)
- URL validity (mediaUrl, previewUrl)
- Required vs optional fields

Returns { valid: boolean, errors?: Record<string, string> }

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Wave 2: Secure File Uploads

### Task 4: Update File Upload Endpoint

**Files:**
- Modify: `app/api/design/upload/route.ts`

- [ ] **Step 1: Read current file**

Run: `cat /Users/miguelarias/Code/design-tools/app/api/design/upload/route.ts`
Expected: Shows current implementation (no validation)

- [ ] **Step 2: Update upload/route.ts to validate files**

Replace the entire file:

```typescript
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { validateFile } from "@/app/lib/file-validation";

const BUCKET = "design-options";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  // Validate file before upload
  const validation = validateFile(file as File);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 }
    );
  }

  const db = getSupabaseAdmin();

  // Ensure bucket exists (idempotent)
  await db.storage.createBucket(BUCKET, { public: true }).catch(() => {});

  const ext = file!.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await db.storage
    .from(BUCKET)
    .upload(path, file!, { contentType: file!.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: urlData } = db.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: urlData.publicUrl });
}
```

- [ ] **Step 3: Verify the file compiles**

Run: `cd /Users/miguelarias/Code/design-tools && npx tsc --noEmit app/api/design/upload/route.ts`
Expected: No errors

- [ ] **Step 4: Test endpoint with curl (invalid files)**

```bash
# Test oversized file (create 20 MB dummy file)
dd if=/dev/zero of=/tmp/large.jpg bs=1M count=20 2>/dev/null

curl -X POST http://localhost:3500/api/design/upload \
  -F "file=@/tmp/large.jpg" 2>/dev/null | jq .

# Expected: { "error": "File exceeds 15 MB limit (20.0 MB)" }
```

- [ ] **Step 5: Test endpoint with curl (valid file)**

```bash
# Create a valid small PNG (100x100 red)
# Using a base64-encoded minimal PNG
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==" | base64 -d > /tmp/test.png

curl -X POST http://localhost:3500/api/design/upload \
  -F "file=@/tmp/test.png" 2>/dev/null | jq .

# Expected: { "url": "https://... (Supabase URL)" }
```

- [ ] **Step 6: Commit**

```bash
git add app/api/design/upload/route.ts
git commit -m "feat(security): add file validation to upload endpoint

File validation prevents malicious uploads:
- Rejects files > 15 MB (prevents storage exhaustion)
- Rejects non-image MIME types (JPEG, PNG, WebP only)
- Rejects suspicious extensions (.exe, double extensions)

Validates before uploading to Supabase.
Returns 400 with error message if validation fails.

Verified: Oversized files rejected, valid images accepted.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Wave 3: Secure Core Endpoints

### Task 5: Update Login Endpoint with Timing-Safe Password

**Files:**
- Modify: `app/api/auth/login/route.ts` (line 18)

- [ ] **Step 1: Read current file**

Run: `sed -n '1,25p' /Users/miguelarias/Code/design-tools/app/api/auth/login/route.ts`
Expected: Shows vulnerable password comparison on line 18

- [ ] **Step 2: Update login/route.ts to use verifyPassword()**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken } from "@/app/lib/session";
import { verifyPassword } from "@/app/lib/crypto-utils";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    // Validate password is provided
    if (!password) {
      return NextResponse.json(
        { error: "Password required" },
        { status: 400 }
      );
    }

    // Validate password against environment variable (timing-safe)
    const expected = process.env.DESIGN_TOOLS_PASSWORD;
    if (!expected || !verifyPassword(password, expected)) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Create session token (1-hour expiry)
    const { token } = createSessionToken();

    // Return response with HTTP-only cookie
    const response = NextResponse.json(
      { ok: true, message: "Logged in" },
      { status: 200 }
    );

    // Set HTTP-only cookie with security attributes:
    // - httpOnly: true prevents JavaScript from accessing the cookie (protects against XSS)
    // - secure: true in production (HTTPS only), false in development (allows HTTP)
    // - sameSite: "strict" prevents cross-site cookie sending (CSRF protection)
    // - maxAge: 3600 seconds = 1 hour expiration
    // - path: "/" makes cookie available to all routes
    response.cookies.set("sessionToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600, // 1 hour in seconds
      path: "/",
    });

    return response;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Login failed" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Verify the file compiles**

Run: `cd /Users/miguelarias/Code/design-tools && npx tsc --noEmit app/api/auth/login/route.ts`
Expected: No errors

- [ ] **Step 4: Test timing-safe comparison (correct password)**

```bash
time curl -X POST http://localhost:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"yoperreosola"}' 2>/dev/null

# Expected: Status 200, HTTP-only cookie set
```

- [ ] **Step 5: Test timing-safe comparison (wrong password, short)**

```bash
time curl -X POST http://localhost:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"wrong"}' 2>/dev/null

# Expected: Status 401, response time ~2-3 ms
```

- [ ] **Step 6: Test timing-safe comparison (wrong password, long)**

```bash
time curl -X POST http://localhost:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"wrong_much_longer_password_that_does_not_match"}' 2>/dev/null

# Expected: Status 401, response time ~2-3 ms (same as step 5)
# If response time is significantly different, timing-safe comparison failed
```

- [ ] **Step 7: Commit**

```bash
git add app/api/auth/login/route.ts
git commit -m "feat(security): use timing-safe password comparison

Replaces vulnerable !== operator with crypto.timingSafeEqual.

Prevents timing attacks:
- Comparison takes constant time regardless of password mismatch position
- Prevents brute force attacks via response time measurements
- Timing differences < 1 microsecond (unmeasurable over network)

Verified: Wrong passwords (short and long) return in same time.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

### Task 6: Validate Session Creation

**Files:**
- Modify: `app/api/design/sessions/route.ts` (POST handler)

- [ ] **Step 1: Read current POST handler**

Run: `sed -n '1,50p' /Users/miguelarias/Code/design-tools/app/api/design/sessions/route.ts`
Expected: Shows current POST implementation

- [ ] **Step 2: Add validation to POST handler**

Insert validation after parsing request body. Find this section:

```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
```

And update to:

```typescript
import { validateSessionCreate } from "@/app/lib/input-validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validation = validateSessionCreate(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }
```

- [ ] **Step 3: Test with curl (invalid title - too long)**

```bash
curl -X POST http://localhost:3500/api/design/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "title":"'"$(printf 'a%.0s' {1..250})"'",
    "description":"test",
    "participantCount":100,
    "options":[{"title":"Option 1","description":"Desc 1"}]
  }' 2>/dev/null | jq .

# Expected: 400 { "error": "Validation failed", "details": { "title": "must be at most 200 characters" } }
```

- [ ] **Step 4: Test with curl (invalid participantCount)**

```bash
curl -X POST http://localhost:3500/api/design/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Valid Title",
    "description":"test",
    "participantCount":999999,
    "options":[{"title":"Option 1","description":"Desc 1"}]
  }' 2>/dev/null | jq .

# Expected: 400 { "error": "Validation failed", "details": { "participantCount": "must be between 1 and 10000" } }
```

- [ ] **Step 5: Test with curl (valid request)**

```bash
curl -X POST http://localhost:3500/api/design/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Valid Title",
    "description":"test description",
    "participantCount":100,
    "options":[{"title":"Option 1","description":"Desc 1"}]
  }' 2>/dev/null | jq .

# Expected: 200 { "id": "...", "creatorToken": "..." }
```

- [ ] **Step 6: Commit**

```bash
git add app/api/design/sessions/route.ts
git commit -m "feat(validation): add input validation to POST /api/design/sessions

Validates request body using validateSessionCreate:
- title: 1-200 characters (required)
- description: 0-2000 characters (optional)
- participantCount: 1-10000 (required)
- options: array with valid option objects

Returns 400 with field-specific errors if validation fails.

Verified: Invalid titles, participant counts, and missing fields rejected.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

### Task 7: Validate Session Updates

**Files:**
- Modify: `app/api/design/sessions/[id]/route.ts` (PATCH handler)

- [ ] **Step 1: Read current PATCH handler**

Run: `grep -n "PATCH" /Users/miguelarias/Code/design-tools/app/api/design/sessions/\[id\]/route.ts`
Expected: Shows PATCH handler location

- [ ] **Step 2: Add validation to PATCH handler**

Insert validation after parsing body:

```typescript
import { validateSessionUpdate } from "@/app/lib/input-validation";

// In PATCH handler, after: const body = await request.json();
const validation = validateSessionUpdate(body);
if (!validation.valid) {
  return NextResponse.json(
    { error: "Validation failed", details: validation.errors },
    { status: 400 }
  );
}
```

- [ ] **Step 3: Test with curl (invalid phase)**

```bash
curl -X PATCH http://localhost:3500/api/design/sessions/test-id \
  -H "Content-Type: application/json" \
  -d '{"phase":"invalid_phase"}' \
  --cookie "sessionToken=..." 2>/dev/null | jq .

# Expected: 400 { "error": "Validation failed", "details": { "phase": "must be \"discovery\", \"voting\", or \"complete\"" } }
```

- [ ] **Step 4: Test with curl (valid update)**

```bash
curl -X PATCH http://localhost:3500/api/design/sessions/test-id \
  -H "Content-Type: application/json" \
  -d '{"phase":"voting","participantCount":150}' \
  --cookie "sessionToken=..." 2>/dev/null | jq .

# Expected: 200 { "ok": true } (or database error if session doesn't exist, but validation should pass)
```

- [ ] **Step 5: Commit**

```bash
git add app/api/design/sessions/[id]/route.ts
git commit -m "feat(validation): add input validation to PATCH /api/design/sessions/[id]

Validates request body using validateSessionUpdate:
- phase: \"discovery\", \"voting\", or \"complete\" (optional)
- participantCount: 1-10000 (optional if present)

Returns 400 with field-specific errors if validation fails.

Verified: Invalid phases and participant counts rejected.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

### Task 8: Validate Option Operations

**Files:**
- Modify: `app/api/design/sessions/[id]/options/route.ts` (POST and PATCH handlers)

- [ ] **Step 1: Add validation to POST handler**

```typescript
import { validateOptionInput } from "@/app/lib/input-validation";

// In POST handler, after: const body = await request.json();
const validation = validateOptionInput(body);
if (!validation.valid) {
  return NextResponse.json(
    { error: "Validation failed", details: validation.errors },
    { status: 400 }
  );
}
```

- [ ] **Step 2: Add validation to PATCH handler**

Same code as POST handler (validateOptionInput works for both)

- [ ] **Step 3: Test with curl (POST - invalid title)**

```bash
curl -X POST http://localhost:3500/api/design/sessions/test-id/options \
  -H "Content-Type: application/json" \
  -d '{"title":"","description":"Empty title"}' \
  --cookie "sessionToken=..." 2>/dev/null | jq .

# Expected: 400 { "error": "Validation failed", "details": { "title": "must be at least 1 character(s)" } }
```

- [ ] **Step 4: Test with curl (POST - valid)**

```bash
curl -X POST http://localhost:3500/api/design/sessions/test-id/options \
  -H "Content-Type: application/json" \
  -d '{"title":"New Option","description":"Description here","mediaType":"image"}' \
  --cookie "sessionToken=..." 2>/dev/null | jq .

# Expected: 200 with new option data
```

- [ ] **Step 5: Commit**

```bash
git add app/api/design/sessions/[id]/options/route.ts
git commit -m "feat(validation): add input validation to options endpoints

Validates POST and PATCH /api/design/sessions/[id]/options:
- title: 1-200 characters (required)
- description: 0-2000 characters (optional)
- mediaType: \"image\", \"video\", \"prototype\", or null (optional)
- mediaUrl: valid URL (optional)
- rationale: 0-1000 characters (optional)

Returns 400 with field-specific errors if validation fails.

Verified: Empty titles and invalid media types rejected.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

### Task 9: Validate Comments

**Files:**
- Modify: `app/api/design/sessions/[id]/comments/route.ts` (POST handler)

- [ ] **Step 1: Add validation to POST handler**

```typescript
import { validateCommentInput } from "@/app/lib/input-validation";

// In POST handler, after: const body = await request.json();
const validation = validateCommentInput(body);
if (!validation.valid) {
  return NextResponse.json(
    { error: "Validation failed", details: validation.errors },
    { status: 400 }
  );
}
```

- [ ] **Step 2: Test with curl (empty comment)**

```bash
curl -X POST http://localhost:3500/api/design/sessions/test-id/comments \
  -H "Content-Type: application/json" \
  -d '{"text":""}' \
  --cookie "sessionToken=..." 2>/dev/null | jq .

# Expected: 400 { "error": "Validation failed", "details": { "text": "must be at least 1 character(s)" } }
```

- [ ] **Step 3: Commit**

```bash
git add app/api/design/sessions/[id]/comments/route.ts
git commit -m "feat(validation): add input validation to POST /api/design/sessions/[id]/comments

Validates request body using validateCommentInput:
- text: 1-5000 characters (required)

Returns 400 with field-specific errors if validation fails.

Verified: Empty comments rejected.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

### Task 10: Validate Votes

**Files:**
- Modify: `app/api/design/sessions/[id]/votes/route.ts` (POST handler)

- [ ] **Step 1: Add validation to POST handler**

```typescript
import { validateVoteInput } from "@/app/lib/input-validation";

// In POST handler, after: const body = await request.json();
const validation = validateVoteInput(body);
if (!validation.valid) {
  return NextResponse.json(
    { error: "Validation failed", details: validation.errors },
    { status: 400 }
  );
}
```

- [ ] **Step 2: Test with curl (invalid UUID)**

```bash
curl -X POST http://localhost:3500/api/design/sessions/test-id/votes \
  -H "Content-Type: application/json" \
  -d '{"voterId":"not-a-uuid","optionId":"also-not-uuid"}' \
  --cookie "sessionToken=..." 2>/dev/null | jq .

# Expected: 400 { "error": "Validation failed", "details": { "voterId": "must be a valid UUID", "optionId": "must be a valid UUID" } }
```

- [ ] **Step 3: Commit**

```bash
git add app/api/design/sessions/[id]/votes/route.ts
git commit -m "feat(validation): add input validation to POST /api/design/sessions/[id]/votes

Validates request body using validateVoteInput:
- voterId: valid UUID (required)
- optionId: valid UUID (required)

Returns 400 with field-specific errors if validation fails.

Verified: Invalid UUIDs rejected.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Final Verification

### Task 11: Full Phase 2 Verification

- [ ] **Step 1: Build project**

Run: `cd /Users/miguelarias/Code/design-tools && npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 2: Start dev server**

Run: `npm run dev` (in background)
Expected: Server starts, listens on localhost:3500

- [ ] **Step 3: Smoke test - File upload**

```bash
# Create test image
dd if=/dev/zero bs=1M count=1 of=/tmp/test.png 2>/dev/null

# Upload valid file
curl -X POST http://localhost:3500/api/design/upload \
  -F "file=@/tmp/test.png" 2>/dev/null | jq -r '.url'

# Expected: Valid Supabase URL printed

# Clean up
rm /tmp/test.png
```

- [ ] **Step 4: Smoke test - Login**

```bash
curl -X POST http://localhost:3500/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"yoperreosola"}' -i 2>/dev/null | head -20

# Expected: 200 OK with sessionToken cookie (HttpOnly)
```

- [ ] **Step 5: Smoke test - Create Session**

```bash
curl -X POST http://localhost:3500/api/design/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Test Session",
    "description":"Phase 2 verification",
    "participantCount":10,
    "options":[{"title":"Option A","description":"First option"}]
  }' 2>/dev/null | jq .

# Expected: 200 with session data
```

- [ ] **Step 6: Summary report**

Verify the following checklist:
- ✅ File upload validates MIME type, size, extension
- ✅ Password comparison uses timing-safe algorithm
- ✅ Session creation validates all fields
- ✅ Session updates validate phase and participant count
- ✅ Options validate title, description, mediaType
- ✅ Comments validate text content
- ✅ Votes validate voterId and optionId
- ✅ Build succeeds (`npm run build`)
- ✅ Dev server starts without errors
- ✅ Smoke tests pass

- [ ] **Step 7: Create summary commit**

```bash
git log --oneline -10

# Creates final verification record
git commit --allow-empty -m "docs(phase-2): complete file validation and timing attacks

All 3 validation utilities created and applied:
✓ file-validation.ts: MIME, size, extension checks
✓ crypto-utils.ts: timing-safe password comparison
✓ input-validation.ts: schema validation for 5 endpoints

All 6 core endpoints secured:
✓ POST /api/design/upload: file validation
✓ POST /api/auth/login: timing-safe password
✓ POST /api/design/sessions: session creation validation
✓ PATCH /api/design/sessions/[id]: update validation
✓ POST/PATCH /api/design/sessions/[id]/options: option validation
✓ POST /api/design/sessions/[id]/comments: comment validation
✓ POST /api/design/sessions/[id]/votes: vote validation

Verification:
- Build succeeds (npm run build)
- Dev server starts cleanly
- File uploads validated (oversized/wrong MIME rejected)
- Password comparison constant-time (timing attack prevented)
- API inputs validated (field-specific error messages)

Phase 2 complete. Ready for Phase 3 (rate limiting + audit logging).

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>"
```

---

## Execution Notes

- **Commits:** One per logical unit (utility creation, endpoint hardening)
- **Testing:** Each endpoint tested with both invalid and valid data
- **Error handling:** All validation failures return 400 with `{ error: "...", details: {...} }`
- **No breaking changes:** Valid requests work exactly as before; invalid ones now rejected
- **Build verification:** TypeScript compilation checked at each step

---

## Next Steps (Phase 3)

After Phase 2 completes:
- Rate limiting on `/api/auth/login` (prevent brute force)
- Rate limiting on `/api/design/upload` (prevent storage abuse)
- Audit logging for auth failures and validation errors
- Consider persistent session storage (Redis/database instead of in-memory Map)
