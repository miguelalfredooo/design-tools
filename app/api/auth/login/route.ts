// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSessionToken } from "@/app/lib/session";
import { verifyPassword } from "@/app/lib/crypto-utils";
import { loginLimiter } from "@/app/lib/rate-limiter";
import { auditLog } from "@/app/lib/audit";

/**
 * Extract client IP from request headers.
 * Checks x-forwarded-for first (proxy), then defaults to socket IP.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded ? forwarded.split(",")[0].trim() : request.ip || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    const userAgent = request.headers.get("user-agent") || undefined;

    // Check rate limit
    const limitCheck = loginLimiter.check(clientIp);
    if (!limitCheck.allowed) {
      // Log rate limit hit
      await auditLog("/api/auth/login", clientIp, "rate_limit_hit", "Max login attempts exceeded", {
        userAgent,
        remaining: limitCheck.remaining,
      });

      return NextResponse.json(
        { error: "Too many login attempts. Please try again later." },
        { status: 429 }
      );
    }

    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 });
    }

    const expected = process.env.DESIGN_TOOLS_PASSWORD;
    if (!expected || !verifyPassword(password, expected)) {
      // Log failed login
      await auditLog("/api/auth/login", clientIp, "login_failed", "Invalid password", {
        userAgent,
      });

      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    // Create session token (now persisted to Supabase)
    const { token } = await createSessionToken();

    // Log successful login (optional, for audit trail)
    await auditLog("/api/auth/login", clientIp, "login_success", undefined, {
      userAgent,
    });

    const response = NextResponse.json(
      { ok: true, message: "Logged in" },
      { status: 200 }
    );

    response.cookies.set("sessionToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3600,
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
