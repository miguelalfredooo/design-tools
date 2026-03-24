import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"
import type { DesignOpsModuleRecord } from "@/lib/design-ops-types"

const FILE_PATH = path.join(process.cwd(), "data", "design-ops-modules.json")

async function readModules(): Promise<DesignOpsModuleRecord[]> {
  try {
    const data = await fs.readFile(FILE_PATH, "utf-8")
    return JSON.parse(data)
  } catch {
    return []
  }
}

async function writeModules(modules: DesignOpsModuleRecord[]) {
  await fs.writeFile(FILE_PATH, JSON.stringify(modules, null, 2))
}

export async function GET() {
  return NextResponse.json(await readModules())
}

export async function POST(request: Request) {
  const body = await request.json()
  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }
  const modules = await readModules()
  const created: DesignOpsModuleRecord = {
    id: crypto.randomUUID(),
    name: body.name,
    status: body.status ?? "not_started",
    nextAction: body.nextAction,
    completedAt: body.completedAt,
    blockedReason: body.blockedReason,
    detail: body.detail,
    createdAt: new Date().toISOString(),
  }
  modules.push(created)
  await writeModules(modules)
  return NextResponse.json(created, { status: 201 })
}

export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  const body = await request.json()
  const modules = await readModules()
  const index = modules.findIndex((m) => m.id === id)
  if (index === -1) return NextResponse.json({ error: "not found" }, { status: 404 })

  const updated: DesignOpsModuleRecord = { ...modules[index], ...body, id }
  modules[index] = updated
  await writeModules(modules)
  return NextResponse.json(updated)
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

  const modules = await readModules()
  const filtered = modules.filter((m) => m.id !== id)
  if (filtered.length === modules.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 })
  }
  await writeModules(filtered)
  return NextResponse.json({ ok: true })
}
