import { NextRequest, NextResponse } from "next/server";
import { createSessionToken } from "@/app/lib/session";

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

    // Validate password against environment variable
    const expected = process.env.DESIGN_TOOLS_PASSWORD;
    if (!expected || password !== expected) {
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
