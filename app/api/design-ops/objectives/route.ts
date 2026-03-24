import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Objective } from "@/lib/design-ops-types";

const FILE_PATH = path.join(process.cwd(), "data", "objectives.json");
const FILE_DIR = path.dirname(FILE_PATH);

async function readObjectives() {
  try {
    const data = await fs.readFile(FILE_PATH, "utf-8");
    return JSON.parse(data).map((objective: Partial<Objective>) => ({
      id: objective.id,
      title: objective.title ?? "",
      metric: objective.metric ?? "",
      target: objective.target ?? "",
      description: objective.description ?? "",
      segmentIds: Array.isArray(objective.segmentIds) ? objective.segmentIds : [],
      lifecycleCohorts: Array.isArray(objective.lifecycleCohorts)
        ? objective.lifecycleCohorts
        : [],
      theoryOfSuccess: objective.theoryOfSuccess ?? "",
      createdAt: objective.createdAt ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

async function writeObjectives(objectives: unknown[]) {
  await fs.mkdir(FILE_DIR, { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(objectives, null, 2));
}

export async function GET() {
  const objectives = await readObjectives();
  return NextResponse.json(objectives);
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    title,
    metric,
    target,
    description,
    segmentIds,
    lifecycleCohorts,
    theoryOfSuccess,
  } = body;

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
    segmentIds: Array.isArray(segmentIds) ? segmentIds : [],
    lifecycleCohorts: Array.isArray(lifecycleCohorts) ? lifecycleCohorts : [],
    theoryOfSuccess: theoryOfSuccess || "",
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

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const body = await request.json();
  const objectives = await readObjectives();
  const index = objectives.findIndex((objective: Objective) => objective.id === id);

  if (index === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const current = objectives[index] as Objective;
  const updated: Objective = {
    ...current,
    title: body.title ?? current.title,
    metric: body.metric ?? current.metric,
    target: body.target ?? current.target,
    description: body.description ?? current.description,
    segmentIds: Array.isArray(body.segmentIds) ? body.segmentIds : current.segmentIds,
    lifecycleCohorts: Array.isArray(body.lifecycleCohorts)
      ? body.lifecycleCohorts
      : current.lifecycleCohorts,
    theoryOfSuccess: body.theoryOfSuccess ?? current.theoryOfSuccess ?? "",
  };

  objectives[index] = updated;
  await writeObjectives(objectives);

  return NextResponse.json(updated);
}
