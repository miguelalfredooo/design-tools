import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = await request.json();
  const expected = process.env.DESIGN_TOOLS_PASSWORD;

  // Log deprecation notice to server logs (visible in terminal during development)
  console.warn(
    "[DEPRECATED] POST /api/auth is deprecated. Use POST /api/auth/login instead (returns HTTP-only cookie)."
  );

  if (!expected || password !== expected) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
