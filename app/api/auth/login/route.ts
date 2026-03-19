import { NextRequest, NextResponse } from "next/server";
import { createSessionToken } from "@/app/lib/session";
import { verifyPassword } from "@/app/lib/crypto-utils";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password required" },
        { status: 400 }
      );
    }

    const expected = process.env.DESIGN_TOOLS_PASSWORD;
    if (!expected || !verifyPassword(password, expected)) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    const { token } = createSessionToken();

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
