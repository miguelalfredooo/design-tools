import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "data", "design-directions.json");

export async function GET() {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const data = JSON.parse(raw);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json([]);
  }
}

export async function DELETE() {
  await fs.writeFile(FILE, "[]", "utf8");
  return NextResponse.json({ ok: true });
}
