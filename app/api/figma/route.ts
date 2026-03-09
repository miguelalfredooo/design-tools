import { NextResponse } from "next/server";
import { figmaRequestSchema, fetchFigmaScreenshot } from "@/lib/figma";

export async function POST(request: Request) {
  const token = process.env.FIGMA_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "FIGMA_ACCESS_TOKEN is not configured on the server" },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = figmaRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request: fileKey and nodeId are required" },
      { status: 400 }
    );
  }

  try {
    const screenshotUrl = await fetchFigmaScreenshot(
      parsed.data.fileKey,
      parsed.data.nodeId,
      token
    );
    return NextResponse.json({ screenshotUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Figma API request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
