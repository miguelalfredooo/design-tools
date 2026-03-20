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
    !["setup", "voting", "revealed"].includes(b.phase as string)
  ) {
    errors.phase = 'phase must be "setup", "voting", or "revealed"';
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

  // optionId: required, must be UUID
  if (typeof b.optionId !== "string" || !isValidUUID(b.optionId)) {
    errors.optionId = "optionId must be a valid UUID";
  }

  // voterId: required, must be UUID
  if (typeof b.voterId !== "string" || !isValidUUID(b.voterId)) {
    errors.voterId = "voterId must be a valid UUID";
  }

  // voterName: required, non-empty string
  if (typeof b.voterName !== "string" || !b.voterName.trim()) {
    errors.voterName = "voterName is required";
  }

  // body/commentBody: required, 1-280 chars
  const commentValidation = validateString(b.body, "body", 1, 280);
  if (!commentValidation.valid) errors.body = commentValidation.error!;

  // xPct: required, number 0-100
  if (typeof b.xPct !== "number" || b.xPct < 0 || b.xPct > 100) {
    errors.xPct = "xPct must be a number between 0 and 100";
  }

  // yPct: required, number 0-100
  if (typeof b.yPct !== "number" || b.yPct < 0 || b.yPct > 100) {
    errors.yPct = "yPct must be a number between 0 and 100";
  }

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
