import { NextResponse } from "next/server";
import { verifySessionToken } from "./session";

/**
 * Type definition for a Next.js route handler.
 * Accepts a Request and returns a Promise<NextResponse>
 */
export type NextApiHandler = (request: Request) => Promise<NextResponse>;

/**
 * Validates a session token from the request cookies.
 *
 * @param request - The incoming request object
 * @returns Object with valid boolean and optional error message
 *
 * @example
 * const { valid, error } = validateSessionToken(request);
 * if (!valid) return NextResponse.json({ error }, { status: 401 });
 */
export async function validateSessionToken(request: Request): Promise<{
  valid: boolean;
  error?: string;
}> {
  // Extract the cookie header
  const cookieHeader = request.headers.get("cookie") || "";

  // Parse sessionToken from cookies
  // Format: "sessionToken=abc123; path=/; other=value"
  let sessionToken: string | null = null;

  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    if (trimmed.startsWith("sessionToken=")) {
      sessionToken = trimmed.substring("sessionToken=".length);
      break;
    }
  }

  // If no token found, return error
  if (!sessionToken) {
    return { valid: false, error: "Unauthorized" };
  }

  // Verify the token
  return await verifySessionToken(sessionToken);
}

/**
 * Higher-Order Function that wraps a Next.js route handler to enforce authentication.
 *
 * This middleware:
 * 1. Extracts the sessionToken from request cookies
 * 2. Validates the token against the in-memory store
 * 3. Returns 401 Unauthorized if the token is invalid or expired
 * 4. Calls the wrapped handler if authentication succeeds
 *
 * @param handler - The route handler to wrap
 * @returns A wrapped handler that enforces authentication
 *
 * @example
 * const handler = async (request: Request) => {
 *   return NextResponse.json({ ok: true });
 * };
 *
 * export const PATCH = withAuth(handler);
 * export const DELETE = withAuth(handler);
 */
export function withAuth(handler: NextApiHandler): NextApiHandler {
  return async (request: Request): Promise<NextResponse> => {
    // Validate session token from cookies
    const { valid, error } = await validateSessionToken(request);

    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Token is valid, call the wrapped handler
    return handler(request);
  };
}
