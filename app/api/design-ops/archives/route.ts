import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { DesignOpsArchive } from "@/lib/design-ops-types";

const FILE_PATH = path.join(process.cwd(), "data", "design-ops-archives.json");
const FILE_DIR = path.dirname(FILE_PATH);

async function readArchives(): Promise<DesignOpsArchive[]> {
  try {
    const data = await fs.readFile(FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeArchives(archives: DesignOpsArchive[]) {
  await fs.mkdir(FILE_DIR, { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(archives, null, 2));
}

export async function GET() {
  const archives = await readArchives();
  return NextResponse.json(archives);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { prompt, mode, objectives, messages, provider, model } = body;

  if (!prompt || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "prompt and messages are required" },
      { status: 400 }
    );
  }

  const archives = await readArchives();
  const newArchive: DesignOpsArchive = {
    id: crypto.randomUUID(),
    prompt,
    mode: mode || "quick_read",
    objectives: Array.isArray(objectives) ? objectives : [],
    messages,
    provider: provider || "",
    model: model || "",
    createdAt: new Date().toISOString(),
  };

  archives.unshift(newArchive);
  await writeArchives(archives);

  return NextResponse.json(newArchive, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const archives = await readArchives();
  const filtered = archives.filter((archive) => archive.id !== id);

  if (filtered.length === archives.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await writeArchives(filtered);
  return NextResponse.json({ ok: true });
}
