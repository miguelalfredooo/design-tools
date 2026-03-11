import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const FILE_PATH = path.join(process.cwd(), "data", "objectives.json");

async function readObjectives() {
  try {
    const data = await fs.readFile(FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeObjectives(objectives: unknown[]) {
  await fs.writeFile(FILE_PATH, JSON.stringify(objectives, null, 2));
}

export async function GET() {
  const objectives = await readObjectives();
  return NextResponse.json(objectives);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { title, metric, target, description } = body;

  if (!title || !metric) {
    return NextResponse.json(
      { error: "title and metric are required" },
      { status: 400 }
    );
  }

  const objectives = await readObjectives();
  const newObjective = {
    id: crypto.randomUUID(),
    title,
    metric,
    target: target || "",
    description: description || "",
    createdAt: new Date().toISOString(),
  };

  objectives.push(newObjective);
  await writeObjectives(objectives);

  return NextResponse.json(newObjective, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const objectives = await readObjectives();
  const filtered = objectives.filter(
    (o: { id: string }) => o.id !== id
  );

  if (filtered.length === objectives.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await writeObjectives(filtered);
  return NextResponse.json({ ok: true });
}
