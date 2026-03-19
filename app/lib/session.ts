import { randomBytes } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabase-server";

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
  const token = randomBytes(32).toString("hex");

  // Set expiry to 1 hour from now
  const expiresAt = Date.now() + 3600000; // 3600000 ms = 1 hour
  const expiresAtISO = new Date(expiresAt).toISOString();

  const db = getSupabaseAdmin();

  // Insert token into sessions table
  const { error } = await db.from("sessions").insert({
    token,
    expires_at: expiresAtISO,
  });

  if (error) {
    console.error("[Session Error] Failed to create token:", error);
    throw new Error("Failed to create session token");
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
  if (!token || typeof token !== "string" || !token.match(/^[a-f0-9]+$/i)) {
    return { valid: false, error: "Token not found" };
  }

  const db = getSupabaseAdmin();

  // Query token from database
  const { data, error: queryError } = await db
    .from("sessions")
    .select("token, expires_at")
    .eq("token", token)
    .single();

  if (queryError || !data) {
    return { valid: false, error: "Token not found" };
  }

  // Check if token is expired
  const now = Date.now();
  const expiresAt = new Date(data.expires_at).getTime();

  if (expiresAt <= now) {
    // Clean up expired token
    await db.from("sessions").delete().eq("token", token);
    return { valid: false, error: "Token expired" };
  }

  // Update last_accessed_at
  await db
    .from("sessions")
    .update({ last_accessed_at: new Date().toISOString() })
    .eq("token", token);

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

  const { error } = await db.from("sessions").delete().eq("token", token);

  if (error) {
    console.error("[Session Error] Failed to delete token:", error);
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
    .from("sessions")
    .delete()
    .lt("expires_at", now);

  if (error) {
    console.error("[Session Error] Failed to cleanup tokens:", error);
  }
}
