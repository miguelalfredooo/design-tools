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
