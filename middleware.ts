import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only apply CORS to /api/design/* routes
  if (!pathname.startsWith("/api/design/")) {
    return NextResponse.next();
  }

  // Get request origin
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  // Determine allowed origins (same-origin + localhost for dev)
  const allowedOrigins = [
    `http://localhost:3500`,
    `http://localhost:3456`, // alfredo-studio dev port (if co-hosted)
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter(Boolean);

  // Check if request origin is allowed
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  // Handle preflight requests (browser checks CORS before actual request)
  if (request.method === "OPTIONS") {
    if (isAllowedOrigin) {
      return new NextResponse(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin!,
          "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Max-Age": "86400", // 24 hours
          "Access-Control-Allow-Credentials": "true", // Allow cookies
        },
      });
    }
    return new NextResponse(null, { status: 403 });
  }

  // For actual requests (GET, POST, PATCH, DELETE)
  const response = NextResponse.next();
  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  return response;
}

export const config = {
  matcher: "/api/design/:path*", // Only apply to /api/design/* routes
};
